import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { List, ListItem, ListItemAvatar, ListItemText, ListItemIcon } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { amber, lightGreen } from '@material-ui/core/colors'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import withWidth from '@material-ui/core/withWidth'
import ActionCheckCircle from '@material-ui/icons/CheckCircle'
import EventIcon from '@material-ui/icons/Event'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import ReviewIcon from '@material-ui/icons/Stars'

import { loadForPro as loadMeet } from 'modules/meet'
import { readAll as readNotices } from 'modules/notice'
import UserAvatar from 'components/UserAvatar'
import Chats from 'components/Chats'
import ChatForm from 'components/ChatForm'
import ReviewForPro from 'components/ReviewForPro'
import { priceFormat } from 'lib/string'
import { meetFaq, MeetStatusType } from '@smooosy/config'
import { updateReview } from 'modules/profile'


@withWidth({withTheme: true})
@connect(
  state => ({
    user: state.auth.user,
  }),
  { loadMeet, readNotices, updateReview }
)
@withRouter
export default class WorkChat extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    setTimeout(this.scroll, 1000)

    this.props.readNotices({
      type: { $in: [ 'newChat', 'workStart', 'reviewDone' ] },
      model: 'Meet',
      item: this.props.meet.id,
    })
  }

  scroll = () => {
    if (this.chats) {
      this.chats.scrollTop = this.chats.scrollHeight
    }
  }

  onSubmit = () => {
    this.props.loadMeet(this.props.meet.id)
    setTimeout(this.scroll, 500)
  }

  replyReview = values => {
    return this.props.updateReview(values)
      .then(() => this.props.loadMeet(this.props.meet.id))
  }

  getQuickActions = () => {
    const { meet, width, theme } = this.props

    const jobAcceptChats = meet.chats.filter(c => c.booking && c.booking.schedule && c.booking.schedule.type === 'job' && c.booking.schedule.status === 'accept')

    const beforeHired = meet.status === 'waiting' && meet.chatStatus === MeetStatusType.RESPONDED
    const beforeDone = meet.status === 'progress' && jobAcceptChats.length === 0
    const beforeReview = meet.status === 'progress' && jobAcceptChats.length > 0

    const actions = []

    if (beforeHired) {
      actions.push({
        key: 'hire',
        icon: <ActionCheckCircle style={{color: theme.palette.secondary.main}} />,
        label: '成約したら、ステータスを更新しましょう',
        onClick: this.props.onUpdateStatusClick,
      })
    }

    if (beforeDone) {
      actions.push({
        key: 'booking',
        icon: <EventIcon />,
        label: '仕事の日程を登録する',
        onClick: () => {
          this.props.history.push(`${this.props.currentPath}/booking`)
        },
      })
    }

    if (beforeDone || beforeReview) {
      actions.push({
        key: 'done',
        icon: <ReviewIcon style={{color: amber[700]}}/>,
        label: width === 'xs' ? '仕事完了、クチコミを依頼する' : '仕事が完了したので、クチコミを依頼する',
        onClick: this.props.requestReview,
      })
    }

    return actions
  }

  render() {
    const { meet, user, width, theme, goToProfile, chatFormFooter } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowY: 'auto',
      },
      chatTitle: {
        textAlign: 'center',
        fontSize: '.8rem',
        paddingTop: 10,
        color: grey[700],
      },
      chats: {
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop: width !== 'sm' ? 10 : 80,
      },
      chatActionButton: {
        flex: 1,
        margin: width === 'xs' ? '0px 2px' : '0px 4px',
      },
      columnHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
    }

    if (!meet) return null

    return (
      <div style={styles.root}>
        {width === 'sm' &&
          <List style={{padding: 0, position: 'absolute', top: 0, width: '100%', zIndex: 1, backgroundColor: common.white}}>
            <ListItem button divider onClick={goToProfile}>
              <ListItemAvatar>
                <UserAvatar user={meet.customer} />
              </ListItemAvatar>
              <ListItemText primary={`${meet.customer.lastname}様`} secondary={priceFormat(meet)} />
              <ListItemIcon>
                <NavigationChevronRight />
              </ListItemIcon>
            </ListItem>
          </List>
        }
        <div ref={(e) => this.chats = e} style={styles.chats}>
          <p style={styles.chatTitle}>{meet.customer.lastname}様とのチャット</p>
          <Chats onIconClick={goToProfile} unreadline chats={meet.chats} me={user} style={{padding: '0 10px'}} priceString={priceFormat(meet)} meet={meet} />
          <div style={{textAlign: 'center', margin: '20px 0'}}>
            {meet.status === 'exclude' ?
              <div>候補外となりました</div>
            : meet.review ?
              <div>完了</div>
            : meet.status === 'done' ?
              <div>クチコミ待ち</div>
            : meet.status === 'progress' ?
              <QuickActions actions={this.getQuickActions()} />
            : meet.request.status === 'suspend' ?
              <div>依頼がキャンセルされました</div>
            : meet.request.status === 'close' ?
              <div>他の事業者に決定しました</div>
            : meet.status === 'waiting' && meet.chatStatus === MeetStatusType.RESPONDED ?
              <QuickActions actions={this.getQuickActions()} />
            : null}
            {meet.request.suspendReason && meet.request.showReason && <div>理由: {meet.request.suspendReason}</div>}
          </div>
          {meet.review &&
            <div style={{padding: '10px 20px 20px', borderTop: `1px solid ${grey[300]}`}}>
              <h4>クチコミ</h4>
              <ReviewForPro review={meet.review} onReply={this.replyReview} />
            </div>
          }
          <FAQ meet={meet} />
        </div>
        {chatFormFooter}
        {meet.request.status !== 'suspend' &&
          <ChatForm meet={meet} onSubmit={this.onSubmit} />
        }
      </div>
    )
  }
}


const FAQ = withStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    fontSize: 14,
    alignItems: 'center',
    color: theme.palette.grey[500],
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  icon: {
    width: 18,
  },
  text: {
    marginRight: 5,
  },
}))(({meet, classes}) => {
  // 完了 or 成約 or 交渉中の場合は表示しない
  let meetStatus = MeetStatusType.getMeetStatus(meet)
  if (meetStatus === MeetStatusType.CLOSED) {
    meetStatus = MeetStatusType.EXCLUDED
  }

  if (!(meetStatus in meetFaq)) {
    return null
  }

  return (
    <div className={classes.root}>
      <HelpOutlineIcon className={classes.icon} />
      <span className={classes.text}>
        {meetFaq[meetStatus].label}
      </span>
      <a href={meetFaq[meetStatus].url} target='_blank' rel='noopener noreferrer'>
         よくある質問はこちら
      </a>
    </div>
  )
})

const QuickActions = withStyles(theme => ({
  button: {
    '&:hover': {
      background: lightGreen[100],
    },
  },
  responseSuggest: {
    margin: '0 20px',
    padding: 0,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 8,
  },
  response: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 5px',
    fontSize: 14,
    flex: 1,
  },
  responseBorder: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  suggestList: {
    padding: '0 5px',
    borderRadius: 8,
  },
}))(({actions, classes}) => {
  if (!actions || actions.length === 0) {
    return null
  }

  return (
    <List className={classes.responseSuggest}>
      {actions.map((action, i) =>
        <ListItem button dense classes={{button: classes.button}} key={`action_${action.key}`} className={classes.suggestList} onClick={action.onClick}>
          <div className={[classes.response, i < actions.length - 1 ? classes.responseBorder : null].join(' ')}>
            {action.icon}
            <p style={{marginLeft: 10}}>{action.label}</p>
          </div>
        </ListItem>
      )}
    </List>
  )
})
