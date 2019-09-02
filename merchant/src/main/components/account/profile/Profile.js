import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import qs from 'qs'

import { Avatar, Button, Checkbox, Paper, Menu, IconButton, MenuItem } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core'
import { Tabs, Tab } from '@material-ui/core'
import { FormControlLabel, FormGroup } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationMoreVert from '@material-ui/icons/MoreVert'
import ActionLanguage from '@material-ui/icons/Language'
import CommunicationPhone from '@material-ui/icons/Phone'
import ActionVerifiedUser from '@material-ui/icons/VerifiedUser'
import AvPlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import ActionRoom from '@material-ui/icons/Room'
import ImageAddAPhoto from '@material-ui/icons/AddAPhoto'
import CloseIcon from '@material-ui/icons/Close'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import IdFileIcon from '@material-ui/icons/Portrait'
import withWidth from '@material-ui/core/withWidth'

import { withApiClient } from 'contexts/apiClient'
import { identification } from 'modules/auth'
import { loadAllForPro as loadSchedules } from 'modules/schedule'
import { show as loadProQuestions } from 'modules/proQuestion'
import { load as loadProfile, loadAll as loadAllProfile, deactivate, resume, updateReview } from 'modules/profile'
import { loadMediaList } from 'modules/media'
import { readAll as readNotices } from 'modules/notice'
import FileUploader from 'components/FileUploader'
import Notice from 'components/Notice'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ProSummary from 'components/ProSummary'
import ReviewStat from 'components/ReviewStat'
import ReviewForPro from 'components/ReviewForPro'
import InquiryLink from 'components/InquiryLink'
import LicenceLink from 'components/LicenceLink'
import ProfileProgress from 'components/ProfileProgress'
import MediaSlider from 'components/MediaSlider'
import MainEdit from 'components/account/profile/MainEdit'
import MediaEdit from 'components/account/profile/MediaEdit'
import AboutEdit from 'components/account/profile/AboutEdit'
import LicenceEdit from 'components/account/profile/LicenceEdit'
import BusinessHourEdit from 'components/pros/BusinessHourEdit'
import ProAnswerEdit from 'components/account/profile/ProAnswerEdit'
import ProfilePreview from 'components/ProfilePreview'
import ReviewRequest from 'components/account/ReviewRequest'
import ConfirmDialog from 'components/ConfirmDialog'
import ProOnBoarding from 'components/pros/ProOnBoarding'
import { explicitSuspend } from 'lib/status'
import { imageSizes, fileMime } from '@smooosy/config'

const dialogTitle = {
  'main': '事業者情報',
  'media': '写真',
  'about': '詳細プロフィール',
  'licence': '資格・免許',
  'businessHour': '営業時間',
  'proAnswer': '回答',
}

const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']

@withApiClient
@withWidth({withTheme: true})
@connect(
  state => ({
    user: state.auth.user,
    proQuestions: state.proQuestion.proQuestions,
    profile: state.profile.profile,
    profiles: state.profile.profiles,
    mediaLists: state.media.mediaLists,
  }),
  { identification, loadSchedules, loadProQuestions, loadProfile, loadAllProfile, loadMediaList, deactivate, resume, readNotices, updateReview }
)
export default class Profile extends React.Component {
  constructor(props) {
    super(props)
    this.anchors = {}
    this.state = {
      isComplete: false,
      idImages: [],
      idImageIdx: 0,
      idImageError: false,
      isOpenProfileDialog: false,
      resume: [],
      currentQuestionPage: 0,
      questionTab: 'no answer',
    }
  }

  componentDidMount() {
    this.load(this.props.match.params.id)
    this.props.readNotices({
      type: { $in: [ 'identificationValid', 'identificationInvalid'] },
    })
  }

  load = id => {
    this.props.loadSchedules({recurrence: 'week'})
    this.props.loadProQuestions(id)
    this.props.loadProfile(id).then(res => {
      const profile = res.profile
      const isComplete = profile.pro.imageUpdatedAt && profile.description
      this.setState({isComplete})
      this.selectPreviewService(profile.services[0])
      this.editByHash()
    }).then(() => this.props.loadAllProfile())
    this.props.loadMediaList({profile: id})
  }

