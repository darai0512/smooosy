import React from 'react'
import { Link } from 'react-router-dom'
import { Paper, Button, IconButton } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import { yellow, red, green } from '@material-ui/core/colors'
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord'
import RemoveIcon from '@material-ui/icons/Remove'
import BackspaceIcon from '@material-ui/icons/Backspace'
import CallIcon from '@material-ui/icons/Call'

import { withApiClient } from 'contexts/apiClient'
import UserAvatar from 'components/UserAvatar'
import CustomChip from 'components/CustomChip'
import { shortTimeString } from 'lib/date'

@withApiClient
@withTheme
export default class Dialer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      bottom: 24,
      right: 24,
      number: '',
      activity: 'offline',
      opponent: null,
    }
    this.beforeBottom = this.state.bottom
    this.beforeRight = this.state.right
  }

  componentDidMount() {
    if (!window.Twilio) return
    this.connect()
  }

  connect = () => {
    this.props.apiClient.get('/api/callCenter/token')
      .then(res => res.data)
      .then(tokens => {
        if (!tokens) return

        this.setState({showDialer: true})
        this.setupDeviceHandler()
        // activities
        this.activities = tokens.activities
        // setup device
        window.Twilio.Device.setup(tokens.phoneToken, {
          closeProtection: true,
          region: 'jp1',
        })
        // task worker
        this.worker = new window.Twilio.TaskRouter.Worker(tokens.taskRouterToken)
        this.setupWorkerHandler(this.worker)
      })
  }

  setupDeviceHandler = () => {
    window.Twilio.Device.error(error => {
      console.error('Twilio.Device Error: ' + error.message)
      this.connect() // try to reconnect
    })
    window.Twilio.Device.ready(() => {
      console.log('Twilio.Device Log: connection established.')
    })
    window.Twilio.Device.connect(() => {
      this.preActivity = this.state.activity
      this.updateActivity(this.activities.reserved)
      this.setState({status: 'talking'})
      this.startTimer()
    })
    window.Twilio.Device.disconnect(() => {
      if (!this.preActivity || this.preActivity === 'reserved') {
        this.preActivity = 'idle'
      }
      this.updateActivity(this.activities[this.preActivity])
      this.setState({status: 'none'})
      this.stopTimer()
    })
    window.Twilio.Device.incoming(conn => {
      console.log('Twilio.Device Log: inbound call is coming.')
      this.activeConnection = conn
    })

    window.callCenter = this.searchUserByPhone
  }

  setupWorkerHandler = worker => {
    worker.on('error', console.error)
    worker.on('ready', worker => {
      const activity = worker.activityName.toLowerCase()
      this.setState({activity})
      if (activity === 'offline') {
        this.updateActivity(this.activities.idle)
      }
    })
    worker.on('activity.update', worker => {
      const activity = worker.activityName.toLowerCase()
      this.setState({activity})
    })
    worker.on('reservation.created', reservation => {
      const from = '0' + reservation.task.attributes.from.slice(3)
      this.activeReservation = reservation
      this.searchUserByPhone(from)
      this.setState({
        number: from,
        status: 'pending',
      })
    })
    worker.on('reservation.rejected', () => {
      this.activeConnection && this.activeConnection.reject()
      this.hangupCall()
    })
    worker.on('reservation.canceled', () => {
      this.activeConnection && this.activeConnection.reject()
      this.hangupCall()
    })
    worker.on('token.expired', () => {
      this.connect()
    })
  }

  dragStart = e => {
    this.fromX = e.pageX
    this.fromY = e.pageY
  }

  dragEnd = e => {
    let { bottom, right } = this.state
    bottom -= e.pageY - this.fromY
    right -= e.pageX - this.fromX
    bottom = Math.min(window.innerHeight - e.target.offsetHeight, Math.max(0, bottom))
    right = Math.min(window.innerWidth - e.target.offsetWidth, Math.max(0, right))
    this.setState({ right, bottom })
  }

  toggleDialer = () => {
    const { bottom } = this.state
    if (bottom < 0) {
      this.showDialer()
    } else {
      this.hideDialer()
    }
  }

  showDialer = () => {
    const { bottom } = this.state
    if (bottom > 0) return
    this.setState({
      bottom: this.beforeBottom || 24,
    })
  }

  hideDialer = () => {
    const { bottom } = this.state
    if (bottom < 0) return
    this.beforeBottom = bottom
    this.setState({
      bottom: 24 - this.root.offsetHeight,
    })
  }

  pressKey = key => {
    let number = this.state.number
    if (number.length >= 11) return
    number = number + key
    this.setState({number})
  }

  deleteKey = () => {
    let number = this.state.number
    number = number.slice(0, number.length - 1)
    this.setState({number})
  }

  searchUserByPhone = number => {
    this.props.apiClient.get(`/api/admin/users/search?phone=${number}`)
      .then(res => res.data)
      .then(opponent => {
        this.setState({
          opponent,
          number,
        })
        this.showDialer()
      })
  }

  outboundCall = number => {
    if (!window.Twilio) return

    number = number.replace(/\-/g, '')
    if (!/^0\d{9,10}$/.test(number)) {
      console.error('Wrong number.')
      return
    }

    const toNumber = '+81' + number.slice(1)
    window.Twilio.Device.connect({
      To: toNumber,
      source: 'dialer',
      type: 'dial',
    })
  }

  acceptReservation = () => {
    // when accept incoming connection, reservation will be accepted.
    this.activeConnection && this.activeConnection.accept()
  }

  rejectReservation = () => {
    this.activeReservation && this.activeReservation.reject()
  }

  pause = () => {
    this.props.apiClient.post('/api/callCenter/hold', {
      callSid: this.activeReservation.task.attributes.call_sid,
    })
  }

  hangupCall = () => {
    window.Twilio.Device.disconnectAll()
    this.setState({status: 'none'})
  }

  toggleActivity = () => {
    const activity = this.state.activity
    if (activity === 'idle') {
      this.updateActivity(this.activities.busy)
    } else if (activity === 'busy') {
      this.updateActivity(this.activities.idle)
    }
  }

  updateActivity = ActivitySid => {
    this.worker && this.worker.update({ActivitySid})
  }

  startTimer = () => {
    this.setState({time: 0})
    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.setState({time: this.state.time + 1})
    }, 1000)
  }

  stopTimer = () => {
    clearInterval(this.interval)
    this.interval = null
  }

  componentWillUnmount() {
    this.stopTimer()
  }

  render() {
    const { theme } = this.props
    const { common, primary, grey } = theme.palette
    const { showDialer, bottom, right, number, activity, opponent, status, time } = this.state

    if (!showDialer) return null

    const MMSS = time ? Math.floor(time / 60) + ':' + ('0' + time % 60).slice(-2) : ''
    const activityColor = {
      offline: grey[500],
      idle: green[500],
      busy: yellow[800],
      reserved: red[500],
    }[activity]

    const styles = {
      root: {
        position: 'fixed',
        zIndex: 10000000,
        bottom,
        right,
        width: 250,
        background: common.white,
        border: `1px solid ${primary.main}`,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
      },
      activity: {
        color: activityColor,
        cursor: 'pointer',
      },
      handle: {
        flex: 1,
        cursor: 'move',
        height: 24,
        display: 'flex',
        alignItems: 'center',
      },
      icon: {
        cursor: 'pointer',
      },
      display: {
        height: 60,
        margin: 10,
        padding: 10,
        borderRadius: 5,
        background: grey[200],
        position: 'relative',
        fontSize: 20,
        textAlign: 'center',
      },
      prefix: {
        fontSize: 12,
        color: grey[700],
        textAlign: 'left',
      },
      backspace: {
        position: 'absolute',
        right: 12,
        top: 24,
        color: grey[500],
        cursor: 'pointer',
      },
      tenkey: {
        width: 180,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
      },
      key: {
        width: '33%',
        padding: '0 5px',
      },
      keyButton: {
        width: '100%',
      },
      info: {
        padding: 10,
        minHeight: 300,
        fontSize: 12,
      },
      desc: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 10,
      },
      avatar: {
        width: 48,
        height: 48,
      },
      name: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      buttons: {
        padding: 10,
        display: 'flex',
      },
    }

    return (
      <div
        draggable
        ref={e => this.root = e}
        onDragStart={e => this.dragStart(e)}
        onDragEnd={e => this.dragEnd(e)}
        style={styles.root}
      >
        <style>{`
          .blink {
            animation:blink 1s ease-in-out infinite alternate;
          }
          @keyframes blink {
           0% { opacity: 0.2; }
           100% { opacity: 1; }
          }
        `}</style>
        <Paper elevation={8}>
          <div style={styles.header}>
            <FiberManualRecordIcon style={styles.activity} className={activity === 'reserved' ? 'blink' : ''} onClick={() => this.toggleActivity()} />
            <div style={styles.handle}>
              {MMSS}
            </div>
            <RemoveIcon style={styles.icon} onClick={() => this.toggleDialer()} />
          </div>
          {opponent ?
            <div style={styles.info}>
              <div style={styles.desc}>
                <UserAvatar user={opponent} style={styles.avatar} />
                <div style={styles.name}>
                  {opponent.lastname} {opponent.firstname}
                </div>
                <div>{opponent.phone}</div>
                {opponent.pro && <CustomChip label='Pro' />}
              </div>
              {opponent.pro &&
                <div>
                  <div>プロフィール</div>
                  <ul>
                    {opponent.profiles.map(p =>
                      <li key={p.id}><Link to={`/stats/pros/${p.id}`}>{p.name}</Link></li>
                    )}
                  </ul>
                </div>
              }
              {opponent.requests.length > 0 &&
                <div>
                  <div>依頼</div>
                  <ul>
                    {opponent.requests.map(r =>
                      <li key={r.id}><Link to={`/stats/requests/${r.id}`}>
                        {shortTimeString(new Date(r.createdAt))}
                      </Link></li>
                    )}
                  </ul>
                </div>
              }
            </div>
          :
            <div>
              <div style={styles.display}>
                <div style={styles.prefix}>+81</div>
                {number}
                <BackspaceIcon style={styles.backspace} onClick={() => this.deleteKey()} />
              </div>
              <div style={styles.tenkey}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(key =>
                  <div key={key} style={styles.key}>
                    <IconButton style={styles.keyButton} onClick={() => this.pressKey(key)} >
                      {key}
                    </IconButton>
                  </div>
                )}
              </div>
            </div>
          }
          {status === 'talking' ?
            <div style={styles.buttons}>
              <Button color='primary' style={{flex: 1}} onClick={this.pause}>
                保留
              </Button>
              <div style={{width: 10}} />
              <Button variant='contained' color='secondary' style={{flex: 1}} onClick={this.hangupCall}>
                切断
              </Button>
            </div>
          : status === 'pending' ?
            <div style={styles.buttons}>
              <Button color='secondary' style={{flex: 1}} onClick={this.rejectReservation}>
                拒否
              </Button>
              <div style={{width: 10}} />
              <Button variant='contained' color='primary' style={{flex: 1}} onClick={this.acceptReservation}>
                応答
              </Button>
            </div>
          :
            <div style={styles.buttons}>
              <Button variant='contained' color='primary' style={{flex: 1}} onClick={() => this.outboundCall(number)}>
                <CallIcon />
                CALL
              </Button>
            </div>
          }
        </Paper>
      </div>
    )
  }
}
