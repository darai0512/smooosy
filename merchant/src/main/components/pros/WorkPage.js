import React from 'react'
import qs from 'qs'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { sendLog } from 'modules/auth'
import { loadForPro as loadMeet, update as updateMeet } from 'modules/meet'
import { create as createChat } from 'modules/chat'
import { open as openSnack, close as closeSnack } from 'modules/snack'
import {
  Button,
  Menu,
  IconButton,
  MenuItem,
  RadioGroup,
  Radio,
  Dialog, DialogContent, DialogTitle,
  FormControl,
  FormControlLabel,
  withWidth,
  withStyles,
} from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationMoreVert from '@material-ui/icons/MoreVert'
import CloseIcon from '@material-ui/icons/Close'
import FlagIcon from '@material-ui/icons/Flag'
import PeopleIcon from '@material-ui/icons/People'
// import InvoiceIcon from '@material-ui/icons/Receipt'
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep'

import RequestInfo from 'components/RequestInfo'
import ThanksButton from 'components/ThanksButton'
import PriceBreakdown from 'components/PriceBreakdown'
import ProStatusBox from 'components/pros/ProStatusBox'
import WorkChat from 'components/pros/WorkChat'
import ReviewRequestForm from 'components/ReviewRequestForm'
import ConfirmDialog from 'components/ConfirmDialog'
import Insights from 'components/pros/Insights'
import hideIntercom from 'components/hideIntercom'
// import Balloon from 'components/Balloon'
import ShareRequestBar from 'components/ShareRequestBar'
import ResponsiveDialog from 'components/ResponsiveDialog'
import FirstMeetDialog from 'components/pros/FirstMeetDialog'
import RequestReviewDialog from 'components/pros/RequestReviewDialog'
import PointDisplay from 'components/PointDisplay'
import { priceFormat } from 'lib/string'
import { calcTab } from 'lib/status'
import { meetFaq, webOrigin, BQEventTypes } from '@smooosy/config'

@withStyles(theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.common.white,
    position: 'relative',
  },
  header: {
    height: 50,
    display: 'flex',
    padding: '0 10px',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  main: {
    flex: 1,
    display: 'flex',
    overflowY: 'auto',
  },
  chat: {
    height: '100%',
    flex: 6,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      borderRight: `1px solid ${theme.palette.grey[300]}`,
    },
  },
  info: {
    height: '100%',
    flex: 5,
    display: 'block',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  undoButton: {
    color: theme.palette.red[500],
  },
  closeIcon: {
    color: theme.palette.common.white,
  },
  subTitle: {
    padding: 10,
    background: theme.palette.grey[100],
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  priceBox: {
    maxWidth: 350,
    background: theme.palette.grey[50],
    borderRadius: 10,
    padding: 20,
  },
  floater: {
    fontSize: 16,
    width: '100%',
    position: 'relative',
    display: 'inline-block',
    padding: '7px 10px',
    background: theme.palette.common.white,
    border: `solid 2px ${theme.palette.grey[500]}`,
    boxSizing: 'border-box',
    borderRadius: 5,
    margin: '10px 0 0 5px',
    '&:before': {
      left: '50%',
      marginLeft: 0,
      content: '\'\'',
      position: 'absolute',
      top: -22,
      border: '6px solid transparent',
      borderBottom: `16px solid ${theme.palette.common.white}`,
      zIndex: 2,
    },
    '&:after': {
      content: '\'\'',
      position: 'absolute',
      left: '50%',
      top: -28,
      marginLeft: -2,
      border: '8px solid transparent',
      borderBottom: `19px solid ${theme.palette.grey[500]}`,
      zIndex: 1,
    },
    [theme.breakpoints.down('xs')]: {
      '&:before': {
        left: '100%',
        marginLeft: -32,
      },
      '&::after': {
        left: '100%',
        marginLeft: -34,
      },
    },
    '& p': {
      margin: 0,
      padding: 0,
      whiteSpace: 'pre-wrap',
    },
  },
}))
@withWidth()
@hideIntercom
@connect(
  state => ({
    user: state.auth.user,
    meet: state.meet.meet,
  }),
  { loadMeet, updateMeet, createChat, openSnack, closeSnack, sendLog }
)
@withRouter
export default class WorkPage extends React.Component {
  constructor(props) {
    super(props)
    const params = qs.parse(props.location.search.slice(1))
    this.state = {
      reviewModal: false,
      statusModal: params.modal === 'status',
      // balloon: false,
    }
  }

