import React from 'react'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
  withStyles,
} from '@material-ui/core'
import { amber, lightGreen } from '@material-ui/core/colors'
import { withWidth } from '@material-ui/core'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import CheckIcon from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
import ToggleStar from '@material-ui/icons/Star'

import { withRollOut } from 'contexts/rollOut'
import { load as loadRequest } from 'modules/request'
import { checkLineFriend, sendLog } from 'modules/auth'
import ChangeAccountLink from 'components/ChangeAccountLink'
import UserAvatar from 'components/UserAvatar'
import CampaignReviewTerm from 'components/CampaignReviewTerm'
import { priceFormat } from 'lib/string'
import { timeNumbers, BQEventTypes, MeetStatusType } from '@smooosy/config'
import Container from 'components/Container'
import LineConnect from 'components/LineConnect'

import storage from 'lib/storage'

@withWidth({withTheme: true})
@withStyles(() => ({
  meetList: {
    padding: 0,
  },
  divider: {
    width: '95%',
    margin: 'auto',
  },
}))
@connect(
  state => ({
    request: state.request.request,
    meets: (state.request.request || {}).meets,
    meet: state.meet.meet, // for review campaign
  }),
  { loadRequest }
)
export default class RequestPage extends React.Component {

  state = {}

  componentDidMount() {
    this.load()
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      this.load()
    }
  }

  load = () => {
    this.props.loadRequest(this.props.match.params.id)
      .catch(err => this.setState({error: err.status}))
  }

  goInstantResult = () => {
    const { request } = this.props
    this.props.history.push(`/instant-results?serviceId=${request.service.id}&requestId=${request.id}`)
  }

  render() {
    const { error } = this.state
    const { children, request, meets, meet, width, history, match, theme, classes } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 60,
      },
      container: {
        flex: 1,
        display: 'flex',
        height: '100%',
      },
      list: {
        height: '100%',
        flexShrink: 0,
        width: width === 'xs' ? '100%' : 350,
        display: width === 'xs' && !match.isExact ? 'none' : 'block',
        background: '#fff',
        borderRight: `1px solid ${grey[300]}`,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      main: {
        height: '100%',
        flex: 1,
        background: common.white,
        display: width === 'xs' && match.isExact ? 'none' : 'block',
      },
      setting: {
        position: 'absolute',
        right: 0,
        top: 20,
      },
      search: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bottom: 10,
      },
      searchText: {
        fontSize: 12,
        marginBottom: 10,
      },
      errorRoot: {
        padding: '100px 40px 40px',
      },
      errorTitle: {
        fontSize: 20,
      },
    }

    if (error === 404) {
      return <div style={styles.errorRoot}><p style={styles.errorTitle}>依頼が存在しません</p></div>
    } else if (error === 403) {
      return (
        <div style={styles.errorRoot}>
          <div style={styles.errorTitle}>表示する権限がありません</div>
          <div style={{marginTop: 20}}>
            別のアカウントでログインしている場合は、再度<ChangeAccountLink>ログイン</ChangeAccountLink>してください。
          </div>
        </div>
      )
    }

    if (!request || !meets) {
      return null
    }

    if (request.deleted) {
      return <div style={styles.errorRoot}><p style={styles.errorTitle}>この依頼は削除されました（{request.suspendReason}）</p></div>
    }

    const m = history.location.pathname.match(/responses\/[0-9a-f]+$/)
    const value = m ? m[0] : ''

    const upper = []
    const middle = []
    const lower = []
    for (let meet of meets) {
      if (meet.pro.deactivate || meet.proResponseStatus === 'decline') {
        lower.push(meet)
        continue
      }
      if (meet.status === 'exclude' || meet.proResponseStatus === 'tbd') {
        middle.push(meet)
        continue
      }
      upper.push(meet)
    }
    const notExpired = moment(request.createdAt).isAfter(moment().subtract(timeNumbers.requestExpireHourWithMargin, 'hours'))

    const hiredMeet = meets.find(m => ['progress', 'done'].includes(m.status))
    const replyNeeded = meets.find(m => [MeetStatusType.UNREAD, MeetStatusType.READ].includes(m.chatStatus))

    return (
      <div style={styles.root}>
        {(!hiredMeet || (meet && meet._id === hiredMeet._id)) && <ReviewCampaignContainer meet={hiredMeet} />}
        <LineConnectContainer />
        {(width !== 'xs' || !meet) && replyNeeded && <ReplyAppealBanner />}
        <div style={styles.container} className='userRequestPage'>
          <Helmet>
            <title>依頼ページ</title>
          </Helmet>
          <div style={styles.list}>
            <List
              style={{padding: 0}}
              value={value}
              >
              <ListItem
                button
                value={'overview'}
                style={{padding: '4px 6px 5px 20px', height: 56, background: grey[50]}}
                onClick={(e) => {
                  e.preventDefault();history.push(`/requests/${request.id}/overview`)
                }}
              >
                <ListItemText primary={request.service.name} />
                <NavigationChevronRight />
              </ListItem>
              <Divider />
              {
                meets.length ?
                [...upper, ...middle, ...lower].map((meet, idx, arr) => {
                  return (
                    <>
                      <ListItem
                        dense
                        button
                        key={meet.id}
                        value={`responses/${meet.id}`}
                        className={classes.meetList}
                        onClick={(e) => {
                          e.preventDefault();history.push(`/requests/${request.id}/responses/${meet.id}`)
                        }}
                      >
                        <MeetOverview meet={meet} request={request} />
                      </ListItem>
                      {idx !== arr.length - 1 && <Divider className={classes.divider} />}
                    </>
                  )
                }) :
                <p style={{textAlign: 'center'}}>まだ見積もりがありません</p>
              }
            </List>
            {request.service.matchMoreEnabled && meets.length > 0 && meets.length < 5 && notExpired &&
              <div style={styles.search}>
                <div style={styles.searchText}>ぴったりのプロが見つかりませんでしたか？</div>
                <Button size='medium' variant='contained' color='primary' onClick={this.goInstantResult}>別のプロを探す</Button>
              </div>
            }
          </div>
          <div style={styles.main}>
            {children}
          </div>
        </div>
      </div>
    )
  }
}

