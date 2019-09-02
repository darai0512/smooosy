import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { connect } from 'react-redux'
import { Hidden, CircularProgress } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { profilePage, unload } from 'modules/profile'
import { loadByProfile } from 'modules/proService'
import { loadMediaList } from 'modules/media'
import { sendLog } from 'modules/auth'
import BreadCrumb from 'components/BreadCrumb'
import QueryDialog from 'components/cards/QueryDialog'
import MediaSlider from 'components/MediaSlider'
import Footer from 'components/Footer'
import OGPMeta from 'components/OGPMeta'

import BadgeDialog from 'components/BadgeDialog'
import RelatedFooter from 'components/RelatedFooter'
import OneClickDialog from 'components/OneClickDialog'

import AboutPro from './AboutPro'
import Articles from './Articles'
import BusinessHour from './BusinessHour'
import EditHeader from './EditHeader'
import MediaList from './MediaList'
import Menus from './Menus'
import ProAnswers from './ProAnswers'
import ProSummary from './ProSummary'
import RequestBox from './RequestBox'
import ReviewList from './ReviewList'
import ServicePapersWrap from './ServicePapersWrap'

import { explicitSuspend } from 'lib/status'
import { geocode, latlngToGeoJSON, parseGeocodeResults } from 'lib/geocode'
import { parseQueryParams, getDialogInfo, formatConditions } from 'lib/instant'
import { prefectures, imageSizes, webOrigin, FlowTypes, BQEventTypes } from '@smooosy/config'
import { scrollAnimation } from 'lib/scroll'
import { logDataFromPS } from 'lib/proService'

@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
    marginBottom: 0,
    height: '100%',
    overflowY: 'scroll',
    WebkitOverflowScrolling: 'touch',
  },
  container: {
    display: 'flex',
    width: '100%',
    margin: '0 auto',
    maxWidth: 1024,
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  main: {
    width: '70%',
    paddingLeft: 15,
    paddingRight: 30,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      paddingRight: 10,
    },
  },
  relatedFooter: {
    paddingTop: 30,
    paddingBottom: 30,
    [theme.breakpoints.down('sm')]: {
      paddingBottom: 0,
    },
  },
  bread: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  breadRoot: {
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}), {withTheme: true})
@connect(
  state => ({
    user: state.auth.user,
    profile: state.profile.profile,
    mediaLists: state.media.mediaLists,
  }),
  { loadByProfile, profilePage, unload, loadMediaList, sendLog }
)
export default class ProfilePage extends React.Component {

  constructor(props) {
    super(props)
    const query = props.location.state || qs.parse(props.location.search, {ignoreQueryPrefix: true})

    this.state = {
      open: !!(query && query.modal),
      zip: query.zip || (props.profile ? (props.profile.zipcode || '') : ''),
      zipError: false,
      proService: null,
      priceLoading: false,
      requestId: query.requestId,
    }
    this.dialogInfo = {}
    this.scrollRefs = {}
  }

  getSelectedService = () => {
    const { profile, location } = this.props
    const query = qs.parse(location.search, {ignoreQueryPrefix: true})
    return profile && profile.services.length > 0 ?
        profile.services.find(s => s.id === query.serviceId && s.enabled) || profile.services.find(s => s.enabled) : null
  }

  componentDidMount() {
    if (!this.props.profile) {
      this.load()
        .then(() => this.loadProService(this.state.zip))
    } else {
      this.loadProService(this.state.zip)
    }
    this.scrollToAnchor()
  }

  componentWillUnmount() {
    if (!this.props.noUnload) {
      this.props.unload()
    }
  }

  componentDidUpdate(prevProps) {
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    const prevQuery = qs.parse(prevProps.location.search, {ignoreQueryPrefix: true})
    if (this.props.location.search !== prevProps.location.search) {
      const selectedService = this.getSelectedService()
      if (query.serviceId !== prevQuery.serviceId && selectedService) {
        this.loadProService(this.state.zip)
      }
    }
  }