  componentDidMount() {
    const { meet } = this.props
    const { created } = this.props.location.state || {}

    if (created) {
      this.setState({
        showReviewRequest: meet.profile.reviews.length === 0,
      })
      this.props.history.replace(this.props.location.pathname)
    }
    this.autoArchive()
  }

  autoArchive = () => {
    const { status, meet } = this.props

    const tab = calcTab(meet)
    if (tab !== status) {
      this.props.history.replace(`/pros/${tab}/${meet.id}`)
      return
    }

    // archive === falseの時は自動ではゴミ箱に移動しない
    if (meet.archive !== undefined) return

    if (['waiting', 'talking'].includes(status) && meet.request.status !== 'open') {
      this.toggleArchive(true)
    }
  }

  handleDone = (reviewMsg) => {
    const { meet } = this.props

    const id = meet.id
    this.props.updateMeet(id, {status: 'done'})
      .then(() => {
        const msgData = {meetId: meet.id, text: reviewMsg.trim()}

        if (msgData.text.length) {
          return this.props.createChat(msgData)
        }
      })
      .then(() => this.props.loadMeet(id))
      .then(() => {
        if (this.state.reviewRequestBeforeArchive) {
          this.props.sendLog(BQEventTypes.web.REVIEW_REQUEST, {
            meet_id: id,
            action_type: 'create',
          })
          this.toggleArchive()
        } else {
          this.props.history.push(`/pros/hired/${id}`)
        }
      })
      .catch(err => {
        if (err.status === 409) {
          this.props.openSnack(err.data.message, {duration: 4000})
        }
      })
      .finally(this.closeReviewModal)
  }

  closeReviewModal = () => {
    this.setState({
      reviewModal: false,
      reviewRequestBeforeArchive: false,
    })
  }

  toggleArchive = isAuto => {
    const { meet, classes } = this.props
    if (this.state.reviewRequestBeforeArchive) {
      this.props.sendLog(BQEventTypes.web.REVIEW_REQUEST, {
        meet_id: meet.id,
        action_type: 'close',
      })
    } else {
      if (!isAuto && !meet.archive && meet.status === 'progress') {
        this.setState({
          reviewModal: true,
          reviewRequestBeforeArchive: true,
        })
        this.props.sendLog(BQEventTypes.web.REVIEW_REQUEST, {
          meet_id: meet.id,
          action_type: 'open',
        })
        return
      }
    }

    const snackOption = isAuto ? {
      duration: null,
      action: [
        <Button
          key='undo'
          size='small'
          className={classes.undoButton}
          onClick={() =>
            this.toggleArchive()
          }
        >取消</Button>,
        <IconButton key='close' onClick={this.props.closeSnack}><CloseIcon className={classes.closeIcon} /></IconButton>,
      ],
    } : {}

    meet.archive = !meet.archive
    this.props.updateMeet(meet.id, {archive: meet.archive})
      .then(() => {
        if (meet.archive) {
          this.props.openSnack(`ゴミ箱に移動しました${meet.refund ? ' ポイントは返還済みです' : ''}`, {anchor: {vertical: 'bottom', horizontal: 'left'}, ...snackOption})
        } else {
          this.props.openSnack('元に戻しました', {anchor: {vertical: 'bottom', horizontal: 'left'}})
        }
        const newStatus = calcTab(meet)
        this.props.history.push(`/pros/${newStatus}/${meet.id}`)
      })
  }

  selectStatus = (nextStatus) => {
    this.setState({nextStatus})
  }

  openUpdateStatusModal = () => {
    this.setState({statusModal: true})
  }

  updateStatus = (value) => {
    const { id, status } = this.props.meet
    const nextStatus = value || this.state.nextStatus
    if (nextStatus && nextStatus !== status) {
      this.props.updateMeet(id, {status: nextStatus})
        .then(() => {
          if (nextStatus === 'progress') this.props.history.push(`/pros/hired/${id}`)
          this.props.loadMeet(id)
        })
    }
    this.setState({statusModal: false})
  }

