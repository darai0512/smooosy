import React from 'react'
import { connect } from 'react-redux'
import Avatar from '@material-ui/core/Avatar'
import { withStyles } from '@material-ui/core'
import { loadRecent } from 'modules/request'
import { withAMP } from 'contexts/amp'


const showAnimationTime = 0.5
const viewAnimationTime = 5
const hideAnimationTime = 0.5
const totalAnimationTime = showAnimationTime + viewAnimationTime + hideAnimationTime
const firstInterval = 500 // 初回メッセージインターバル
const minInterval = totalAnimationTime * 800 // ポップアップが出てくる最短インターバル

@withAMP
@connect(
  // propsに受け取るreducerのstate
  state => ({
    messages: state.request.recent,
    expPopupNotice: state.experiment.experiments.sp_popup_notice || 'control',
  }),
  // propsに付与するactions
  {loadRecent}
)
@withStyles(theme => ({
  root: {
    position: 'fixed',
    right: 10,
    bottom: 0,
    width: 300,
    [theme.breakpoints.down('xs')]: {
      width: '95%',
      left: '2.5%',
      right: '2.5%',
    },
    zIndex: 1000,
  },
  ampRoot: {
    position: 'fixed',
    zIndex: 1000,
  },
  msg: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    background: theme.palette.secondary.main,
    marginBottom: 10,
    opacity: 0.9,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    border: `1px solid ${theme.palette.grey[500]}`,
  },
  ampMsg: {
    position: 'fixed',
    right: 5,
    left: 5,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    background: theme.palette.secondary.main,
    marginBottom: 10,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    border: `1px solid ${theme.palette.grey[500]}`,
    transform: 'translateY(150%)',
  },
  show: {
    animationName: 'popupNotice',
    animationTimingFunction: 'ease-in-out',
    animationDuration: `${totalAnimationTime}s`,
    animationDelay: '0.0s',
    animationIterationCount: 1,
    animationDirection: 'normal',
    animationFillMode: 'forwards',
  },
  icon: {
    marginRight: 5,
  },
}))
export default class PopupNotice extends React.Component {

  static defaultProps = {
    rootClass: '',
  }

  state = {
    showMessages: [],
  }

  componentDidMount() {
    this.props.loadRecent(this.props.service.id)
      .then(this.showTimeline)
  }

  showTimeline = () => {
    const { messages } = this.props
    const { showMessages } = this.state

    if (messages.length > 0) {
      const message = messages.shift()
      const interval = message.interval * 1000 / 60
      const nextInterval = showMessages.length === 0 ? firstInterval : interval < minInterval ? minInterval : interval
      this.showTimer = setTimeout(() => {
        // バックグラウンド時は出さない
        if (!document.hidden) {
          this.setState({showMessages: [...showMessages, {key: message.key, text: `${message.prefecture + message.city}のお客様が${message.serviceName}の依頼をしました!`, show: true }]})
        }
        this.showTimeline()
      }, Math.floor(nextInterval))
    }
  }

  componentWillUnmount() {
    clearTimeout(this.showTimer)
  }

  render () {
    let { messages, classes, isAMP } = this.props
    const { showMessages } = this.state

    return (
      isAMP ?
      <div className={classes.ampRoot}>
        <amp-animation id='popup' layout='nodisplay'>
          <script type='application/json' dangerouslySetInnerHTML={{__html:
          JSON.stringify(messages.map((message, idx) => {
            return {
              'duration': `${totalAnimationTime}s`,
              'fill': 'both',
              'easing': 'ease-in-out',
              'delay': `${idx * totalAnimationTime * 1000 + Math.floor(message.interval * 1000 / 60)}`,
              'animations': [{
                'selector': `#popupmsg_${idx}`,
                'keyframes':  [
                  {'transform': 'translateY(150%)'},
                  {'transform': 'translateY(0)', 'offset': 0.1},
                  {'transform': 'translateY(0)', 'offset': 0.9},
                  {'transform': 'translateY(150%)'},
                ],
              }],
            }
          }))}} />
        </amp-animation>
        <amp-date-countdown
          timeleft-ms={500}
          on='timeout: popup.start'
          width={0}
          height={0}
          when-ended='stop'
          locale='ja'
          layout='nodisplay'
          >
          <template type='amp-mustache' />
        </amp-date-countdown>
        {messages.map((message, idx) =>
          <React.Fragment key={`msg_${idx}`}>
            <div id={`popupmsg_${idx}`} className={['ampPopupNotice', classes.ampMsg].join(' ')}>
              <div><img layout='fixed' className={classes.icon} src='/images/icon-hdpi.png' width={32} height={32} /></div>
              <div>{`${message.prefecture + message.city}のお客様が${message.serviceName}の依頼をしました!`}</div>
            </div>
          </React.Fragment>
        )}
      </div>
      : this.props.expPopupNotice !== 'hide' ?
      <div className={classes.root}>
        <style>{`
          @keyframes popupNotice {
            0% {opacity: 0;}
            ${Math.floor(showAnimationTime / totalAnimationTime * 100)}% {opacity: 0.9;}
            ${Math.floor((showAnimationTime + viewAnimationTime) / totalAnimationTime * 100)}% {opacity: 0.9;}
            100% {opacity: 0;display: none;}
          }
        `}</style>
        {showMessages.map((message, idx) =>
          <div key={`msg_${idx}`} className={[classes.msg, message.show ? classes.show : ''].join(' ')}>
            <Avatar className={classes.icon} src='/images/icon-hdpi.png' width={24} height={24} />
            {message.text}
          </div>
        )}
      </div>
      : null
    )
  }
}