export const MeetOverview = withStyles(theme => ({
  root: {
    display: 'flex',
    padding: 16,
    width: '100%',
    background: theme.palette.common.white,
  },
  unreadRoot: {
    background: '#FEF6F6',
  },
  excludeCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: theme.palette.grey[50],
    opacity: 0.9,
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: 16,
  },
  squareAvatar: {
    width: 72,
    height: 72,
  },
  proName: {
    fontSize: 18,
    flex: 1,
    marginBottom: 12,
    marginRight: 16,
    lineHeight: '120%',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  nameStatus: {
    display: 'flex',
  },
  catchphrase: {
    whiteSpace: 'normal',
    display: '-webkit-box',
    '-webkit-line-clamp': 1,
    '-webkit-box-orient': 'vertical',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    fontSize: 14,
    lineHeight: '100%',
    color: theme.palette.secondary.sub,
    marginBottom: 6,
  },
  labels: {
    lineHeight: '120%',
    fontSize: 12,
  },
  infoSection: {
    flex: 1,
  },
  reviewPrice: {
    display: 'flex',
  },
  rating: {
    color: amber[700],
    display: 'flex',
    alignItems: 'center',
  },
  star: {
    fontSize: 18,
  },
}))(({classes, meet, request}) => {
  const humanChats = meet.chats.filter(c => !c.system)
  const lastChat = humanChats[humanChats.length - 1]
  const shouldResponse =
    !['done', 'exclude'].includes(meet.status) &&
    !['inReview', 'tbd', 'decline'].includes(meet.proResponseStatus) &&
    lastChat.user.id !== request.customer.id

  const rootClass = React.useMemo(() => {
    if (!meet.chatStatus === 'unread') return [classes.root, classes.unreadRoot].join(' ')
    return classes.root
  }, [classes.root, classes.unreadRoot, meet.chatStatus])

  return (
    <div className={rootClass}>
      <div className={classes.avatarSection}>
        <UserAvatar
          user={meet.pro}
          suspend={meet.profile.suspend}
          className={classes.squareAvatar}
          size={160}
        />
        {moment().diff(meet.pro.lastAccessedAt, 'minutes') < 5 && <div style={{fontSize: 10}}><span style={{width: 3, height: 3, color: '#3cb371'}}>●</span><span>オンライン</span></div> }
      </div>
      <div className={classes.infoSection}>
        <div className={classes.nameStatus}>
          <div className={classes.proName}>{meet.profile.name}</div>
          <InfoChip status={meet.status} proResponseStatus={meet.proResponseStatus} read={meet.chatStatus !== 'unread'} shouldResponse={shouldResponse} />
        </div>
        <div className={classes.catchphrase}>
          {meet.proService && meet.proService.catchphrase}
        </div>
        <div className={classes.labels}>
          {meet.proService && meet.proService.labels && meet.proService.labels.map(l => l.text).join(' / ')}
        </div>
        <div className={classes.reviewPrice}>
          {meet.profile.reviewCount ?
            <div className={classes.rating}>
              <ToggleStar className={classes.star} />
              {Number.parseFloat(meet.profile.averageRating).toFixed(1)}
            </div>
          : null
          }
          {meet.chatStatus !== 'unread' && <span className={classes.price}>{priceFormat(meet)}</span>}
        </div>
      </div>
      {meet.status === 'exclude' && <div className={classes.excludeCover} />}
  </div>
  )
})