  markMeetAsRead = () => {
    const id = this.props.meet.id
    this.props.updateMeet(id, {displayPhone: true, read: true})
      .then(() => this.props.loadMeet(id))
  }

  render() {
    const { status, meet, user, width, classes } = this.props

    const request = meet.request
    request.service = meet.service

    const profile = meet.profile
    profile.pro = user

    const showChat = width === 'md' || !this.state.profileMode
    const showProfile = width === 'md' || this.state.profileMode

    const show = m =>
      (
        (m.status === 'waiting' && m.request.status === 'open') ||
        m.status === 'progress' ||
        (m.status === 'done' && !m.review)
      )


    const links = [
      {
        text: '他のプロと比較',
        icon: PeopleIcon,
        variant: 'contained',
        id: 'compare-other-pro',
        action: () => this.setState({showInsights: true}),
      },
    ]
    if (show(meet)) {
      links.unshift({
        text: '成約',
        icon: FlagIcon,
        variant: 'contained',
        action: () => this.setState({statusModal: true}),
      })
    }
    // if (['progress', 'done'].includes(meet.status)) {
    //   links.push({
    //     text: '請求書作成',
    //     icon: InvoiceIcon,
    //     variant: 'outlined',
    //     action: () => this.props.history.push(window.location.pathname + '/invoice'),
    //   })
    // }
    if (status !== 'archive') {
      links.push({
        text: 'ゴミ箱に移動',
        icon: DeleteSweepIcon,
        variant: 'flat',
        action: () => this.toggleArchive(),
      })
    } else if (meet.archive) {
      links.push({
        text: 'ゴミ箱から出す',
        icon: DeleteSweepIcon,
        variant: 'flat',
        action: () => this.toggleArchive(),
      })
    }

    // const steps = [{
    //   disableBeacon: true,
    //   title: 'ここから他のプロと比較ができます',
    //   target: width === 'xs' ? '#menu-button' : '#compare-other-pro',
    //   placement: 'bottom',
    // }]

    const priceComponent = meet.isCreatedByUser ? (
      <>
        <div style={{margin: 20, display: 'flex', justifyContent: 'center'}}>
          <ProStatusBox meet={meet} meetsCount={request.meets.length} />
        </div>
        <h4 className={classes.subTitle}>
          あなたの設定価格
        </h4>
        <div style={{padding: 10}}>
          <PriceBreakdown price={meet.priceValues} />
        </div>
      </>
    ) : null

    return (
      <>
        <div className={classes.root}>
          <div className={classes.header}>
            {width === 'xs' && showChat &&
              <div style={{flex: 1}}>
                <Link to={`/pros/${status}`}>
                  <Button style={{minWidth: 40}}><NavigationChevronLeft /></Button>
                </Link>
              </div>
            }
            {width !== 'md' && showProfile &&
              <Button style={{minWidth: 40}} onClick={() => this.setState({profileMode: false})}><NavigationChevronLeft /></Button>
            }
            {
              width === 'xs' && !showProfile &&
              <div style={{minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <a style={{width: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} onClick={() => this.setState({profileMode: true})}>{`${meet.customer.lastname}様`}</a>
                <span style={{fontSize: 12}}>{priceFormat(meet)}</span>
              </div>
            }
            {width === 'xs' ?
              <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                <IconButton id='menu-button' onClick={e => this.setState({anchor: e.currentTarget})}>
                  <NavigationMoreVert />
                </IconButton>
                <Menu
                  open={!!this.state.anchor}
                  anchorEl={this.state.anchor}
                  getContentAnchorEl={null}
                  anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                  transformOrigin={{horizontal: 'right', vertical: 'top'}}
                  onClose={() => this.setState({anchor: null})}
                >
                  {links.map((link, i) =>
                    <MenuItem key={'workpage_' + i} onClick={link.action}>
                      {link.icon && <link.icon style={{marginRight: 5}} />}
                      {link.text}
                    </MenuItem>
                  )}
                </Menu>
              </div>
            :
              links.map((link, i) => (
                <React.Fragment key={i}>
                  <Button id={link.id} variant={link.variant} size='small' color='primary' onClick={link.action} style={{marginLeft: 5, marginRight: 5}}>
                    {link.icon && <link.icon style={{marginRight: 5}} />}
                    {link.text}
                  </Button>
                  {i === links.length - 1 && <div key='divider' style={{flex: 1}} />}
                </React.Fragment>
              ))
            }
          </div>
          <div className={classes.main}>
            {showChat &&
              <div className={classes.chat}>
                <WorkChat
                  meet={meet}
                  currentPath={`/pros/${status}/${meet.id}`}
                  handleDone={this.handleDone}
                  goToProfile={() => this.setState({profileMode: true})}
                  requestReview={() => this.setState({reviewModal: true})}
                  onUpdateStatusClick={this.openUpdateStatusModal}
                  updateMeetStatus={this.updateStatus}
                  chatFormFooter={
                    <ShareRequestBar meet={meet}
                      title='クチコミをもらえたことをシェアしませんか？'
                      url={`${webOrigin}/p/${profile.shortId}#review`}
                      text={`SMOOOSYで${meet.service.name}の仕事をし、クチコミをいただきました！`}
                    />
                  }
                />
              </div>
            }
            {showProfile &&
              <div className={classes.info}>
                <RequestInfo
                  hidePhone={meet.refund}
                  onDisplayPhone={this.markMeetAsRead}
                  request={{...request, point: Number.isInteger(meet.point) ? meet.point : request.point}}
                  customer={meet.customer}
                  profile={meet.profile}
                  customerSpace={<ThanksButton user={meet.customer} />}
                  middleSpace={priceComponent}
                  noCountDown
                  pointComponent={<PointDisplay point={meet.point} />}
                />
              </div>
            }
          </div>
          <Dialog
            open={!!this.state.showReviewRequest}
            onClose={() => this.setState({showReviewRequest: false})}
          >
            <DialogTitle>
              クチコミがある場合、依頼主があなたを選ぶ可能性は倍以上に高まります。
            </DialogTitle>
            <DialogContent>
              <h3>過去の顧客にクチコミを依頼しましょう</h3>
              <div>SMOOOSY以外の顧客でも大丈夫です。</div>
              <ReviewRequestForm
                profile={profile}
                pro={user}
                onSent={() => setTimeout(() => this.setState({showReviewRequest: false}), 1000)}
                onSkip={() => this.setState({showReviewRequest: false})}
              />
            </DialogContent>
          </Dialog>
          <RequestReviewDialog
            handleDone={this.handleDone}
            title={this.state.reviewRequestBeforeArchive ? `${meet.customer.lastname}様にクチコミを依頼しませんか？` : `${meet.customer.lastname}様にクチコミを依頼します`}
            open={!!this.state.reviewModal}
            reviewRequestBeforeArchive={this.state.reviewRequestBeforeArchive}
            meetFaq={meetFaq}
            toggleArchive={this.toggleArchive}
            onClose={this.closeReviewModal}
          />
          <ConfirmDialog
            title='案件のステータスを更新する'
            open={!!this.state.statusModal}
            onSubmit={this.updateStatus}
            label='更新する'
            onClose={() => this.setState({statusModal: false})}
          >
            <FormControl>
              <RadioGroup name='status' value={this.state.nextStatus || meet.status} onChange={(e, value) => this.selectStatus(value)}>
                <FormControlLabel control={<Radio color='primary' />} value='waiting' label='まだ雇われていません' disabled={meet.status !== 'waiting'} />
                <FormControlLabel control={<Radio color='primary' />} value='progress' label='成約しました' />
                <FormControlLabel control={<Radio color='primary' />} value='done' label='仕事が完了したのでクチコミを依頼する' />
              </RadioGroup>
            </FormControl>
          </ConfirmDialog>
          <ResponsiveDialog
            title='この依頼に応募したプロ'
            open={!!this.state.showInsights}
            onClose={() => this.setState({showInsights: false})}
          >
            <Insights meet={meet} user={user} />
          </ResponsiveDialog>
        </div>
        <FirstMeetDialog onClose={() => {/*this.setState({balloon: true})*/}} />
        {/* <Balloon
          disableOverlay
          steps={steps}
          open={this.state.balloon}
          floaterProps={{hideArrow: true}}
        >
          <div className={classes.floater} onClick={() => this.setState({balloon: false})}>
            <p>ここから他のプロと比較ができます！</p>
          </div>
        </Balloon> */}
      </>
    )
  }
}
