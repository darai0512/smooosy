import React from 'react'
import { connect } from 'react-redux'
import ReactFacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import Button from '@material-ui/core/Button'

import { sendLog } from 'modules/auth'

import { BQEventTypes } from '@smooosy/config'

const appId = ['dev', 'production'].includes(process.env.NODE_ENV) ? '1871580089750644': '421670664966141'

@connect(null, { sendLog })
export default class FacebookLogin extends React.Component {

  static defaultProps = {
    label: 'Facebookでログイン',
    onLogin: () => {},
    onError: (message) => alert(message),
  }

  responseFacebook = (res) => {
    if (!res.email) {
      window.FB.api('/me/permissions', 'delete')
      this.sendLog('fail', true)
      this.props.onError('メールアドレスが取得できませんでした。再度ログインし、メールアドレスを許可してください。')
      return
    }

    this.props.onLogin({facebookToken: res.accessToken})
      .then(() => this.sendLog('success'))
      .catch(err => {
        this.sendLog('fail')
        this.props.onError(err.message, err.code, err.email, res.accessToken)
      })
  }

  onClick = (callback) => (...args) => {
    this.sendLog('start')
    callback(...args)
  }

  sendLog = (status, notSettingEmail = false) => {
    this.props.sendLog(BQEventTypes.web.SOCIAL_LOGIN, {
      type: 'facebook',
      status,
      notSettingEmail,
    })
  }

  render() {
    const { label, style, className } = this.props

    const buttonStyle = {
      width: 200,
      height: 50,
      background: '#4c69ba',
      color: '#ffffff',
    }

    return (
      <div style={style} className={className}>
        <ReactFacebookLogin
          disableMobileRedirect
          appId={appId}
          language='ja_JP'
          scope='public_profile,email'
          fields='email'
          callback={this.responseFacebook}
          render={props => <Button variant='contained' style={buttonStyle} onClick={this.onClick(props.onClick)} disabled={props.isDisabled || props.isProcessing}>{label}</Button>}
        />
        <div style={{marginTop: 5, fontSize: 12}}>SMOOOSYが勝手にFacebookに投稿することはありません</div>
      </div>
    )
  }
}