const InfoChip = withStyles(theme => ({
  red: {
    background: theme.palette.red[700],
  },
  green: {
    background: theme.palette.secondary.main,
  },
  grey: {
    background: theme.palette.grey[500],
  },
  chip: {
    color: theme.palette.common.white,
    fontSize: 12,
    height: 22,
    width: 50,
    zIndex: 1,
  },
  icon: {
    fontSize: 12,
  },
}))(({status, proResponseStatus, read, shouldResponse, classes}) => {
  const label = React.useMemo(() => {
    if  (['progress', 'done'].includes(status)) return {text: '成約', color: 'green', icon: CheckIcon}
    else if (status === 'exclude' || proResponseStatus === 'decline') return {text: '候補外', color: 'grey'}
    else if (!read) return {text: 'NEW', color: 'red'}
    else if (read && shouldResponse) return {text: '要返信', color: 'red'}
    return null
  }, [status, proResponseStatus, read, shouldResponse])

  return label ? <Chip className={[classes.chip, classes[label.color]].join(' ')} label={<>{label.icon && <label.icon className={classes.icon} />}{label.text}</>} /> : null
})




@withStyles({
  container: {
    width: '100%',
    padding: '5px 20px',
    background: lightGreen[100],
    justifyContent: 'center',
    display: 'flex',
    height: 60,
    alignItems: 'center',
  },
  main: {
    maxWidth: 800,
    margin: 'auto',
    display: 'flex',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  line: {
    marginLeft: 'auto',
  },
  closeButton: {
    marginRight: 10,
    width: 15,
    height: 15,
  },
  close: {
    width: 15,
    height: 15,
  },
})
@connect(
  state => ({
    isConnected: state.auth.isLineFriend,
    lineExperiment: state.experiment.experiments.line_connection,
  }),
  { checkLineFriend, sendLog }
)
class LineConnectContainer extends React.Component {
  state = {
    loaded: false,
    hide: storage.get('lineConnectHide'),
  }

  componentDidMount() {
    this.props.checkLineFriend()
      .then(() => {
        if (!this.props.isConnected) {
          this.props.sendLog(BQEventTypes.web.LINE_CONNECT, {type: 'target'})
        }
        this.setState({loaded: true})
      })
  }

  handleClose = () => {
    storage.save('lineConnectHide', true)
    this.setState({hide: true})
  }

  render() {
    const { classes, isConnected, lineExperiment } = this.props

    if (this.state.hide || !this.state.loaded || isConnected || lineExperiment !== 'line_button') return null

    return (
      <Container className={classes.container}>
        <div className={classes.main}>
          <IconButton className={classes.closeButton} onClick={this.handleClose}><CloseIcon className={classes.close} /></IconButton>
          <Typography variant='body1'>プロからの連絡を簡単に確認</Typography>
          <div className={classes.spacer} />
          <LineConnect label='LINE連携' />
        </div>
      </Container>
    )
  }
}

let ReplyAppealBanner = (props) => {
  const { classes, replyExperiment } = props

  if (!replyExperiment) return null

  const messages = {
    control: <>
      提案してくれたプロに対して、依頼しない場合も一言伝えることを心がけましょう。
      <a href='https://help.smooosy.com/ja/articles/1969646-選ばなかったプロへはどうしたらいいですか' target='_blank' rel='nofollow noopener noreferrer'>よくある質問はこちら</a>
    </>,
    stay: <>
      提案してくれたプロに対して、検討中の場合も一言伝えることを心がけましょう。
      <a href='https://help.smooosy.com/ja/articles/2584966-プロを即決できない-検討に時間がかかる場合はどうすればいいですか' target='_blank' rel='nofollow noopener noreferrer'>よくある質問はこちら</a>
    </>,
  }

  return (
    <div className={classes.root}>{messages[replyExperiment] || messages.control}</div>
  )
}

ReplyAppealBanner = withStyles(theme => ({
  root: {
    background: '#F9FCF4',
    padding: '8px 16px',
    fontSize: 14,
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      textAlign: 'left',
    },
  },
}))(
connect(
  state => ({
    replyExperiment: state.experiment.experiments.reply_appeal,
  }),
)(ReplyAppealBanner))

