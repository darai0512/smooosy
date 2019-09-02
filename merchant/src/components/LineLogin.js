import React from 'react'
import qs from 'qs'
import platform from 'platform'
import uuidv4 from 'uuid/v4'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import LineConnect from 'components/LineConnect'
import Loading from 'components/Loading'
import { webOrigin, line, BQEventTypes } from '@smooosy/config'
import { sendLog } from 'modules/auth'
import storage from 'lib/storage'

const canLineLogin = platform.os.family === 'Android' || (platform.os.family === 'iOS' && platform.name === 'Safari')

@withStyles({
  button: {
    width: 200,
    height: 50,
    // 色指定 https://developers.line.me/ja/docs/line-login/login-button/
    background: '#00C300',
    color: '#ffffff',
    '&:hover': {
      background: '#00E000',
    },
    '&:selected': {
      background: '#00B300',
    },
    '&:disabled': {
      background: '#C6C6C6',
    },
  },
  icon: {
    width: 32,
    height: 32,
  },
})
@connect(
  state => ({
    user: state.auth.user,
  }), { sendLog })
@withRouter
export default class LineLogin extends React.Component {
  state = {}
  uuid = storage.get('lineState')

  static defaultProps = {
    mobileOnly: false,
    label: 'LINEでログイン',
    page: 'login',
    onLogin: () => {},
    onError: (message) => alert(message),
    onClick: () => {},
    needClick: false,
  }

  componentDidMount() {
    const { location, user, needClick } = this.props
    const query = qs.parse(location.search.slice(1))
    if (query.login === 'line') {
      this.onSuccess({
        error_description: query.error_description,
        state: query.state,
        code: query.code,
      })
      return
    }

    // 未ログインでLINE WebViewの場合は自動ログイン
    if ((!user.id || needClick) && /\sLine\//.test(window.navigator.userAgent)) {
      this.click()
    }
  }

  click = () => {
    const { onClick, page } = this.props
    this.sendLog('start')
    onClick()
    this.uuid = uuidv4()
    storage.save('lineState', this.uuid)
    const params = {
      response_type: 'code',
      client_id: line.clientId,
      redirect_uri: `${webOrigin}/api/linecallback?page=${page}`,
      state: this.uuid,
      scope: 'profile openid email',
      bot_prompt: 'normal',
    }

    window.location.href = 'https://access.line.me/oauth2/v2.1/authorize?' + qs.stringify(params)
  }

  onSuccess = ({error_description, state, code}) => {
    const { page } = this.props
    if (error_description || this.uuid !== state) {
      this.sendLog('fail')
      return this.props.onError('エラーが発生しました')
    }
    this.setState({loading: true})
    return this.props.onLogin({lineCode: code, page})
      .then(() => {
        this.sendLog('success')
        this.setState({loading: false})
      })
      .catch(err => {
        this.sendLog('fail')
        this.setState({loading: false})
        this.props.onError(err.message, err.code, err.email, code)
      })
  }

  sendLog = (status) => {
    this.props.sendLog(BQEventTypes.web.SOCIAL_LOGIN, {
      type: 'line',
      status,
    })
  }

  render() {
    const { user, showAlways, label, style, className, classes } = this.props
    const { loading } = this.state

    return (
      <div style={style} className={className}>
        {user.id && !canLineLogin ? // ログインずみPC
          <LineConnect label={label} />
        : showAlways || canLineLogin ? // 常に表示flagあり or スマホ
          <Button variant='contained' className={classes.button} onClick={this.click} disabled={loading}>
            <img src='/images/line.png' className={classes.icon} />
            <div style={{flex: 1, textAlign: 'center'}}>
              {label}
            </div>
          </Button>
        : null}
        {loading &&
          <Loading style={{position: 'fixed', top: 0, left: 0, zIndex: 11, background: 'rgba(0, 0, 0, .5)'}} progressStyle={{color: '#fff'}} />
        }
      </div>
    )
  }
}
