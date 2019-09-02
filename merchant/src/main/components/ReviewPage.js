import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import qs from 'qs'
import { load as loadProfile, review } from 'modules/profile'
import { Paper, Button, CircularProgress, MenuItem } from '@material-ui/core'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderSelect from 'components/form/renderSelect'
import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'
import Notice from 'components/Notice'
import { hasNGWords } from 'lib/validate'

@reduxForm({
  form: 'review',
  initialValues: {},
  validate: values => {
    const errors = {}
    if (!values.service) {
      errors.service = '選択してください'
    }
    if (!values.username) {
      errors.username = '入力してください'
    }
    if (!values.text) {
      errors.text = '入力してください'
    } else if (hasNGWords(values.text)) {
      errors.text = 'NGワードが含まれています'
    }
    return errors
  },
})
@connect(
  state => ({
    user: state.auth.user,
    profile: state.profile.profile,
    values: state.form.review.values,
  }),
  { loadProfile, review }
)
export default class ReviewPage extends React.Component {
  constructor(props) {
    super(props)
    const query = qs.parse(props.location.search.slice(1))
    this.state = {
      rating: query.rating || null,
      sent: false,
    }
  }

  componentDidMount() {
    this.props.loadProfile(this.props.match.params.id)
    if (this.props.user) {
      this.props.change('username', this.props.user.lastname)
    }
  }

  handleSubmit = (values) => {
    const {user, profile} = this.props
    if (user.id === profile.pro.id) return

    values.rating = this.state.rating
    if (user.id) {
      values.user = user.id
      values.username = user.lastname
    }
    if (values.service === 'other') {
      delete values.service
    }
    return this.props.review(profile.id, values)
      .then(() => this.setState({sent: true}))
  }

  handleRating = (rating) => {
    this.setState({rating})
  }

  render() {
    const { user, profile, handleSubmit, submitting, values } = this.props

    if (!profile) {
      return null
    }

    const styles = {
      main: {
        maxWidth: 600,
        margin: '20px auto',
        padding: 20,
        textAlign: 'center',
      },
    }

    if (this.state.sent) {
      return (
        <Paper style={styles.main}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <UserAvatar user={profile.pro} alt={profile.name} style={{width: 80, height: 80}} />
          </div>
          <h3>{profile.name}</h3>
          <br />
          <h4>ご協力ありがとうございました</h4>
          <br />
          <Link to='/'><Button variant='contained' color='primary' >SMOOOSYトップ</Button></Link>
        </Paper>
      )
    }

    return (
      <div>
        <Helmet>
          <title>{`${profile.name}のクチコミを投稿`}</title>
          <meta name='robots' content='noindex' />
        </Helmet>
        <Paper style={styles.main}>
          {user.id === profile.pro.id && <Notice style={{textAlign: 'left', margin: 10}}>プレビューです。ご本人はクチコミできません。</Notice>}
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <UserAvatar user={profile.pro} alt={profile.name} style={{width: 80, height: 80}} />
          </div>
          <h3>{profile.name}</h3>
          <br />
          <h4>クチコミにご協力ください！</h4>
          <div style={{width: 150, margin: '0 auto'}}>
            <RatingStar canChange rating={this.state.rating} onChange={this.handleRating} />
          </div>
        </Paper>
        {this.state.rating &&
          <Paper style={styles.main}>
            <form style={{textAlign: 'left'}} onSubmit={handleSubmit(this.handleSubmit)}>
              <Field name='service' label='依頼したサービス' component={renderSelect} style={{width: '100%', marginBottom: 16}}>
                {profile.services.map(s => <MenuItem key={s.id} value={s.id} >{s.name}</MenuItem>)}
                <MenuItem value='other'>その他</MenuItem>
              </Field>
              {this.state.rating && values.service &&
                <div>
                  {(!user.id || user.id === profile.pro.id) &&
                    <Field style={{width: '80%'}} component={renderTextInput} label='お名前' name='username' />
                  }
                  <Field component={renderTextArea} name='text' textareaStyle={{height: 150}} placeholder='家族写真の撮影をしていただきました。&#13;&#10;チャットのレスポンスも丁寧で、安心して依頼することができました。&#13;&#10;撮影時には様々な構図を提案していただきとても助かりました。&#13;&#10;ありがとうございました。' />
                  <div style={{display: 'flex'}}>
                    <div style={{flex: 1}} />
                    <Button variant='contained'
                      type='submit'
                      color='primary'
                      disabled={user.id === profile.pro.id}
                    >
                    {submitting ? <CircularProgress size={20} color='secondary' /> : '送信する'}
                    </Button>
                  </div>
                </div>
              }
            </form>
          </Paper>
        }
      </div>
    )
  }
}
