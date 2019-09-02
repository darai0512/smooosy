import React from 'react'
import qs from 'qs'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Prompt, withRouter } from 'react-router'
import {
  Button,
  IconButton,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  RadioGroup,
  Radio,
  withStyles,
  withWidth,
} from '@material-ui/core'
import { lightGreen, amber, brown, blueGrey, green } from '@material-ui/core/colors'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import ActionThumbUp from '@material-ui/icons/ThumbUp'
import EditorAttachMoney from '@material-ui/icons/AttachMoney'
import CommunicationPhone from '@material-ui/icons/Phone'
import SocialPeople from '@material-ui/icons/People'
import ActionFeedback from '@material-ui/icons/Feedback'
import ToggleStar from '@material-ui/icons/Star'
import ActionEvent from '@material-ui/icons/Event'
import HiringIcon from '@material-ui/icons/CheckCircle'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import ReviewIcon from '@material-ui/icons/Stars'

import { withRollOut } from 'contexts/rollOut'
import { load as loadRequest } from 'modules/request'
import { load as loadMeet, unload as unloadMeet, update as updateMeet } from 'modules/meet'
import { readAll as readNotices } from 'modules/notice'
import { sendLog } from 'modules/auth'
import Chats from 'components/Chats'
import ChatForm from 'components/ChatForm'
import UserAvatar from 'components/UserAvatar'
import renderTextInput from 'components/form/renderTextInput'
import RatingStar from 'components/RatingStar'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ProfileBase from 'components/ProfileBase'
import ConfirmDialog from 'components/ConfirmDialog'
import hideIntercom from 'components/hideIntercom'
import Review from 'components/Review'
import ReviewMeetDialog from 'components/ReviewMeetDialog'
import ShareRequestBar from 'components/ShareRequestBar'
import HireDialog from 'components/HireDialog'
import { priceFormat } from 'lib/string'
import { timeNumbers, quickResponse, remindReason, excludeReason, FlowTypes, webOrigin, BQEventTypes } from '@smooosy/config'

import storage from 'lib/storage'


const TextInput = renderTextInput

