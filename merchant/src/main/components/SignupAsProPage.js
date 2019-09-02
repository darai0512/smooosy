import React from 'react'
import ReactGA from 'react-ga'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import qs from 'qs'
import { formValueSelector, reduxForm } from 'redux-form'
import { Redirect } from 'react-router-dom'

import { withApiClient } from 'contexts/apiClient'
import { signup, load as loadUser } from 'modules/auth'
import { loadAll as loadServices } from 'modules/service'
import { loadAll as loadProfiles, create as createProfile } from 'modules/profile'
import { loadAll as loadMedia } from 'modules/media'
import { trimWhitespace, emailWarn, emailValidator, passwordValidator, phoneValidator } from 'lib/validate'
import { zenhan } from 'lib/string'
import storage from 'lib/storage'

import SignupAsPro from 'components/SignupAsPro'

const selector = formValueSelector('signup-pro')

@withApiClient
@connect(
  state => ({
    user: state.auth.user,
    authFailed: state.auth.failed,
    profiles: state.profile.profiles,
    services: state.service.allServices,
    address: selector(state, 'profile.address'),
    loc: selector(state, 'profile.loc'),
  }),
  { signup, loadUser, loadProfiles, createProfile, loadMedia, loadServices }
)
@reduxForm({
  form: 'signup-pro',
  initialValues: storage.get('signup-pro-draft') ||  {
    pro: true,
    profile: {
      services: {},
      visiting: true,
      visited: true,
    },
  },
  onChange: (values) => {
    if (Object.values(values).filter(v => v).length) {
      const draft = storage.get('signup-pro-draft') || {}
      storage.save('signup-pro-draft', Object.assign(draft, values))
    }
  },
  validate: (values, props) => {
    const { email, password, phone, lastname, profile } = values
    const errors = {
      ...emailValidator(email),
      ...passwordValidator(password),
      ...phoneValidator(zenhan(phone), true),
    }
    if (!trimWhitespace(lastname)) {
      errors.lastname = '必須項目です'
    }
    if (profile) {
      errors.profile = {}
      if (!trimWhitespace(profile.name)) {
        errors.profile.name = '必須項目です'
      } else if (props.profiles && props.profiles.map(p => p.name).includes(profile.name)) {
        errors.profile.name = 'この名前は別のプロフィールで利用中です'
      }
      if (!profile.loc) {
        errors.profile.loc = 'サービス拠点を入力してください'
      }
    }
    return errors
  },
  warn: values => ({
    ...emailWarn(values.email),
  }),
})
export default class SignupAsProPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      myServices: [],
      related: [],
    }
  }

  componentDidMount() {
    const { authFailed, user, location, loadProfiles, change, history } = this.props
    // arrayLimitを大きくしない場合、配列のサイズが20を越えるとオブジェクトに変換されてしまう
    const { selected = [], name, email, initialLoc } = qs.parse(location.search, {ignoreQueryPrefix: true, arrayLimit: Infinity})
    if (!selected.length) return history.replace('/pro')

    this.props.loadServices()
      .then(() => {
        const { services } = this.props
        const main = services.filter(s => selected.includes(s.id))
        this.setState({selected: main})
        const tags = Array.from(new Set([].concat(...main.map(s => s.tags))))
        return this.props.apiClient
          .get('/api/search/services', { params: { query: tags.join(' ') } })
      })
      .then(res => res.data.data)
      .then(related => {
        this.setState({
          related: related.filter(s => !selected.includes(s.id)),
        })
      })

    if (!authFailed) {
      if (user.corporation) {
        change('profile.name', user.lastname)
      } else {
        change('lastname', user.lastname)
        change('firstname', user.firstname || '')
      }
      loadProfiles().then(res => {
        const myServices = [].concat(...res.profiles.map(p => p.services.map(s => s.id)))
        this.setState({myServices})
        myServices.map(id => {
          change(`profile.services[${id}]`, false)
        })
      })
      this.props.loadMedia()
    }
    change('profile.name', name)
    change('email', email)
    selected.map(s => {
      change(`profile.services[${s}]`, true)
    })
    if (initialLoc) {
      this.setState({initialLoc})
    }
  }

  handlePrev = e => {
    if (e && e.preventDefault) e.preventDefault()
    this.props.history.goBack()
    document.body.scrollTop = 0
  }

  handleNext = e => {
    if (e && e.preventDefault) e.preventDefault()
    const query = this.props.location.search
    const idx = parseInt(this.props.match.params.idx, 10) || 0

    this.props.history.push(`/signup-pro/${idx+1}${query}`)
    document.body.scrollTop = 0
  }

  onMapChange = (location) => {
    if (!location) return
    const {loc, zipcode, address, prefecture, city} = location
    this.props.change('profile.loc', loc)
    this.props.change('profile.zipcode', zipcode)
    this.props.change('profile.address', address)
    this.props.change('profile.prefecture', prefecture)
    this.props.change('profile.city', city)
  }

  handleSubmit = (values) => {
    const { phone, profile } = values
    const prof = {
      ...profile,
      name: trimWhitespace(profile.name),
      services: Object.keys(profile.services).filter(key => profile.services[key]),
    }
    storage.remove('signup-pro-draft')
    if (phone) {
      prof.phone = zenhan(phone)
    }
    return this.becomePro(prof)
  }

  handleSignup = (values) => {
    const { authFailed } = this.props
    const { phone, lastname, firstname, ...rest } = values
    if (authFailed) {
      return this.signup({
        ...rest,
        lastname: trimWhitespace(lastname),
        firstname: trimWhitespace(firstname),
        phone: zenhan(phone),
      })
    }
    return this.handleNext()
  }

  signup = (values) => {
    delete values.pro
    delete values.profile
    const queryData = this.getQueryData()

    return this.props.signup({...values, ...queryData}).then(() => this.handleNext())
  }

  becomePro = (profile) => {
    const queryData = this.getQueryData()
    const isNewPro = this.props.profiles.length === 0

    return this.props.createProfile({...profile, ...queryData})
      .then((res) => {
        if (isNewPro) {
          this.trackConversion(res.profile)
        }
        this.props.loadUser()
          .then(() => {
            if (queryData.requestId) {
              this.props.history.push(`/pros/requests/${queryData.requestId}`)
            } else {
              this.props.history.push(`/pros/requests?mode=signup&profileId=${res.profile.id}`)
            }
          })
      })
  }

  trackConversion = (profile) => {
    const user = profile.pro
    ReactGA.set({ userId: user.id, dimension1: 1, dimension2: user.id || '' })
    ReactGA.modalview(`/become-pro/${user.id}`)

    window.mixpanel && window.mixpanel.track('pro: signup', {profile})
    window.fbq && window.fbq('track', 'CompleteRegistration')
    window.adwords_conversion && window.adwords_conversion({
      event_id: 'GrNCCKz1t5EBEK-RjPEC',
      type: 'pro',
    })
    window.yahoo_conversion && window.yahoo_conversion({label: '_yyjCPm_opEBELjaofEC', type: 'pro'})
    window.yahoo_ydn_conversion && window.yahoo_ydn_conversion('FM1UOIRS5JZNBJBI27B527924')
  }

  getQueryData = () => {
    const values = {}
    const { refer, utm_medium, utm_source, utm_content, utm_name, utm_term, email, requestId } = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    if (refer) {
      values.refer = refer
      values.questions = 'refer'
    }
    if (utm_medium) {
      values.questions = utm_medium
    }
    if (utm_source) {
      values.source = utm_source
    }
    if (utm_content) {
      values.content = utm_content
    }
    if (utm_name) {
      values.utm_name = utm_name
    }
    if (utm_term) {
      values.utm_term = utm_term
    }
    if (email) {
      values.sentEmail = email
    }
    if (requestId) {
      values.requestId = requestId
    }
    return values
  }

  render() {
    const { profiles, loc, address } = this.props
    const { myServices, selected, related, initialLoc } = this.state

    if (profiles && profiles.length > 0) {
      return <Redirect to='/pros/requests' />
    }
    if (!selected) return null

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingTop: 60,
      },
    }

    return (
      <div style={styles.root}>
        <Helmet>
          <title>事業者情報を入力</title>
        </Helmet>
        <SignupAsPro
          {...this.props}
          onSubmit={this.handleSubmit}
          onSignup={this.handleSignup}
          handleNext={this.handleNext}
          handlePrev={this.handlePrev}
          onMapChange={this.onMapChange}
          loc={loc}
          address={address}
          initialLoc={initialLoc}
          myServices={myServices}
          selected={selected}
          related={related}
        />
      </div>
    )
  }
}
