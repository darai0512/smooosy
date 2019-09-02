import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core'
import { load as loadUser, checkLineFriend, sendLog } from 'modules/auth'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import { BQEventTypes } from '@smooosy/config'
import { withApiClient } from 'contexts/apiClient'
import LineFriendLink from 'components/LineFriendLink'

@withApiClient
@connect(state => ({
  user: state.auth.user,
}), { loadUser, checkLineFriend, sendLog })
@withStyles((theme) => ({
  content: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  step: {
    color: theme.palette.grey[800],
    marginBottom: 10,
  },
}))
export default class LineConnect extends React.Component {
  static defaultProps = {
    label: '連携する',
    labelStyle: {},
    helperText: '',
    helperTextStyle: {},
  }

  constructor(props) {
    super(props)
    this.state = {
      connected: !!props.user.lineId,
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.user !== prevProps.user) {
      this.setState({
        connected: !!this.props.user.lineId,
      })
    }
  }

  componentWillUnmount() {
    if (this.state.timer) {
      clearInterval(this.state.timer)
      this.setState({timer: null})
    }
  }

  handleOpen = (event) => {
    event.preventDefault()
    this.props.sendLog(BQEventTypes.web.LINE_CONNECT, {type: 'click'})
    this.setState({open: true, timer: setInterval(() => this.checkLineState(), 3000)})
  }

  handleClose = () => {
    clearInterval(this.state.timer)
    this.setState({open: false, timer: null })
  }

  handleCloseWithLoad = () => {
    if (this.state.connected) {
      this.props.loadUser()
    }
    this.handleClose()
  }

  checkLineState = () => {
    this.props.apiClient
      .get('/api/users/@me/lineState')
      .then(res => {
        this.setState({connected: res.data.connected})
        if (res.data.connected) {
          clearInterval(this.state.timer)
          this.setState({timer: null})
          this.props.checkLineFriend()
        }
      })
  }

  render() {
    const { label, labelStyle, helperText, helperTextStyle, classes } = this.props
    const { open, connected } = this.state

    return (
      <div>
        <Button variant='contained' style={{ backgroundColor: '#1BB512', color: '#fff', height: 40, ...labelStyle}} onClick={this.handleOpen} >
          {label}
        </Button>
        {
          helperText &&
          <div style={{marginTop: 5, fontSize: 12, ...helperTextStyle}}>{helperText}</div>
        }
        <Dialog open={!!open && !connected} onClose={this.handleClose}>
          <DialogTitle>
            LINE連携の手順
            <IconButton style={{position: 'absolute', top: 0, right: 0}} onClick={this.handleClose}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <div className={classes.content}>
              <div className={classes.step}>1. QRコードから「SMOOOSY」を友達追加してください</div>
              <LineFriendLink />
              <div className={classes.step}>2. SMOOOSY公式アカウントよりメッセージが届きます</div>
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <img alt='ステップ2' src='/images/line-step-2.jpg' style={{ width: 188, height: 140 }} />
              </div>
              <div className={classes.step}>3. メッセージのリンクよりSMOOOSYにログインしてください</div>
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <img alt='ステップ3' src='/images/line-step-3.jpg' style={{ width: 200, height: 188 }} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog title='LINE連携完了！' open={!!open && connected} onClose={this.handleCloseWithLoad}>
          <DialogContent>
            今後は通知をLINEで受け取ることができます。
          </DialogContent>
          <DialogActions><Button color='primary' variant='contained' onClick={this.handleCloseWithLoad}>完了</Button></DialogActions>
        </Dialog>
      </div>
    )
  }
}