  editByHash = () => {
    const hash = this.props.location.hash.slice(1)
    if (dialogTitle[hash]) {
      this.setState({edit: hash})
    }
  }

  handleUpload = () => {
    this.props.identification(this.state.idImages.map(img => img.key))
  }

  onCreateObjectURL = (url) => {
    const { idImages, idImageIdx } = this.state
    idImages.push({
      localUrl: url,
      idx: idImageIdx,
    })
    this.setState({
      idImageUploading: true,
      idImages,
      idImageIdx: idImageIdx + 1,
    })
  }

  handleFile = ({data, type}) => {
    const { idImages } = this.state
    idImages[idImages.length - 1] = {
      idx: idImages[idImages.length -1].idx,
      localUrl: data.imageUrl,
      imageUrl: data.imageUrl,
      key: data.key,
      isPDF: type.mime === fileMime.types.application.pdf,
    }

    this.setState({
      idImageUploading: false,
      idImages,
      idImageError: false,
      fileError: null,
    })
  }

  handleFileError = (fileError) => {
    this.setState({
      idImageError: !this.state.idImages.length,
      fileError,
    })
  }

  deactivateProfile = () => {
    this.props.deactivate(this.props.profile.id)
    .then(() => {
      this.setState({deactivateConfirm: false})
      this.props.history.replace('/account/profiles')
    })
  }


  openProfileDialog = () => {
    this.setState({ isOpenProfileDialog: true })
  }

  closeProfileDialog = () => {
    this.setState({ isOpenProfileDialog: false })
  }

  openEditDialog = edit => {
    this.setState({edit})
    this.props.history.replace(`/account/profiles/${this.props.profile.id}#${edit}`)
  }

  closeEditDialog = () => {
    const type = this.state.edit
    this.setState({edit: false})
    this.props.history.replace(`/account/profiles/${this.props.profile.id}`)
    if (this.anchors[type]) {
      this.container.scrollTop = this.anchors[type].offsetTop - 100
    }
  }

  selectPreviewService = s => {
    this.setState({
      previewAnchor: null,
      previewService: s,
    })
  }

  deleteIdImage = image => {
    const { idImages } = this.state
    if (image.imageUrl) {
      this.props.apiClient.put('/api/users/idImage', {key: image.key})
    }
    this.setState({ idImages: idImages.filter(img => image.idx !== img.idx) })
  }

  handleResume = () => {
    const { resume } = this.state
    this.props.resume(this.props.profile.id, resume).then(() => this.setState({resumeDialog: false}))
  }

  selectProfile = (e, checked) => {
    const { resume } = this.state
    if (checked) {
      this.setState({resume: new Set(...resume, e.target.value)})
    } else {
      this.setState({resume: resume.filter(r => r.id !== e.target.value)})
    }
  }

  updateReview = values => {
    return this.props.updateReview(values)
      .then(() => this.load(this.props.match.params.id))
  }

  changeQuestionTab = (e, questionTab) => {
    this.setState({
      questionTab,
      currentQuestionPage: 0,
    })
  }