  load = () => {
    return this.props.profilePage(this.props.shortId.split(/[^0-9A-Za-z\-_]/)[0])
      .then(({profile}) => {
        this.props.loadMediaList({profile: profile.id})
        const hash = this.props.location.hash.slice(1)
        const updateState = {}
        if (hash === 'badge') {
          updateState.openProBadge = true
        }
        if (!this.state.zip) {
          updateState.zip = (profile.zipcode || '')
        }
        this.setState(updateState)
      })
      .catch(() => this.props.history.replace('/'))
  }

  loadProService = (zip) => {
    this.queryParams = parseQueryParams(this.props.location.search)
    const selectedService = this.getSelectedService()
    if (selectedService && zip) {
      const { d, date, start, end } = parseQueryParams(this.props.location.search)
      const conditions = formatConditions(d)

      this.setState({priceLoading: true})
      // geocoding will use browser cache so it does not cost too much
      geocode({address: zip})
        .then((results) => {
          const latlng = results[0].geometry.location
          const loc = latlngToGeoJSON(latlng)
          return Promise.all([
            geocode(latlng),
            this.props.loadByProfile(selectedService.id, this.props.profile.id, loc, conditions, this.state.requestId),
          ])
            .then(([results, {proService}]) => {
              const parts = parseGeocodeResults(results)
              return { loc, parts, proService }
            })
        })
        .then(({loc, parts, proService}) => {
          const { prefecture, city, town } = parts
          const address = {
            valid: true,
            text: [prefecture, city, town].join(''),
          }

          this.dialogInfo = {
            ...this.dialogInfo,
            ...getDialogInfo({ service: proService.service, d, date, start, end, loc, address, ...parts }),
          }
          this.setState({proService, zip, zipError: false})
        })
        .catch((e) => {
          if (e.name === 'GeocodeError') {
            this.setState({zipError: true})
          }
        })
        .finally(() => this.setState({priceLoading: false}))
    } else {
      this.setState({priceLoading: false})
    }
  }

  onBlurZip = (zip) => {
    this.loadProService(zip)
  }

  onSelectService = (serviceId) => {
    const { profile } = this.props
    const service = profile.services.find(s => s.id === serviceId)
    this.props.history.replace(`${this.props.location.pathname}?serviceId=${service.id}`)
  }

  onOpen = () => {
    const { proService } = this.state
    if (proService && proService.request) {
      this.props.sendLog(BQEventTypes.match_more.OPEN_ONE_CLICK_PP_DIALOG, {
        userId: proService.user._id,
        profileId: proService.profile._id,
        serviceId: proService.service._id,
        proServiceId: proService._id,
        proService: logDataFromPS(proService),
      })
      return this.setState({oneClickProService: proService})
    }

    if (proService) {
      this.props.sendLog(BQEventTypes.match_more.OPEN_PP_DIALOG, {
        userId: proService.user._id,
        profileId: proService.profile._id,
        serviceId: proService.service._id,
        proServiceId: proService._id,
        proService: logDataFromPS(proService),
      })
    }

    this.setState({ open: true })
  }

  onClose = () => {
    this.setState({ open: false })
  }

  closeBadgeDialog = () => {
    const { profile } = this.props
    this.props.history.replace(`/p/${profile.shortId}`)
    this.setState({openProBadge: false})
  }

  calculatePosition = (element, target, adjustment) => {
    if (!element) return
    if (element.offsetTop === undefined) return
    if (element.parentNode === undefined) return
    adjustment = typeof adjustment === 'number' ? adjustment : 0
    return target.scrollTop + element.getBoundingClientRect().y - target.getBoundingClientRect().y + adjustment
  }