@withRollOut
@withWidth({
  largeWidth: 1100,
})
@hideIntercom
@connect(
  state => ({
    user: state.auth.user,
    meet: state.meet.meet,
    request: state.request.request,
  }),
  { loadRequest, loadMeet, unloadMeet, updateMeet, readNotices, sendLog }
)
@withStyles(theme => ({
  button: {
    '&:hover': {
      background: lightGreen[100],
    },
  },
  ignoreDialogTitle: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  ignoreDialogListPadding: {
    padding: 0,
  },
  ignoreDialogContent: {
    padding: 0,
  },
  ignoreDialogText: {
    padding: 16,
  },
  reviewCampaignDialog: {
    maxWidth: 600,
    width: '100%',
  },
  reviewCampaignDialogPaper: {
    margin: 10,
    minWidth: 200,
    maxWidth: 600,
    width: '100%',
  },
  reviewCampaignBanner: {
    backgroundColor: amber[600],
    fontWeight: 'bold',
    padding: '40px 5px',
    textAlign: 'center',
  },
  reviewCampaignActions: {
    display: 'flex',
    padding: 10,
  },
  reviewCampaignBigText: {
    fontSize: 35,
    [theme.breakpoints.down('xs')]: {
      fontSize: 25,
    },
  },
  reviewCampaignText: {
    fontSize: 25,
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
    },
  },
  reviewCampaignGift: {
    color: theme.palette.common.white,
    fontSize: 50,
    [theme.breakpoints.down('xs')]: {
      fontSize: 30,
    },
  },
  reviewCampaignChatAction: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  reviewCampaignMessage: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 2,
    marginLeft: 8,
    fontSize: 12,
    color: theme.palette.common.black,
  },
}), {withTheme: true})
export default class MeetInfo extends React.Component {
  constructor(props) {
    super(props)
    const { reviewModal, rating } = props.location.state || {}
    const query = qs.parse(props.location.search.slice(1))
    const rollouts = this.props.rollouts || {}

    this.state = {
      confirmOpen: false,
      showIgnoreConfirm: false,
      nextLocation: null,
      remindReason: 'compare',
      excludeReason: 'price',
      quickDecline: false,
      rating: rating || query.rating || null,
      reviewModal: !rollouts.enableReviewCampaign && !!(reviewModal || rating || query.rating),
      reviewCampaignModal: !!rollouts.enableReviewCampaign && !!(reviewModal || rating || query.rating),
    }
    if (this.state.reviewCampaignModal) {
      this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
        component: 'dialog',
        action_type: 'open',
      })
    }
    window.customConfirm = this.customConfirm
  }

  componentDidMount() {
    const id = this.props.match.params.meetId
    const params = qs.parse(this.props.location.search.slice(1))
    if (params.status === 'waiting') {
      this.revertMeet(id)
    } else {
      this.loadMeet(id)
    }

    this.props.readNotices({
      type: { $in: [ 'newMeet', 'newChat', 'meetEnd' ] },
      model: 'Meet',
      item: this.props.match.params.meetId,
    })
  }

  componentDidUpdate(prevProps) {
    const id = this.props.match.params.meetId
    const prevId = prevProps.match.params.meetId

    if (id !== prevId) this.loadMeet(id)
  }

  componentWillUnmount() {
    window.customConfirm = null
    this.props.unloadMeet()
  }

  customConfirm = nextLocation => {
    const { showIgnoreConfirm } = this.state
    // 同じrequestをクリックした時とブッキングページへの遷移時は出さない
    if (showIgnoreConfirm && nextLocation !== this.props.location.pathname && !/booking$/.test(nextLocation)) {
      this.setState({showIgnoreConfirm: false, openIgnoreDialog: true, nextLocation})
      return false
    }
    return true
  }

  loadMeet = id => {
    const { request } = this.props
    const { state } = this.props.location
    const query = qs.parse(this.props.location.search.slice(1))
    this.props.loadMeet(id).then(res => res.meet).then(meet => {
      const chats = meet.chats.filter(c => c.user.id !== meet.pro.id)
      // プロのメッセージだけのとき
      if (request.status === 'open' && meet.status === 'waiting' && chats.length === 0) {
        this.setState({showIgnoreConfirm: true})
      } else {
        this.setState({showIgnoreConfirm: false})
      }

      if (query && query.utm_campaign && query.utm_campaign === '201906_review') {
        this.openReviewCampaignModal()
      } else if (request.status === 'close' && meet.status === 'done' && !meet.review) {
        if (!state || !state.backFromReviewCampaign) {
          this.openReviewCampaignModal()
        }
      }

      if (!meet.read) {
        this.props.loadRequest(this.props.request.id)
        window.mixpanel && window.mixpanel.track('user: meet read', {meet: id, request: request.id})
      }
    })
  }

  revertMeet = (id) => {
    this.props.updateMeet(id, {status: 'waiting'}).then(() => {
      this.props.history.push(this.props.location.pathname)
      this.props.loadRequest(this.props.request.id)
      this.loadMeet(id)
    })
  }

  handleQuickResponse = (event, value) => {
    if (value === quickResponse.decline) {
      this.setState({openExcludeDialog: true, quickDecline: true})
    } else {
      this.setState({initialText: value})
    }
  }

  handleRemind = () => {
    const id = this.props.meet.id
    const userName = this.props.meet.customer.lastname
    const proName = this.props.meet.profile.name
    const data = {}

    data.remindMessage = `${userName}様が${proName}様を候補に残すを選択しました`
    data.reason = this.state.remindReason
    if (data.reason === 'other') {
      data.remindReason = this.state.remindOtherReason || 'その他'
    } else {
      data.remindReason = remindReason[this.state.remindReason]
    }

    this.props.updateMeet(id, data)
      .then(() => {
        this.props.loadRequest(this.props.request.id)
        this.props.loadMeet(this.props.meet.id)
        this.setState({showIgnoreConfirm: false, openIgnoreDialog: false, openRemindDialog: false})
        setTimeout(this.scroll, 500)
      })
  }

  handleExclude = (isQuickResponse) => {
    const id = this.props.meet.id
    const data = {status: 'exclude'}

    data.reason = this.state.excludeReason
    if (data.reason === 'other') {
      data.excludeReason = this.state.excludeOtherReason
    }
    data.quickResponse = isQuickResponse

    this.props.updateMeet(id, data)
      .then(() => {
        this.props.loadRequest(this.props.request.id)
        this.props.loadMeet(this.props.meet.id)
        this.setState({showIgnoreConfirm: false, openIgnoreDialog: false, openExcludeDialog: false})
        setTimeout(this.scroll, 500)
      })
  }


  onSubmit = () => {
    this.props.loadRequest(this.props.request.id)
    this.loadMeet(this.props.meet.id)
    setTimeout(this.scroll, 500)
  }

  scroll = () => {
    if (this.chats) {
      this.chats.scrollTop = this.chats.scrollHeight
    }
  }

  handleRating = (rating) => {
    this.setState({rating})
  }

  openReviewCampaignModal = () => {
    const rollouts = this.props.rollouts || {}
    this.setState({
      reviewModal: !rollouts.enableReviewCampaign,
      reviewCampaignModal: !!rollouts.enableReviewCampaign,
    })
    if (rollouts.enableReviewCampaign) {
      this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
        component: 'dialog',
        action_type: 'open',
      })
    }
  }

  openReviewModal = () => {
    const rollouts = this.props.rollouts || {}
    if (rollouts.enableReviewCampaign) {
      this.props.history.push(`/reviews/${this.props.meet.id}/0`)
    } else {
      this.setState({
        reviewModal: !rollouts.enableReviewCampaign,
        reviewCampaignModal: !!rollouts.enableReviewCampaign,
      })
    }
  }

  openReviewCampaign = () => {
    this.setState({
      reviewCampaignModal: false,
    })
    this.props.history.push(`/reviews/${this.props.meet.id}/0`)
    this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
      component: 'dialog',
      action_type: 'next',
    })
  }

  onReviewSubmit = () => {
    const id = this.props.meet.id
    this.props.loadRequest(this.props.request.id)
    this.props.loadMeet(id)
    this.setState({reviewCampaignModal: false, reviewModal: false})
  }

  handleHire = () => {
    const id = this.props.meet.id
    this.props.updateMeet(id, {status: 'progress'})
      .then(() => {
        this.props.loadRequest(this.props.request.id)
        this.props.loadMeet(id)
        window.mixpanel && window.mixpanel.track('user: meet hired', {meet: id, request: this.props.request.id})
      })
    this.setState({confirmOpen: false})
    storage.save('reviewCampaignHide', false)
  }

  handleNextLocation = () => {
    const { nextLocation } = this.state
    this.setState({openIgnoreDialog: false, openRemindDialog: false, openExcludeDialog: false})
    if (nextLocation) {
      this.props.history.push(nextLocation)
    }
  }

  goInstantResult = () => {
    const { request } = this.props
    this.props.history.push(`/instant-results?serviceId=${request.service.id}&requestId=${request.id}`)
  }

  render() {
    const { profileMode, showIgnoreConfirm, initialText } = this.state
    const { user, request, meet, width, theme, classes } = this.props
    const { common, grey } = theme.palette

    const rollouts = this.props.rollouts || {}

    if (!meet) return null

    if (meet.pro.deactivate) {
      return <div style={{fontSize: 20, margin: 40}}>この見積もりはプロが退会済みのため、表示できません。</div>
    }

    const settledMeets = request.meets.filter(m => !m.proResponseStatus || ['accept', 'autoAccept'].includes(m.proResponseStatus))
    const matchMoreDecline = meet.proResponseStatus === 'decline' || (meet.proResponseStatus === 'tbd' && settledMeets.length >= 5)
    const limited = moment(request.createdAt).isBefore(moment().subtract(timeNumbers.requestExpireHourWithMargin, 'hours'))

    const showChat = width === 'md' || !profileMode
    const showProfile = width === 'md' || profileMode

    const styles = {
      root: {
        height: '100%',
        display: 'flex',
      },
      chat: {
        height: '100%',
        flex: 6,
        borderRight: showProfile ? `1px solid ${grey[300]}` : 'none',
        display: 'flex',
        flexDirection: 'column',
      },
      profile: {
        height: '100%',
        flex: 5,
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      columnHeader: {
        display: 'flex',
        alignItems: 'center',
        background: common.white,
        height: 57,
        padding: width === 'xs' ? 10 : 20,
        borderBottom: `1px solid ${grey[300]}`,
      },
      chats: {
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop: width === 'xs' ? 10 : 20,
      },
      priceHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
        width: '100%',
      },
      price: {
        margin: 10,
        fontSize: 20,
      },
      chatTitle: {
        textAlign: 'center',
        fontSize: '.8rem',
        color: grey[700],
        paddingTop: 10,
      },
      responseSuggest: {
        margin: '0 20px',
        padding: 0,
        background: common.white,
        border: `1px solid ${grey[300]}`,
        borderRadius: 8,
      },
      suggestList: {
        padding: '0 5px',
        borderRadius: 8,
      },
      response: {
        display: 'flex',
        alignItems: 'center',
        padding: width === 'xs' ? '8px 5px' : '10px 5px',
        fontSize: 14,
        flex: 1,
      },
      responseIcon: {
        minWidth: 20,
        maxHeight: 20,
        width: 20,
        height: 20,
      },
      actionIcon: {
        width: 36,
        height: 36,
        marginRight: 4,
        padding: 4,
      },
      media: {
        display: 'flex',
        flexWrap: 'wrap',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: 10,
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      border: {
        padding: 10,
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      pagingButtonLeft: {
        position: 'absolute',
        left: 0,
        top: '50%',
        marginTop: -30,
        height: 60,
        minWidth: 60,
        color: common.white,
        textShadow: `2px 2px 8px ${common.black}`,
      },
      pagingButtonRight: {
        position: 'absolute',
        right: 0,
        top: '50%',
        marginTop: -30,
        height: 60,
        minWidth: 60,
        color: common.white,
        textShadow: '2px 2px 8px #000',
      },
      dialogHeader: {
        display: 'flex',
        alignItems: 'center',
      },
    }

    const showButtons = ((meet.request.status === 'open' && meet.status === 'waiting') || meet.status === 'progress') && meet.profile
    const lastOneWaiting = request.status === 'open' && request.meets.filter(m => m.status === 'waiting').length === 1
    const isCreatedByUser = meet.isCreatedByUser

    const chatColumn = (
      <div style={styles.chat}>
        {
          width !== 'md' &&
          <div style={styles.columnHeader}>
            <div style={{flex: 1}}>
              {width === 'xs' && (
                <Button component={Link} to={`/requests/${meet.request.id}`} style={{minWidth: 40}}><NavigationChevronLeft/></Button>
              )}
            </div>
            <div onClick={() => this.setState({profileMode: true})} style={{padding: '0 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
              <a style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center'}}>{meet.profile ? meet.profile.name : '削除済みプロ'}</a>
              {meet.profile && <div style={{width: 120}}><RatingStar key={meet.id} rating={meet.profile.averageRating}/></div>}
            </div>
            <div style={{flex: 1}}/>
          </div>
        }
        <div ref={(e) => this.chats = e} style={styles.chats}>
          <p style={styles.chatTitle}>{meet.profile.name}様とのチャット</p>
          <Chats onIconClick={() => this.setState({profileMode: true})} unreadline chats={meet.chats} me={user} style={{padding: '0 10px'}} priceString={priceFormat(meet)} meet={meet} />
          {meet.request.status === 'open' && meet.status === 'waiting' &&
            meet.chats[meet.chats.length -1].user.id === meet.pro.id && meet.proResponseStatus !== 'decline' &&
            <div style={{marginBottom: 20}}>
              <p style={{margin: '5px 20px', fontWeight: 'bold'}}>クイック返信</p>
              <List style={styles.responseSuggest}>
                {Object.keys(quickResponse).filter(qr => (lastOneWaiting || isCreatedByUser) ? qr !== 'decline' : true).map(key =>
                  <ListItem button classes={{button: classes.button}} key={key} style={styles.suggestList} value={quickResponse[key]} onClick={(e) => this.handleQuickResponse(e, quickResponse[key])}>
                    <div style={{...styles.response, borderBottom: ((lastOneWaiting || isCreatedByUser) ? key === 'consulting' : key === 'decline') ? 0 : `1px solid ${grey[300]}`}}>
                      {key === 'ok' ?
                        <ActionThumbUp style={{...styles.responseIcon, color: grey[500]}} />
                      : key === 'include' ?
                        <EditorAttachMoney style={{...styles.responseIcon, color: amber[500]}} />
                      : key === 'phone' ?
                        <CommunicationPhone style={{...styles.responseIcon, color: green[500]}} />
                      : key === 'consulting' ?
                        <SocialPeople style={{...styles.responseIcon, color: blueGrey[500]}} />
                      : key === 'decline' ?
                        <ActionFeedback style={{...styles.responseIcon, color: brown[500]}} />
                      : null}
                      <p style={{marginLeft: 10}}>{quickResponse[key]}</p>
                    </div>
                  </ListItem>
                )}
              </List>
            </div>
          }
          <div style={{margin: '10px 20px 15px', display: 'flex', justifyContent: 'center'}}>
            {meet.request.status === 'suspend' ?
            <span>依頼キャンセル</span>
            : meet.review ?
            <span>完了</span>
            : meet.status === 'done' ?
            <ChatAction name='review_done' onClick={this.openReviewModal}>
              <div className={classes.reviewCampaignChatAction}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <ReviewIcon style={{color: amber[700], marginRight: 8}}/>
                  クチコミを投稿しましょう
                </div>
                {rollouts.enableReviewCampaign && <div className={classes.reviewCampaignMessage}>最大1,000円分プレゼント中！<span style={{color: theme.palette.red[500]}}>6/30(日)まで</span></div>}
              </div>
            </ChatAction>
            : meet.status === 'progress' ?
            <ChatAction name='review_progress' onClick={this.openReviewModal}>
              <div className={classes.reviewCampaignChatAction}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <ReviewIcon style={{color: amber[700], marginRight: 8}}/>
                  依頼が完了したのでクチコミを書く
                </div>
                {rollouts.enableReviewCampaign && <div className={classes.reviewCampaignMessage}>最大1,000円分プレゼント中！<span style={{color: theme.palette.red[500]}}>6/30(日)まで</span></div>}
              </div>
            </ChatAction>
            : matchMoreDecline ?
            <>
              {settledMeets.length < 5 && !limited &&
                <Button size='medium' variant='contained' color='primary' onClick={this.goInstantResult}>別のプロを探す</Button>
              }
            </>
            : meet.status === 'exclude' ?
            <span>候補外</span>
            : meet.request.status === 'close' ?
            <span>他の{meet.service.providerName}に決定済み</span>
            : ['inReview', 'tbd'].includes(meet.proResponseStatus) ?
            null
            : meet.status === 'waiting' && meet.request.status === 'open' ?
            <ChatAction name='hire' onClick={() => this.setState({confirmOpen: true})}>
              <HiringIcon style={{marginRight: 8}} color='secondary' />
              {`この${meet.service.providerName}に決定する`}
            </ChatAction>
            : null}
          </div>
          {meet.review &&
            <>
              <Divider />
              <div style={{padding: 10}}>
                <h3>クチコミ</h3>
                <Review review={meet.review} />
              </div>
              <ShareRequestBar
                meet={meet}
                title={`良い${meet.service.providerName}に出会えたら、シェアしよう！`}
                url={webOrigin}
                text=' '
              />
            </>
          }
        </div>
        <ReviewCampaignContainer meet={meet}/>
        {(meet.request.status !== 'suspend' && !matchMoreDecline) ?
          <ChatForm initialText={initialText} meet={meet} onSubmit={this.onSubmit}>
            {showButtons && <IconButton style={styles.actionIcon} onClick={() => this.props.history.push(`/requests/${meet.request.id}/responses/${meet.id}/booking`)}><ActionEvent classes={{root: classes.icon}} /></IconButton>}
            {showButtons && <IconButton style={styles.actionIcon} onClick={this.openReviewModal}><ToggleStar classes={{root: classes.icon}} /></IconButton>}
          </ChatForm>
        : null}
        <Dialog
          classes={{paper: classes.reviewCampaignDialogPaper, paperWidthXs: classes.reviewCampaignDialogPaper}}
          maxWidth='xs'
          open={this.state.reviewCampaignModal}
          onClose={() => this.setState({reviewCampaignModal: false})}
        >
          <div className={classes.reviewCampaignDialog}>
            <div className={classes.reviewCampaignBanner}>
              <div className={classes.reviewCampaignText}><span className={classes.reviewCampaignBigText}>3</span><span>つのクチコミ質問に答えて</span></div>
              <div className={classes.reviewCampaignGift}>Amazon ギフト券</div>
              <div className={classes.reviewCampaignText}>最大<span className={classes.reviewCampaignBigText}>1,000</span>円プレゼント中！</div>
            </div>
            <div className={classes.reviewCampaignActions}>
              <Button onClick={() => this.setState({reviewCampaignModal: false, reviewModal: false})}>
                まだ依頼中です
              </Button>
              <div style={{flex: 1}} />
              <Button variant='contained' size='large' color='primary' onClick={this.openReviewCampaign}>
                クチコミする
              </Button>
            </div>
          </div>
        </Dialog>
        <ReviewMeetDialog
          open={this.state.reviewModal && !meet.review}
          meet={meet}
          user={user}
          rating={this.state.rating}
          onClose={() => this.setState({reviewModal: false})}
          onSubmit={this.onReviewSubmit}
        />
      </div>
    )

    let media
    if (!meet.profile) {
      media = []
    } else if (meet.profile.serviceMedia) {
      const idList = meet.profile.serviceMedia.map(m => m.id)
      media = [...meet.profile.serviceMedia, ...meet.profile.media.filter(m => idList.indexOf(m.id) === -1)]
    } else {
      media = meet.profile.media
    }

    const profileColumn = (
      <AutohideHeaderContainer
        style={styles.profile}
        header={
          width !== 'md' && (
          <div style={styles.columnHeader}>
            <div style={{flex: 1}}>
              <Button style={{minWidth: 40}} onClick={e => {
                e.preventDefault();this.setState({profileMode: false})
              }} ><NavigationChevronLeft />戻る</Button>
            </div>
            <span>プロフィール</span>
            <div style={{flex: 1}} />
          </div>
          )
        }
      >
        {meet.profile ? <ProfileBase profile={{...meet.profile, pro: meet.pro, media}} /> : <div style={{margin: 20}}>削除済み</div>}
      </AutohideHeaderContainer>
    )

    // 画面遷移する前に理由を確認する
    const ignoreDialog = (
      <div>
        <Prompt when={showIgnoreConfirm && meet.status !== 'exclude' && request.status === 'open' && request.flowType !== FlowTypes.PPC} message={location => location.pathname} />
        <Dialog open={!!this.state.openIgnoreDialog} onClose={this.handleNextLocation} >
          <DialogTitle classes={{root: classes.ignoreDialogTitle}}>
            <div style={styles.dialogHeader}>
              <UserAvatar user={meet.pro} me={user} suspend={meet.profile.suspend} />
              {`${meet.profile.name}様を候補に残しますか？`}
            </div>
          </DialogTitle>
          <DialogContent classes={{root: classes.ignoreDialogContent}}>
            <List component='nav' classes={{padding: classes.ignoreDialogListPadding}}>
              <ListItem divider={true} button onClick={() => this.setState({openRemindDialog: true})} classes={{root: classes.ignoreDialogText}}>
                <ListItemText primary='候補に残す（まだ検討中）' />
                <KeyboardArrowRight />
              </ListItem>
              {!lastOneWaiting &&
                <ListItem divider={true} button onClick={() => this.setState({openExcludeDialog: true})} classes={{root: classes.ignoreDialogText}}>
                  <ListItemText primary='候補から外す' />
                  <KeyboardArrowRight />
                </ListItem>
              }
            </List>
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          title='検討中の理由について教えてください'
          open={!!this.state.openRemindDialog}
          onSubmit={this.handleRemind}
          onClose={this.handleNextLocation}
        >
          <RadioGroup name='remind' style={{paddingBottom: 10}} value={this.state.remindReason}>
            {Object.keys(remindReason).map(r =>
              <FormControlLabel key={r} value={r} control={<Radio color='primary' />} label={remindReason[r]} onClick={() => this.setState({remindReason: r})} />
            )}
          </RadioGroup>
          {this.state.remindReason === 'other' && <TextInput onChange={(e) => this.setState({remindOtherReason: e.target.value})} />}
        </ConfirmDialog>
        <ConfirmDialog
          title={`${meet.profile.name}を候補から外します`}
          open={!!this.state.openExcludeDialog}
          onSubmit={() => this.handleExclude(this.state.quickDecline)}
          onClose={() => this.state.quickDecline ? this.setState({openExcludeDialog: false, quickDecline: false}) : this.handleNextLocation()}
        >
        <RadioGroup name='exclude' style={{paddingBottom: 10}} value={this.state.excludeReason}>
            {Object.keys(excludeReason).map(r =>
              <FormControlLabel key={r} value={r} control={<Radio color='primary' />} label={excludeReason[r]} onClick={() => this.setState({excludeReason: r})} />
            )}
          </RadioGroup>
          {this.state.excludeReason === 'other' && <TextInput onChange={(e) => this.setState({excludeOtherReason: e.target.value})} />}
        </ConfirmDialog>
      </div>
    )


    return (
      <div style={styles.root}>
        {showChat && chatColumn}
        {showProfile && profileColumn}
        <HireDialog
          title={`${meet.profile.name}に決定します`}
          open={!!this.state.confirmOpen}
          onSubmit={this.handleHire}
          onClose={() => this.setState({confirmOpen: false})}
          image={meet.pro.image}
        />
        {ignoreDialog}
      </div>
    )
  }
}

@withStyles((theme) => ({
  root: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 8,
    borderColor: theme.palette.grey[300],
    borderRadius: 8,
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
}))
@connect(null, { sendLog })
class ChatAction extends React.Component {
  onClick = () => {
    this.props.sendLog(BQEventTypes.web.CHAT, {
      name: this.props.name || 'action',
      type: 'click',
    })
    this.props.onClick()
  }

  render() {
    const { children, classes } = this.props
    return (
      <Button variant='outlined' className={classes.root} onClick={this.onClick}>
        {children}
      </Button>
    )
  }
}

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
  button: {
    backgroundColor: theme.palette.common.white,
    fontSize: 14,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
}))
@connect(null, { sendLog })
class ReviewCampaignContainer extends React.Component {
  gotoCampaign = () => {
    const { meet } = this.props
    this.props.history.push(`/reviews/${meet.id}/0`)
    this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
      component: 'banner',
      action_type: 'click',
    })
  }

  render() {
    const { classes, meet, width, rollouts } = this.props

    if (rollouts && !rollouts.enableReviewCampaign) {
      return null
    }

    const reviewExists = meet && meet.review
    if (!reviewExists) {
      return null
    }

    const detailLen = meet.review.details ? meet.review.details.length : 0
    if (detailLen === 0 || detailLen >= 3) {
      return null
    }

    return (
      <div className={classes.container}>
        <div className={classes.main}>
          <div className={classes.description}>
            {`もう${3 - detailLen}問答えてAmazonギフト券を獲得しよう！`}<span className={classes.deadline}>6/30(日)まで</span>
          </div>
          <div className={classes.spacer} />
          <Button variant='outlined' className={classes.button} onClick={this.gotoCampaign}>{width === 'xs' ? '回答' : '回答する'}</Button>
        </div>
      </div>
    )
  }
}