  render() {
    const { isComplete, edit, slideNumber, deactivateConfirm, isOpenProfileDialog, previewService, idImageUploading, idImages, currentQuestionPage, questionTab } = this.state
    const { user, proQuestions, profile, profiles, mediaLists, width, theme } = this.props
    const { common, grey, secondary, red, blue } = theme.palette
    const identification = user.identification || {}

    if (!profile || !mediaLists || isComplete === false) {
      return null
    }

    const previewMedia = []
    for (let list of mediaLists) {
      if (previewService && list.service.id === previewService.id) {
        previewMedia.push(...list.media)
        break
      }
    }

    const idList = previewMedia.map(m => m.id)
    previewMedia.push(...profile.media.filter(m => idList.indexOf(m.id) === -1))

    const styles = {
      root: {
        height: '100%',
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        margin: '20px auto',
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: width === 'xs' ? 'initial': 700,
      },
      paper: {
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
        marginBottom: 40,
      },
      title: {
        padding: 10,
      },
      media: {
        display: 'flex',
        flexWrap: 'wrap',
        padding: 10,
      },
      readmore: {
        fontSize: 16,
      },
      description: {
        padding: '5px 10px 25px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontSize: 12,
      },
      info: {
        borderBottom: `1px solid ${grey[300]}`,
        padding: '15px 10px',
        fontSize: 14,
      },
      upload: {
        position: 'relative',
        width: 280,
        height: 180,
        marginBottom: 10,
        padding: 20,
        background: grey[100],
        border: `2px dashed ${grey[500]}`,
        cursor: 'copy',
      },
      uploadImage: {
        position: 'relative',
        height: 180,
        width: 280,
        border: `2px dashed ${grey[500]}`,
        cursor: 'copy',
        marginBottom: 10,
      },
      add: {
        position: 'absolute',
        width: 50,
        height: 50,
        top: '50%',
        left: '50%',
        background: grey[500],
        margin: '-25px 0 0 -25px',
      },
    }

    const serviceSelector = previewService ?
      <div>
        <Button size='small' onClick={e => this.setState({previewAnchor: e.currentTarget})}>
          <div>{previewService.name}</div>
          <KeyboardArrowDownIcon />
        </Button>
        <Menu
          open={!!this.state.previewAnchor}
          anchorEl={this.state.previewAnchor}
          onClose={() => this.setState({previewAnchor: null})}
        >
          {profile.services.map(s =>
            <MenuItem key={s.id} selected={previewService.name === s.name} onClick={() => this.selectPreviewService(s)}>{s.name}</MenuItem>
          )}
        </Menu>
      </div>
    : null

    const questions = proQuestions.filter(pq =>
      (questionTab === 'no answer' && !pq.answer) ||
      (questionTab === 'answered' && !!pq.answer)
    )
    const showQuestions = questions.slice(currentQuestionPage * 5, (currentQuestionPage + 1) * 5)

    return (
      <AutohideHeaderContainer
        style={styles.root}
        setRef={e => this.container = e}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} ><NavigationChevronLeft /></Button>
                </Link>
              }
            </div>
            <div>プロフィール</div>
            <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
              {profile.meetsLength === 0 && user.profiles.length > 1 &&
                <IconButton onClick={e => this.setState({anchor: e.currentTarget})}><NavigationMoreVert /></IconButton>
              }
              <Menu
                open={!!this.state.anchor}
                anchorEl={this.state.anchor}
                getContentAnchorEl={null}
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                onClose={() => this.setState({anchor: null})}
              >
                <MenuItem button onClick={() => this.setState({deactivateConfirm: true, anchor: null})} >
                  このプロフィールを削除する
                </MenuItem>
              </Menu>
            </div>
          </div>
        }
      >
        <Helmet>
          <title>プロフィールを編集</title>
        </Helmet>
        <div style={styles.main}>
          {profile.suspend === '一時休止' ?
            <Notice type='warn'>
              <p>一時休止中です</p>
              <Button size='small' variant='contained' color='primary' style={{marginTop: 10}} onClick={() => this.setState({resumeDialog: true, resume: profiles.map(p => p.id)})}>解除する</Button>
            </Notice>
          : explicitSuspend(profile.suspend) ?
            <Notice type='error'>
              <p>サスペンド中です（{profile.suspend}）。</p>
              <p>サスペンド解除の依頼は<InquiryLink />から承ります。</p>
            </Notice>
          : null}
          {isComplete ?
            <div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>ユーザに表示されるプロフィール</h4>
                <div style={{flex: 1}} />
              </div>
              <div style={{...styles.paper}}>
                <div style={{padding: 10}}>
                  <div style={{padding: 10}}>
                    <h4>公開プロフィールページ</h4>
                    {profile.hideProfile || explicitSuspend(profile.suspend) ?
                      <div style={{margin: '10px 0 0 10px', color: grey[700]}}>
                        現在プロフィールページは非表示となっております
                      </div>
                    :
                      <div style={{margin: '10px 0 0 10px'}}>
                        <a href={`/p/${profile.shortId}`} target='_blank' rel='noopener noreferrer'>{profile.name} - {profile.address}</a>
                        <p style={{fontSize: 12}}>※ユーザーがあなたのプロフィールページから依頼を送信することができます</p>
                      </div>
                    }
                  </div>
                  <div style={{padding: 10}}>
                    <h4>応募した依頼者に表示されるプロフィール</h4>
                    <div style={{marginLeft: 10, marginTop: 10}}>
                      <a onClick={this.openProfileDialog}>プレビュー</a>
                    </div>
                  </div>
                </div>
              </div>
              <div ref={e => this.anchors.main = e} style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>事業者情報</h4>
                <div style={{flex: 1}} />
                <Button color='primary' onClick={() => this.openEditDialog('main')}>編集する</Button>
              </div>
              <div style={{...styles.paper, padding: 20}}>
                <ProSummary user={profile.pro} profile={profile} />
                <div style={{fontSize: '.8em', color: grey[800], marginTop: 10}}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <CommunicationPhone style={{marginRight: 5, width: 20, color: grey[800]}} />
                    {profile.pro.phone ?
                      <a href={`tel:${profile.pro.phone}`}>{profile.pro.phone}</a>
                    :
                      '電話番号が登録されていません'
                    }
                  </div>
                </div>
              </div>
              <div ref={e => this.anchors.media = e} style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>写真({previewMedia.length})</h4>
                <div style={{flex: 1}} />
                <Button color='primary' onClick={() => this.openEditDialog('media')}>編集する</Button>
              </div>
              <div style={styles.paper}>
                <div style={{padding: '10px 10px 0'}}>{serviceSelector}</div>
                <div style={styles.media}>
                  {previewMedia.length ? previewMedia.map((m, idx) => (
                    <Paper key={m.id} style={{margin: 5, height: 72, cursor: 'pointer', position: 'relative'}} onClick={() => this.setState({slideNumber: idx})}>
                      <img alt={m.text} src={m.url + imageSizes.c160} height={72} />
                      {m.type === 'video' && <AvPlayCircleFilled style={{position: 'absolute', top: '50%', left: '50%', marginTop: - 20, marginLeft: -20, width: 40, height: 40, color: 'rgba(255, 255, 255, .5)'}} />}
                    </Paper>
                  )) : 'このサービスでは設定されていません'}
                </div>
                <div style={{padding: '0 10px 10px', fontSize: 14}}>※サービスごとの写真→共通の写真の順で表示されます</div>
              </div>
              <h4 style={styles.title}>クチコミ({profile.reviews.length})</h4>
              <div style={styles.paper}>
                <div style={{padding: 20, borderBottom: `1px solid ${grey[200]}`}}>
                  <ReviewStat averageRating={profile.averageRating} reviews={profile.reviews} />
                </div>
                <div style={{padding: 20, borderBottom: `1px solid ${grey[200]}`, display: 'flex', flexDirection: 'column'}}>
                  {profile.reviews.length ?
                    profile.reviews.slice(0, 3).map((r, i) =>
                      <div key={i} style={{marginBottom: 20}}>
                        <ReviewForPro review={r} onReply={this.updateReview} />
                      </div>
                    )
                  :
                    'クチコミはまだありません'
                  }
                  <Button color='primary'><Link to={`/account/reviews/${profile.id}`} style={styles.readmore}>全て表示する</Link></Button>
                </div>
              </div>
              <ReviewRequest profile={profile} />
              <div ref={e => this.anchors.about = e} style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>詳細プロフィール</h4>
                <div style={{flex: 1}} />
                <Button color='primary' onClick={() => this.openEditDialog('about')}>編集する</Button>
              </div>
              <div style={styles.paper}>
                <div style={{padding: 10}}>
                  <h5>自己紹介（事業内容・提供するサービス）</h5>
                  <p style={styles.description}>{profile.description}</p>
                  <h5>これまでの実績</h5>
                  <p style={styles.description}>{profile.accomplishment}</p>
                  <h5>アピールポイント</h5>
                  <p style={styles.description}>{profile.advantage}</p>
                  <h5>経験年数</h5>
                  <p style={styles.description}>{profile.experience ? `${profile.experience}年` : ''}</p>
                  <h5>従業員数</h5>
                  <p style={styles.description}>{profile.employees ? `${profile.employees}人` : ''}</p>
                  <div style={{...styles.info, borderTop: `1px solid ${grey[300]}`}}>
                    <div style={{color: grey[700]}}>
                      <ActionRoom style={{width: 18, height: 18, color: grey[700]}} /> 拠点
                    </div>
                    <div style={{marginLeft: 20}}>{profile.address}</div>
                  </div>
                  <div style={styles.info}>
                    <div style={{color: grey[700]}}>
                      <ActionLanguage style={{width: 18, height: 18, color: grey[700]}}/> ウェブサイト
                    </div>
                    <div style={{marginLeft: 20, wordBreak: 'break-all'}}>
                      {profile.url ?
                        <a href={/^http/.test(profile.url) ? profile.url : 'http://' + profile.url} target='_blank' rel='nofollow noopener noreferrer'>
                          {profile.url}
                        </a>
                      :
                        'まだ登録されていません'
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div ref={e => this.anchors.businessHour = e} style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>営業時間</h4>
                <div style={{flex: 1}} />
                <Button color='primary' onClick={() => this.openEditDialog('businessHour')}>編集する</Button>
              </div>
              <div style={styles.paper}>
                <div style={{padding: 10}}>
                  {user.setupBusinessHour ? user.schedule.dayOff.map((d, idx) =>
                    <div key={`weekday_${idx}`}>
                      {weekdays[idx] + ' ' + (!d ? `${user.schedule.startTime}時 〜 ${user.schedule.endTime}時まで` : '定休日')}
                    </div>
                  ) : 'まだ設定されていません'}
                </div>
              </div>
              <div ref={e => this.anchors.proAnswer = e} style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>よくある質問</h4>
                <div style={{flex: 1}} />
                <Button
                  color='primary'
                  onClick={() => this.openEditDialog('proAnswer')}
                  disabled={questions.length === 0}
                >
                  回答する
                </Button>
              </div>
              <div style={styles.paper}>
                <Tabs value={questionTab} onChange={this.changeQuestionTab}>
                  <Tab value='no answer' label={`未回答 (${proQuestions.filter(pq => !pq.answer).length})`} />
                  <Tab value='answered' label={`回答済み (${proQuestions.filter(pq => pq.answer).length})`} />
                </Tabs>
                <div style={{padding: 10}}>
                  {showQuestions.length > 0 ? showQuestions.map(pq =>
                    <div key={pq.id} style={{fontSize: 13}}>
                      <h4 style={{color: grey[800]}}>{pq.text}</h4>
                      <div style={{marginBottom: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90vw'}}>{pq.answer}</div>
                    </div>
                  ) :
                    <div style={{padding: 20}}>まだ質問はありません</div>
                  }
                  <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
                    <div style={{marginRight: 10}}>ページ</div>
                    {[...Array(Math.ceil(questions.length / 5) || 1)].map((_, idx) =>
                      <a
                        key={`proanswer_${idx}`}
                        style={idx === currentQuestionPage ?
                          {color: grey[500], pointerEvents: 'none', marginleft: 10, marginRight: 10}
                        : {color: blue.A200, pointerEvents: 'auto', marginleft: 10, marginRight: 10}}
                        onClick={() => this.setState({currentQuestionPage: idx})}
                      >
                        {idx + 1}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <h4 style={styles.title}>本人確認</h4>
              <div style={styles.paper}>
                <div style={{padding: 10}}>
                  {identification.status === 'pending' ?
                    <div style={{margin: 10}}>
                      <h4>本人確認書類の確認作業中です</h4>
                      <div style={{marginTop: 10}}>
                        <p>本人確認の実施ありがとうございます。</p>
                        <p>お預かりした本人確認書類の画像は、5営業日以内に事務局で確認作業をいたします。</p>
                        <p>確認が済みました画像は直ちに削除され、他の目的に利用することはありません。</p>
                      </div>
                    </div>
                  : identification.status === 'valid' ?
                    <h4 style={{margin: 10, display: 'flex', alignItems: 'center'}}>
                      <ActionVerifiedUser style={{marginRight: 5, width: 20, color: secondary.main}} />
                      本人確認済み
                    </h4>
                  :
                    <div style={{margin: 10}}>
                      {identification.status === 'invalid' && <Notice type='warn' style={{margin: '0 0 10px'}}>本人確認ができませんでした。お手数ですが再度お願いいたします。</Notice>}
                      <h4><span style={{color: red[500]}}>✘</span> 本人確認が済んでいません</h4>
                      <div style={{marginTop: 10, fontSize: 14}}>
                        <p>SMOOOSYでのあなたの信頼性向上のために、本人確認をおすすめしております。</p>
                        <p>本人確認が完了すると、あなたのプロフィールに本人確認済みバッジが表示されます。</p>
                        <p>ユーザーが安心して依頼できるプロフィールにしましょう。</p>
                        <div style={{height: 20}} />
                        <div style={{fontSize: 16, marginBottom: 10}}>
                          <p>以下の本人確認書類のうち、いずれか1種類の画像をアップロードしてください。</p>
                          <div style={{height: 10}} />
                          <p>【法人の場合】</p>
                          <p>・履歴事項全部証明書または現在事項証明書（登記簿謄本・3か月以内に発行されたもの、有効期限のページ必須）</p>
                          <div style={{height: 10}} />
                          <p>【個人の場合】</p>
                          <p>・運転免許証（有効期限内のもの）</p>
                          <p>・健康保険証（国民健康保険証の場合は有効期限内のもの）</p>
                          <p>・パスポート（日本国政府発行で有効期限内のもの）</p>
                          <p>・在留カード（有効期限内のもの）</p>
                          <p>・住民票（3か月以内に発行された、マイナンバーの記載が無いもの、あるいはマイナンバーの記載がある場合は塗りつぶしたもの）</p>
                          <p>・住民基本台帳カード（有効期限内のもの）</p>
                          <p>【日本国籍以外の方】（表面と裏面の両方）</p>
                          <p>・特別永住者証明書（有効期限内のもの）</p>
                          <p>・在留カード(有効期限内・就労可能明記のあるもの）</p>
                          <div style={{height: 20}} />
                          <p>▼本人確認書類と<Link to='/account'>基本情報</Link>の姓名表記が同一であることをご確認ください。</p>
                          <p>▼複数枚アップロードは可能ですが、本人確認書類の種類は１つのみです。</p>
                        </div>
                      </div>
                      {idImages.map(image => (
                        <div style={{display: 'flex', maxWidth: 280}} key={image.idx}>
                          {image.isPDF ?
                            <div style={{...styles.uploadImage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 36}}><IdFileIcon style={{width: 80, height: 80}} />PDF</div>
                          :
                            <div style={{...styles.uploadImage, background: `url(${image.imageUrl || image.localUrl}) center/contain no-repeat`}} />
                          }
                          <IconButton onClick={() => this.deleteIdImage(image)}><CloseIcon /></IconButton>
                        </div>
                      ))}
                      <FileUploader
                        endPoint={({type}) => `/api/users/@me/getSignedUrl?type=id&${qs.stringify(type)}`}
                        acceptance={[fileMime.types.image.all, fileMime.types.application.pdf]}
                        handleFile={this.handleFile}
                        onError={this.handleFileError}
                        onCreateObjectURL={this.onCreateObjectURL}
                      >
                        <div>
                          {!idImageUploading && <div style={styles.upload}>
                            <div style={{display: 'flex'}}>
                              <img alt='匿名アイコン' src='/images/anonymous.png' style={{width: 80, height: 90, background: grey[300]}} />
                              <div style={{margin: '0 20px', flex: 1}}>
                                <div style={{background: grey[300], height: 15, width: 120}} />
                                <div style={{background: grey[300], height: 10, width: 110, marginTop: 10}} />
                              </div>
                            </div>
                            <div style={{background: grey[300], height: 10, width: 190, marginTop: 20}} />
                            <div style={{background: grey[300], height: 10, width: 220, marginTop: 10}} />
                            <Avatar alt='写真追加' style={styles.add} color={common.white}><ImageAddAPhoto /></Avatar>
                          </div>}
                        </div>
                      </FileUploader>
                      {this.state.fileError && <Notice type='error' style={{marginTop: 15, marginBottom: 15}}>{this.state.fileError}</Notice>}
                      {this.state.idImages.length > 0 && this.state.idImages.every(img => img.localUrl) &&
                        <Button variant='contained' color='primary' style={{marginTop: 15}} disabled={ this.state.idImageError || this.state.idImageUploading } onClick={this.handleUpload} >送信する</Button>
                      }
                      <div style={{marginTop: 10, fontSize: 14}}>
                        <p>※ 本人確認の流れ</p>
                        <p>お預かりした本人確認書類の画像は、5営業日以内に事務局で確認作業をいたします。</p>
                        <p>確認が済みました画像は直ちに削除され、他の目的に利用することはありません。</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
              <div ref={e => this.anchors.licence = e} style={{display: 'flex', alignItems: 'center'}}>
                <h4 style={styles.title}>資格・免許</h4>
                <div style={{flex: 1}} />
                <Button color='primary' onClick={() => this.openEditDialog('licence')}>編集する</Button>
              </div>
              <div style={styles.paper}>
                <ul style={{padding: 10}}>
                  {profile.licences.length ? profile.licences.map(l =>
                    <li key={l._id} style={{fontSize: 14}}>
                      <LicenceLink licence={l} />
                      {l.status === 'valid' ?
                        <span><span style={{color: secondary.main, marginLeft: 10}}>✔︎</span> 確認済み</span>
                      : l.status === 'pending' ?
                        <span style={{marginLeft: 10}}>確認中</span>
                      : l.status === 'invalid' ?
                        <span><span style={{color: red[500], marginLeft: 10}}>✘</span> 確認できませんでした</span>
                      : null}
                    </li>
                  ) : '資格・免許は登録されていません'}
                </ul>
              </div>
              <Notice type='warn'>
                対応サービスの追加は
                <Link style={{textDecoration: 'underline'}} to='/account/services/add'>こちら</Link>
                から可能です。
              </Notice>
            </div>
          :
            <div>
              <Notice type='warn'>
                プロフィールが未完成です。完成させないと依頼に応募できません。
              </Notice>
              <ProfileProgress
                style={{marginTop: 10, border: `1px solid ${grey[300]}`}}
                profile={profile}
                completeLabel='プロフィールを確認する'
                onComplete={() => this.load(profile.id)}
              />
            </div>
          }
        </div>
        <Dialog open={isOpenProfileDialog} onClose={this.closeProfileDialog}>
          <IconButton style={{position: 'absolute', top: 10, right: 10}} onClick={this.closeProfileDialog}>
            <CloseIcon />
          </IconButton>
          <ProfilePreview profile={profile} mediaLists={mediaLists} />
        </Dialog>
        <Dialog
          open={!!edit}
          onClose={this.closeEditDialog}
        >
          <DialogTitle style={{borderBottom: `1px solid ${grey[300]}`}}>
          {`${dialogTitle[edit] || ''}の編集`}
          </DialogTitle>
          <DialogContent style={{padding: 0}}>
            {edit === 'main' ?
              <MainEdit profile={profile} onSubmit={this.closeEditDialog} />
            : edit === 'media' ?
              <MediaEdit profile={profile} />
            : edit === 'about' ?
              <AboutEdit profile={profile} onSubmit={this.closeEditDialog} />
            : edit === 'licence' ?
              <LicenceEdit profile={profile} onSubmit={this.closeEditDialog} />
            : edit === 'businessHour' ?
              <BusinessHourEdit onSubmit={this.closeEditDialog} />
            : edit === 'proAnswer' ?
              <ProAnswerEdit profile={profile} proQuestions={questions} currentQuestionPage={currentQuestionPage} onSubmit={this.closeEditDialog} />
            : null}
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={!!deactivateConfirm}
          title={'このプロフィールを削除しますか？'}
          label='削除する'
          onSubmit={this.deactivateProfile}
          onClose={() => this.setState({deactivateConfirm: false})}
        >
          削除すると、このプロフィールで応募した案件にアクセスできなくなります。
        </ConfirmDialog>
        <MediaSlider media={previewMedia} slideNumber={slideNumber} onClose={() => this.setState({slideNumber: null})} />
        <ProOnBoarding />
        <ConfirmDialog open={!!this.state.resumeDialog} title='一時休止を解除しますか？' label='解除する' onSubmit={this.handleResume} onClose={() => this.setState({resumeDialog: false})}>
          <FormGroup>
            {profiles.filter(p => p.suspend === '一時休止').map(p =>
              <FormControlLabel
                key={p.id}
                control={
                  <Checkbox
                    color='primary'
                    checked={!!this.state.resume.includes(p.id)}
                    onChange={this.selectProfile}
                    value={p.id}
                  />
                }
                label={p.name}
              />
            )}
          </FormGroup>
        </ConfirmDialog>
      </AutohideHeaderContainer>
    )
  }
}