  scrollTo = (key) => {
    if (!this.scrollRefs[key]) return
    const { scrollAdjustment, scrollableEl } = this.props
    const target = scrollableEl || this.rootElement
    const adjustment = typeof scrollAdjustment === 'number' ? scrollAdjustment : -50
    const position = this.calculatePosition(this.scrollRefs[key], target, adjustment)
    if (target.scrollTop - 20 <= position && position <= target.scrollTop + 20) return
    setTimeout(() => scrollAnimation(target, position, 3), 100)
  }

  scrollToAnchor = () => {
    const hash = this.props.location.hash.slice(1)
    if (hash) {
      this.scrollTo(hash)
    }
  }

  onSubmitOneClickDialog = ({proService}) => {
    this.props.sendLog(BQEventTypes.match_more.CONVERSION_ONE_CLICK_PP_DIALOG, {
      requestId: proService.request._id,
      userId: proService.user._id,
      profileId: proService.profile._id,
      serviceId: proService.service._id,
      proServiceId: proService._id,
      proService: logDataFromPS(proService),
    })
    this.props.history.push(`/instant-results?serviceId=${proService.service._id}&requestId=${proService.request._id}`)
  }

  postRequestCreate = ({proService, request}) => {
    this.props.sendLog(BQEventTypes.match_more.CONVERSION_PP_DIALOG, {
      requestId: request._id,
      userId: proService.user._id,
      profileId: proService.profile._id,
      serviceId: proService.service._id,
      proServiceId: proService._id,
      proService: logDataFromPS(proService),
    })
  }