@withRollOut
@withRouter
@withWidth()
@withStyles(theme => ({
  container: {
    width: '100%',
    padding: '5px 10px',
    background: amber[500],
    justifyContent: 'center',
    display: 'flex',
    height: 50,
    alignItems: 'center',
  },
  main: {
    maxWidth: 800,
    margin: 'auto',
    display: 'flex',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  deadline: {
    color: theme.palette.red[500],
  },
  emphasis: {
    fontSize: 24,
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  spacer: {
    flex: 1,
    minWidth: 4,
  },
  detailButton: {
    backgroundColor: theme.palette.common.white,
    fontSize: 14,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  closeButton: {
    marginRight: 10,
    width: 15,
    height: 15,
    padding: 0,
  },
  close: {
    width: 15,
    height: 15,
  },
  dialogContent: {
    padding: 0,
    minWidth: 200,
    width: '100%',
    '&:first-child': {
      padding: 0,
    },
  },
  dialogHeader: {
    fontSize: 20,
    textAlign: 'center',
  },
  dialogFotter: {
    width: '100%',
    textAlign: 'center',
    padding: 10,
  },
}))
@connect(
  null,
  { sendLog }
)
class ReviewCampaignContainer extends React.Component {
  state = {
    dialogOpen: false,
    hide: storage.get('reviewCampaignHide'),
  }

  gotoCampaign = () => {
    const { meet } = this.props
    if (meet) {
      this.props.history.push(`/reviews/${meet.id}/0`)
    } else {
      this.setState({dialogOpen: true})
    }
    this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
      component: 'banner',
      action_type: 'click',
    })
  }

  closeBanner = () => {
    storage.save('reviewCampaignHide', true)
    this.setState({hide: true})
    this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
      component: 'banner',
      action_type: 'close',
    })
  }

  closeDialog = () => {
    this.setState({dialogOpen: false})
  }

  render() {
    const { classes, meet, width, rollouts } = this.props

    if (rollouts && !rollouts.enableReviewCampaign) {
      return null
    }

    if (this.state.hide) {
      return null
    }

    const reviewExists = meet && meet.review
    if (reviewExists) {
      return null
    }

    return (
      <Container className={classes.container}>
        <div className={classes.main}>
          <IconButton className={classes.closeButton} onClick={this.closeBanner}><CloseIcon className={classes.close} /></IconButton>
          <div className={classes.description}>
            成約後のクチコミで最大<span className={classes.emphasis}>1,000</span>円分プレゼント中！<span className={classes.deadline}>6/30(日)まで</span>
          </div>
          <div className={classes.spacer} />
          <Button variant='outlined' className={classes.detailButton} onClick={this.gotoCampaign}>{width === 'xs' ? '詳細' : '詳細を見る'}</Button>
        </div>
        <Dialog
          open={this.state.dialogOpen}
          onClose={this.closeDialog}
        >
          <DialogContent classes={{root: classes.dialogContent}}>
            <CampaignReviewTerm showTitle/>
          </DialogContent>
          <DialogActions>
            <div className={classes.dialogFotter}>
              <Button size='small' variant='contained' color='primary' onClick={this.closeDialog}>閉じる</Button>
            </div>
          </DialogActions>
        </Dialog>
      </Container>
    )
  }
}
