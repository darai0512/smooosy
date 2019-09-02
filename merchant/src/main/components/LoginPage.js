import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { login, fblogin, googlelogin, linelogin, reset as resetPassword } from 'modules/auth'
import { Redirect, Link } from 'react-router-dom'
import { Field, reduxForm, SubmissionError } from 'redux-form'
import { Paper, Button, CircularProgress } from '@material-ui/core'

import { withApiClient } from 'contexts/apiClient'
import renderTextInput from 'components/form/renderTextInput'
import LineLogin from 'components/LineLogin'
import FacebookLogin from 'components/FacebookLogin'
import GoogleLogin from 'components/GoogleLogin'
import SNSNoticeLink from 'components/SNSNoticeLink'
import { emailValidator, passwordValidator } from 'lib/validate'
import storage from 'lib/storage'

@withApiClient
@reduxForm({
  form: 'login',
  validate: values => ({
    ...emailValidator(values.email),
    ...passwordValidator(values.password),
  }),
})
@connect(
  state => ({
    user: state.auth.user,
    authFailed: state.auth.failed,
  }),
  { login, fblogin, googlelogin, linelogin, resetPassword }
)
export default class LoginPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  checkEmail = (values) => {
    return this.props.apiClient
      .get('/api/checkEmail', {params: values})
      .then(res => res.data.status)
      .then(status => {
        if (status === 'deactivate') {
          throw new SubmissionError({email: '退会済みのメールアドレスです'})
        } else if (status === 'nopass') {
          // XXX TODO: 一定時間に遅れる回数を制限したほうが良さげ
          // XXX TODO: いきなりメール送らずに
          return this.props.resetPassword(values.email).then(() => this.setState({sent: true}))
        } else if (status === 'no') {
          throw new SubmissionError({email: '登録されていないメールアドレスです'})
        } else {
          // XXX TODO: 遷移時にわかりやすいアニメーションつけたい
          this.setState({checkedEmail: values.email})
        }
      })
  }

  handleSubmit = (values) => {
    return this.props.login({email: this.state.checkedEmail, password: values.password})
  }

  onFacebookLogin = (values) => {
    return this.props.fblogin(values)
  }

  onGoogleLogin = (values) => {
    return this.props.googlelogin(values)
  }

  onLineLogin = (values) => {
    values.doNotSignup = true
    return this.props.linelogin(values)
  }

  onLineClick = () => {
    // LINEログインは一度SMOOOSY外に行くのでlocalStorageにfromを保存
    const { from } = this.props.location.state || {}
    storage.save('loginFrom', from)
  }

  render() {
    const { handleSubmit, submitting } = this.props

    if (!this.props.authFailed) {
      let { from } = this.props.location.state || {}
      // react-routerのlocation.state > localStorage(LINE用) > デフォルトURL
      from = from || storage.get('loginFrom') || (this.props.user.pro ? '/pros/requests' : '/requests')
      storage.remove('loginFrom')
      return <Redirect to={from} />
    }

    const styles = {
      paper: {
        padding: 32,
        width: 480,
        maxWidth: '100%',
        margin: '0px auto',
        marginTop: 32,
      },
      submitButton: {
        margin: '16px 0px',
        height: 50,
        width: '100%',
      },
    }

    if (this.state.sent) {
      return (
        <div>
          <Paper style={styles.paper}>
            <div style={{fontWeight: 'bold', color: '#333', fontSize: '110%'}}>ログイン用URLを送信しました</div>
            <div style={{marginTop: 20, fontSize: '90%', color: '#666'}}>
              <p>このアカウントにはパスワードが設定されていません。入力されたメールアドレス宛にログイン用のURLをお送りしましたので、手順に従ってパスワードを設定してください。</p>
              <p>no-reply@smooosy.com からのメールが見つからない場合は、迷惑メールフォルダを確認してください。</p>
            </div>
          </Paper>
        </div>
      )
    }

    const fromLineConnect = this.props.location.state && this.props.location.state.from.pathname === '/lineConnect'

    return (
      <div>
        <Helmet>
          <title>ログイン</title>
        </Helmet>
        <Paper style={styles.paper}>
          {
            !this.state.checkedEmail &&
            <form onSubmit={handleSubmit(this.checkEmail)}>
              <Field name='email' component={renderTextInput} label='メールアドレス' type='email' normalize={s => s.trim()} />
              <Button
                variant='contained'
                type='submit'
                disabled={submitting}
                color='primary'
                style={styles.submitButton}
              >
                {submitting ? <CircularProgress size={20} color='secondary' /> : '次へ'}
              </Button>
            </form>
          }
          {
            this.state.checkedEmail &&
            <form onSubmit={handleSubmit(this.handleSubmit)}>
              <div style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>メールアドレス</div>
              <div style={{margin: '5px 0 15px'}}>{this.state.checkedEmail}</div>
              <Field autoFocus name='password' component={renderTextInput} label='パスワード' type='password' />
              <div style={{fontSize: '13px'}}>
                <div style={{marginTop: 8}}><Link to='/reset'>パスワードを忘れた方はこちら</Link></div>
              </div>
              <Button variant='contained'
                type='submit'
                disabled={submitting}
                color='primary'
                style={styles.submitButton}
              >
                {submitting ? <CircularProgress size={20} color='secondary' /> : 'ログイン'}
              </Button>
            </form>
          }
        </Paper>
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{margin: 30, fontSize: 18}}>OR</div>
          {!fromLineConnect && <LineLogin showAlways style={{marginBottom: 20}} onLogin={this.onLineLogin} page='/login' onClick={this.onLineClick} />}
          <GoogleLogin text='Googleでログイン' style={{marginBottom: 20, fontSize: 14, fontWeight: 'normal', width: 200, height: 50}} onLogin={this.onGoogleLogin} />
          <FacebookLogin style={{textAlign: 'center'}} onLogin={this.onFacebookLogin} />
          <SNSNoticeLink />
          <div style={{margin: 20, textAlign: 'center', fontSize: '13px'}}>
            <div style={{marginTop: 8}}><Link to='/signup'>アカウント登録</Link></div>
          </div>
        </div>
      </div>
    )
  }
}