  render() {
    const { open, slideNumber, proService, priceLoading, zip, zipError } = this.state
    const { user, profile, mediaLists, classes, hideFooter, className } = this.props
    if (!profile) return <div className={[classes.loading, classes.root].join(' ')}><CircularProgress style={{width: 40, height: 40}} /></div>


    if (explicitSuspend(profile.suspend) || profile.hideProfile) this.props.history.push('/')

    const providingServices = profile.services ? profile.services.filter(s => s.enabled) : []
    let displayMedia = [...profile.media]
    if (mediaLists) {
      mediaLists.forEach(list => displayMedia.push(...list.media))
    }
    displayMedia = displayMedia.filter((m, i, self) => self.findIndex(t => t.id === m.id) === i)

    const currentPath = this.props.location.pathname

    const breads = [
      {path: '/', text: 'トップ'},
    ]
    if (profile.categoryKey) {
      breads.push({path: `/t/${profile.categoryKey}`, text: profile.category})
      if (prefectures[profile.prefecture]) {
        breads.push({path: `/t/${profile.categoryKey}/${prefectures[profile.prefecture]}`, text: profile.prefecture})
      }
    }
    breads.push({text: profile.name})

    const title = `${profile.name} - ${profile.address}`
    const keywords = [profile.address, profile.name, ...providingServices.map(s => s.name)].join(',')
    const description = profile.description || ''
    const currentURL = webOrigin + currentPath
    const rating = profile.reviews.length ? {
      avg: profile.averageRating,
      count: profile.reviews.length,
    } : null

    const selectedService = this.getSelectedService()
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})

    return [
      <div key='editBar'>{user.id === profile.pro.id && <EditHeader profileUrl={`/account/profiles/${profile.id}`} onClickShare={() => this.setState({openProBadge: true})} />}</div>,
      <div key='profilePage' className={[classes.root, className].join(' ')} ref={(e) => this.rootElement = e}>
        <Helmet titleTemplate=''>
          <title>{title}</title>
          <meta name='keywords' content={keywords} />
        </Helmet>
        <OGPMeta
          title={title}
          description={description}
          url={currentURL}
          shareImage={profile.pro.image + imageSizes.c320}
          width={320}
          height={320}
          twitterCard='summary'
          structuredDataType='LocalBusiness'
          rating={rating}
          postalCode={profile.zipcode}
          addressRegion={profile.prefecture}
          addressLocality={profile.city}
        />
        <div className={classes.container}>
          <div className={classes.main}>
            <Menus
              reviewCount={profile.reviews.length}
              mediaCount={displayMedia.length}
              scrollToAbout={() => this.scrollTo('about')}
              scrollToReview={() => this.scrollTo('review')}
              scrollToMedia={() => this.scrollTo('media')}
            />
            <ProSummary profile={profile} />
            <Hidden implementation='css' mdUp>
              {providingServices.length > 0 &&
                <RequestBox
                  selectedService={selectedService}
                  onClick={this.onOpen}
                  providingServices={providingServices}
                  onSelectService={this.onSelectService}
                  hasServiceId={!!query.serviceId}
                  price={proService ? proService.price : null}
                  priceLoading={priceLoading}
                  zip={zip}
                  onBlurZip={this.onBlurZip}
                />
              }
            </Hidden>
            <AboutPro aboutProRef={(e) => this.scrollRefs.about = e} profile={profile} proService={proService} hasServiceId={!!query.serviceId} onClick={this.onOpen} />
            {profile.reviews.length > 0 && <ReviewList reviewListRef={(e) => this.scrollRefs.review = e} averageRating={profile.averageRating} reviews={profile.reviews} readMore={this.state.readmoreReview} onClickReadMore={() => this.setState({readmoreReview: true})} />}
            {displayMedia.length > 0 && <MediaList mediaListRef={(e) => this.scrollRefs.media = e} media={displayMedia} onSelectMedia={(slideNumber) => this.setState({slideNumber})} />}
            {profile.proQuestions && profile.proQuestions.length > 0 && profile.proQuestions.filter(pq => pq.answer).length > 0 && <ProAnswers proQuestions={profile.proQuestions} readMore={this.state.readmoreProAnswer} onClickReadMore={() => this.setState({readmoreProAnswer: true})} />}
            {profile.pro.schedule && profile.pro.schedule.dayOff.length > 0 && <BusinessHour schedule={profile.pro.schedule} />}
            <ServicePapersWrap services={providingServices} prefecture={profile.prefecture} />
            <div className={classes.relatedFooter}>
              <RelatedFooter
                recommends={profile.recommends || []}
                trends={profile.trends || []} />
            </div>
            <Articles articles={profile.recommendArticles} />
            {!hideFooter &&
              <div className={classes.bread}>
                <BreadCrumb classRoot={classes.breadRoot} breads={breads} />
              </div>
            }
          </div>
          <Hidden implementation='css' smDown>
            {providingServices.length > 0 &&
              <RequestBox
                selectedService={selectedService}
                onClick={this.onOpen}
                providingServices={providingServices}
                onSelectService={this.onSelectService}
                hasServiceId={!!query.serviceId}
                price={proService ? proService.price : null}
                priceLoading={priceLoading}
                zip={zip}
                onBlurZip={this.onBlurZip}
                zipError={zipError}
              />
            }
          </Hidden>
        </div>
        {!hideFooter && <Footer />}
        {providingServices.length > 0 &&
          <QueryDialog
            noSimilarSelect
            open={!!open}
            serviceKey={selectedService.key}
            dialogInfo={this.dialogInfo}
            onClose={this.onClose}
            initialZip={zip}
            flowType={(proService && proService.isMatchMore && proService.service.matchMoreEnabled) ? FlowTypes.PPC : FlowTypes.MANUAL}
            specialSent={profile.id}
            zipError={zipError}
            postRequestCreate={(request) => this.postRequestCreate({proService, request})}
          />
        }
        <MediaSlider media={displayMedia} slideNumber={slideNumber} onClose={() => this.setState({slideNumber: null})} />
        {proService && proService.request &&
          <OneClickDialog
            proService={this.state.oneClickProService}
            service={proService.service}
            request={proService.request}
            onClose={() => this.setState({oneClickProService: null})}
            onSubmit={() => this.onSubmitOneClickDialog({proService})}
          />
        }
        <BadgeDialog profile={profile} open={this.state.openProBadge} onClose={() => this.closeBadgeDialog()} />
      </div>,
    ]
  }
}

