import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { login, fblogin, googlelogin } from 'tools/modules/auth'
import { Field, reduxForm } from 'redux-form'
import { Paper, Button, CircularProgress } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import renderTextInput from 'components/form/renderTextInput'
import GoogleLogin from 'components/GoogleLogin'
import FacebookLogin from 'components/FacebookLogin'

@reduxForm({
  form: 'login',
})
@connect(
  state => ({
    admin: state.auth.admin,
  }),
  { login, fblogin, googlelogin }
)
@withTheme
export default class LoginPage extends React.Component {

  handleSubmit = (values) => {
    return this.props.login({email: values.email, password: values.password})
  }

  onFacebookLogin = (values) => {
    return this.props.fblogin(values)
  }

  onGoogleLogin = (values) => {
    return this.props.googlelogin(values)
  }

  render() {
    if (this.props.admin) {
      return <Redirect to={(this.props.location.state && this.props.location.state.from) || '/'} />
    }

    const { handleSubmit, submitting, theme } = this.props

    const { grey } = theme.palette

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: grey[100],
      },
    }

    return (
      <div style={styles.root}>
        <img src='/images/logo.png' style={{width: 320, marginBottom: 32}} />
        <Paper style={{padding: 32, width: 320}}>
          <form name='login' onSubmit={handleSubmit(this.handleSubmit)}>
            <div style={{height: 86}}>
              <Field autoFocus={true} name='email' component={renderTextInput} label='メールアドレス' type='text' />
            </div>
            <div style={{height: 86}}>
              <Field name='password' component={renderTextInput} label='パスワード' type='password' />
            </div>
            <Button
              variant='contained'
              type='submit'
              disabled={submitting}
              color='primary'
              style={{marginTop: 16, height: 50, width: '100%'}}
            >
              {submitting ? <CircularProgress size={20} color='secondary' /> : 'ログイン'}
            </Button>
            <div style={{fontSize: '13px', marginTop: 8}}>
              <a href='/reset'>パスワードを忘れた方はこちら</a>
            </div>
          </form>
        </Paper>
        <GoogleLogin text='Googleでログイン' style={{marginTop: 20, fontSize: 14, fontWeight: 'normal', width: 200, height: 50}} onLogin={this.onGoogleLogin} />
        <FacebookLogin style={{marginTop: 20, textAlign: 'center'}} onLogin={this.onFacebookLogin} />
      </div>
    )
  }
}
