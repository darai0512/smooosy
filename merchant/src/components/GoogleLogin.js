import React from 'react'
import { connect } from 'react-redux'
import { GoogleLogin as GoogleIn} from 'react-google-login'
import Button from '@material-ui/core/Button'
import { googleAuth, BQEventTypes } from '@smooosy/config'
import { sendLog } from 'modules/auth'

@connect(null, { sendLog })
export default class GoogleLogin extends React.Component {
  static defaultProps = {
    onLogin: () => {},
    onError: (message) => alert(message),
  }

  onGoogleLoginSuccess = (res) => {
    const profile = res.profileObj
    if (!profile.email) {
      this.sendLog('fail')
      this.props.onError('メールアドレスが取得できませんでした。再度ログインし、メールアドレスを許可してください。')
      return
    }

    const values = {
      googleToken: res.tokenId,
    }
    this.props.onLogin(values)
      .then(() => this.sendLog('success'))
      .catch(err => {
        this.sendLog('fail')
        this.props.onError(err.message, err.code, err.email, res.tokenId)
      })
  }

  onGoogleLoginFailure = (res) => {
    const error = res.error
    this.sendLog('fail')
    if (error === 'idpiframe_initialization_failed') {
      return this.props.onError('loginに失敗しました、ブラウザのクッキーを有効にしてください')
    }
    if (error === 'access_denied') {
      return this.props.onError('googleのログインに失敗しました')
    }
  }

  onClick = (callback) => (...args) => {
    this.sendLog('start')
    callback(...args)
  }

  sendLog = status => {
    this.props.sendLog(BQEventTypes.web.SOCIAL_LOGIN, {
      type: 'google',
      status,
    })
  }

  render () {
    const { text, style } = this.props

    const defaultStyle = {
      background: 'rgb(209, 72, 54)',
      color: 'rgb(255, 255, 255)',
      width: 200,
      height: 50,
    }

    return (
      <div>
        <GoogleIn
          clientId={`${googleAuth.clientId}.apps.googleusercontent.com`}
          onSuccess={this.onGoogleLoginSuccess}
          onFailure={this.onGoogleLoginFailure}
          render={props =>
            <Button style={{...defaultStyle, ...style}} size='large' variant='contained' color='primary' onClick={this.onClick(props.onClick)}>{text}</Button>
          }
          />
      </div>
    )
  }
}
