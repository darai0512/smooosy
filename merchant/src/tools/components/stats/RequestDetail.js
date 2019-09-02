import React from 'react'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Checkbox, Table, TableBody, Select, MenuItem, Button, TextField } from '@material-ui/core'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import { Input, InputLabel } from '@material-ui/core'
import { FormGroup, FormControlLabel, FormControl } from '@material-ui/core'
import { withStyles, withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import Warning from '@material-ui/icons/Warning'
import { yellow, indigo } from '@material-ui/core/colors'
import { addAttributionTags } from 'lib/util'

import { withApiClient } from 'contexts/apiClient'
import { pushMessage } from 'tools/modules/auth'
import { load, update, resend, matchPro, excludePro } from 'tools/modules/request'
import { load as loadMeet } from 'tools/modules/meet'
import { load as loadBlackList, create as createBlackList } from 'tools/modules/blacklist'
import { loadAllByRequest as loadEmails } from 'tools/modules/maillog'
import { open as openSnack } from 'tools/modules/snack'
import Loading from 'components/Loading'
import RequestInfo from 'components/RequestInfo'
import CustomRow from 'components/CustomRow'
import UserModal from 'tools/components/UserModal'
import EditUser from 'tools/components/stats/EditUser'
import MemoList from 'tools/components/MemoList'
import ConfirmDialog from 'components/ConfirmDialog'
import MailLogs from 'tools/components/stats/MailLogs'
import RequestInfoForEdit from 'tools/components/stats/RequestInfoForEdit'
import RequestEditLog from 'tools/components/stats/RequestEditLog'
import MeetDetail from 'tools/components/stats/MeetDetail'
import BlacklistForm from 'tools/components/stats/BlacklistForm'
import { timeNumbers, interviewDescription } from '@smooosy/config'
import CustomChip from 'components/CustomChip'
import ExactMatchChip from 'components/pros/ExactMatchChip'
import renderTextArea from 'components/form/renderTextArea'
import PointDisplay from 'components/PointDisplay'

@withApiClient
@withWidth()
@reduxForm({
  form: 'request',
})
@connect(
  state => ({
    admin: state.auth.admin,
    request: state.request.request,
    meet: state.meet.meet,
    blacklists: state.blacklist.blacklists,
  }),
  { load, update, loadMeet, resend, matchPro, excludePro, loadBlackList, createBlackList, loadEmails, openSnack }
)
@withTheme
export default class RequestDetail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      edit: false,
      dialog: false,
      suspendModal: false,
      interview: [],
    }
  }

  componentDidMount() {
    this.load(this.props.match.params.id)
  }

  load = (id) => {
    this.props.load(id).then(({request}) => {
      addAttributionTags(request)
      const additionalStatus = request.additionalStatus === 'hired' ?
        (request.meets.filter(m => m.additionalStatus)[0] || {}).id : request.additionalStatus
      const supportStatus = request.supportStatus || 'none'
      const interview = request.interview || []
      this.props.initialize({
        id: request.id,
        additionalStatus,
        supportStatus,
      })
      this.setState({interview: interview.slice()})

      const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
      if (query.meet) {
        const meet = [...request.meets, ...request.pendingMeets].find(meet => meet.id === query.meet)
        if (meet) {
          this.showMeet(meet)
        }
      }
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      this.load(this.props.match.params.id)
    }

    const { request } = this.props
    if (!request || !request.loc) return

    const [lng, lat] = this.props.request.loc.coordinates
    if (!lat || !lng || !this.marker) return

    this.marker.setOptions({
      position: {lat, lng},
    })
  }

  onUpdateUser = () => {
    this.setState({editUser: false})
    this.load(this.props.request.id)
  }

  showMeet = (meet) => {
    this.props.loadMeet(meet.id).then(() => this.setState({dialog: true}))
  }

  updateAdditionalStatus = ({additionalStatus, supportStatus}) => {
    const { request } = this.props
    const data = {
      additionalStatus,
      supportStatus,
      meet: 'none',
      editLog: [],
    }
    if (data.additionalStatus !== request.additionalStatus) {
      const log = {
        editType: 'additionalStatus',
        before: request.additionalStatus || 'none',
        after: data.additionalStatus,
      }
      if (data.additionalStatus && ['none', 'maybe'].indexOf(data.additionalStatus) === -1) {
        data.meet = data.additionalStatus
        data.additionalStatus = 'hired'
        log.after = 'hired'
        log.description = data.additionalStatus
      }
      data.editLog.push(log)
    }
    if (data.supportStatus !== request.supportStatus) {
      const log = {
        editType: 'supportStatus',
        before: request.supportStatus === 'supported' ? 'サポート済み' : 'なし',
        after: data.supportStatus === 'supported' ? 'サポート済み' : 'なし',
      }
      data.editLog.push(log)
    }

    this.props.update(data)
      .then(() => this.props.openSnack('更新しました'))
  }

  updateInterview = () => {
    const { interview } = this.state
    const { request } = this.props
    const data = {
      id: request.id,
      interview: interview,
      editLog: [{
        editType: 'interview',
        before: request.interview.join(',') || 'none',
        after: interview.join(',') || 'none',
      }],
    }
    this.props.update(data)
    this.setState({editInterview: false})
  }

  changeInterview = key => {
    let { interview } = this.state
    if (interview.includes(key)) {
      interview = interview.filter(f => f !== key)
    } else {
      interview.push(key)
    }
    this.setState({interview})
  }

  suspend = () => {
    this.props.update({
      id: this.props.request.id,
      updatedAt: this.props.request.updatedAt,
      status: 'suspend',
      suspendReason: '運営判断による削除',
      showReason: true,
      deleted: true,
      editLog: [{
        editType: 'status',
        before: this.props.request.status,
        after: 'suspend',
        description: '運営判断による削除',
      }],
    })
    .then(() => this.setState({suspendModal: false}))
    .catch(err => {
      const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
      this.props.openSnack(msg)
    })
  }

  cancel = () => {
    const { request } = this.props
    this.props.update({
      id: request.id,
      status: 'suspend',
      updatedAt: request.updatedAt,
      editLog: [{
        editType: 'status',
        before: request.status,
        after: 'suspend（キャンセル）',
        description: 'キャンセル',
      }],
    })
    .then(() => this.setState({cancelModal: false}))
    .catch(err => {
      const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
      this.props.openSnack(msg)
    })
  }

  edit = () => {
    this.setState({edit: !this.state.edit})
  }

  copy = () => {
    const id = this.props.request.id
    this.props.apiClient.post(`/api/admin/formattedRequests/${id}/copy`).then((res) => {
      this.props.history.push(`/formattedRequests/${res.data.id}`)
    })
  }

  handleCancelPass = () => {
    const { cancelPass } = this.state
    const { request: { passed } } = this.props
    const newPassed = passed.filter(p => p.profile !== cancelPass)
    const data = {
      id: this.props.request.id,
      passed: newPassed,
      editLog: [{
        editType: 'cancelPass',
        before: `${cancelPass}様のキャンセル`,
        after: 'パスをキャンセル',
      }],
    }
    this.props.update(data)
    this.setState({cancelPass: null})
  }

  resend = () => {
    this.props.resend(this.props.request.id)
    this.setState({resendCondirm: false})
  }

  openBlackList = () => {
    this.props.loadBlackList()
      .then(() => {
        this.setState({checkInput: true})
      })
  }

  createBlackList = (data) => {
    this.props.createBlackList(data)
  }

  revertRequest = () => {
    this.props.update({
      id: this.props.request.id,
      status: 'open',
      deleted: false,
      suspendReason: '',
      showReason: true,
      editLog: [{
        editType: 'status',
        before: this.props.request.status,
        after: 'open',
        description: '依頼中に戻す',
      }],
    }).then(() => this.props.openSnack('更新しました'))

    this.setState({revertConfirm: false})
  }

  setMatchProfile = () => {
    const { forceMatchProfileId } = this.state
    this.setProfile(forceMatchProfileId, 'match')
  }

  setExcludeProfile = () => {
    const { forceExcludeProfileId } = this.state
    this.setProfile(forceExcludeProfileId, 'exclude')
  }

  setProfile = (profileId, type) => {
    const { request } = this.props
    if (!profileId || profileId.length !== 24) {
      this.props.openSnack('不適切なIDです')
      return
    }
    if (request.meets.map(m => m.profile.id).includes(profileId)) {
      this.props.openSnack('見積もり済みのプロです')
      return
    }
    if (request.pendingMeets.map(m => m.profile.id).includes(profileId)) {
      this.props.openSnack('指名済みのプロです')
      return
    }
    this.props.apiClient.get(`/api/admin/profiles/${profileId}`)
      .then(res => res.data)
      .then(profile => {
        if (request.customer.id === profile.pro.id) {
          this.props.openSnack('依頼者と同じアカウントです')
          return
        }
        if (type === 'match') {
          this.setState({matchProfile: profile})
        } else if (type === 'exclude') {
          this.setState({excludeProfile: profile})
        }
      })
      .catch(() => this.props.openSnack('見つかりませんでした'))
  }

  matchProfile = () => {
    const { request } = this.props
    this.props.matchPro({
      request: request.id,
      profile: this.state.matchProfile.id,
    })
      .then(() => this.props.openSnack('更新しました'))
      .catch((err) => this.props.openSnack(err.message))
    this.setState({
      forceMatchProfileId: false,
      matchProfile: false,
    })
  }

  excludeProfile = () => {
    const { request } = this.props
    this.props.excludePro({
      request: request.id,
      profile: this.state.excludeProfile.id,
    })
      .then(() => this.props.openSnack('更新しました'))
      .catch((err) => this.props.openSnack(err.message))
    this.setState({
      forceExcludeProfileId: false,
      excludeProfile: false,
    })
  }

  render() {
    const { request, meet, blacklists, admin, width, theme, handleSubmit } = this.props
    const { matchProfile, excludeProfile, revertConfirm, openMailLog } = this.state
    const { common, grey, primary, secondary, blue, red } = theme.palette

    if (!request) return <Loading />

    const styles = {
      root: {
        position: 'relative',
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      back: {
        background: common.white,
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 2,
      },
      title: {
        padding: 10,
        background: grey[100],
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      columns: {
        columnCount: {xs: 1}[width] || 2,
        columnGap: 10,
      },
      column: {
        columnBreakInside: 'avoid',
        pageBreakInside: 'avoid',
        display: 'flex',
        padding: '5px 0',
        alignItems: 'center',
      },
    }

    const createdAt = new Date(request.createdAt)

    let showInterview = false
    // フォローが必要(電話番号ありのみ)
    if (request.phone) {
      for (const m of request.meets) {
        // 初回の未読・既読になって3日以上たつ依頼
        if (m.chats.length > 0 && m.chats.filter(c => c.user === request.customer.id).length === 0 && moment().diff(m.chats[m.chats.length - 1].createdAt, 'days') >= 3) {
          m.needSupport = true
          showInterview = true
        }
      }
    }

    // 日時締め切りのある場合は、未成約で3日前を切っている依頼
    const today = moment()
    let statusOpen = <span>決定前</span>
    if (request.phone && request.limitDate) {
      const diff = moment(request.limitDate).diff(today, 'days')
      if (diff < 0) {
        statusOpen = <span>決定前(期限切れ)</span>
        showInterview = true
      } else if (diff <= 3) {
        const text = diff === 0 ? '決定前(期限当日)' : `決定前(期限${diff}日前)`
        statusOpen = <span style={{display: 'flex', alignItems: 'flex-end'}}><Warning style={{ color: yellow[800] }}/>{text}</span>
        showInterview = true
      }
    }

    const chipInfo = m => {
      const info = m.proResponseStatus ? {
        inReview: {text: 'リリース前', background: yellow[500]},
        autoAccept: {text: 'ラクラクお得', background: indigo[200]},
        tbd: {text: 'プロの返信待ち', background: grey[300]},
        accept: {text: 'プロが受諾', background: blue[200]},
        decline: {text: 'プロが辞退', background: grey[500]},
      }[m.proResponseStatus] : {
        text: m.displayPhone ? '電話表示' : m.read ? '既読' : '未読',
        color: grey[300],
      }

      if (['progress', 'done'].includes(m.status)) {
        info.background = primary.main
      } else if (m.status === 'exclude') {
        info.background = secondary.main
      }
      return { ...m, ...info }
    }

    const middleComponent = (
      <div style={{marginBottom: -1}}>
        {admin > 2 && request.status !== 'close' &&
          <form style={{display: 'flex', alignItems: 'center', margin: 10}} onSubmit={handleSubmit(this.updateAdditionalStatus)}>
            <div style={{flex: 1}} />
            {showInterview &&
              <Field
                name='supportStatus'
                component={({input: { value, onChange }, meta, ...custom }) =>
                  <FormControl style={{minWidth: 180, marginTop: -15, marginRight: 10}}>
                    <InputLabel htmlFor='support'>聞き取りステータス</InputLabel>
                    <Select
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      input={<Input id='support' />}
                      {...custom}
                    >
                      <MenuItem value='none'>なし</MenuItem>
                      <MenuItem value='supported'>サポート済み</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
            }
            <Field name='additionalStatus' component={({input: { value, onChange }, meta, ...custom }) =>
              <FormControl style={{minWidth: 150, marginTop: -15}}>
                <InputLabel htmlFor='service'>管理ステータス</InputLabel>
                <Select
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  input={<Input id='service' />}
                  {...custom}
                >
                  <MenuItem value='none'>なし</MenuItem>
                  <MenuItem value='maybe'>成約？</MenuItem>
                  {request.meets.map(m =>
                    <MenuItem key={m.id} value={m.id}>{m.profile.name}</MenuItem>
                  )}
                </Select>
              </FormControl>
            } />
            <Button variant='contained' type='submit' color='secondary'>更新</Button>
          </form>
        }
        <div style={{padding: 10}}>
          <span>依頼メモ</span>
          <MemoList form={`memo_${request.id}`} request={request.id} />
          <span>ユーザーメモ</span>
          <MemoList form={`memo_${request.customer.id}`} user={request.customer.id} />
        </div>
        <RequestEditLog editLog={request.editLog} interviewDescription={interviewDescription} />
        <h4 style={styles.title}>概要</h4>
        <Table>
          <TableBody>
            <CustomRow title='依頼者'>
              <Table>
                <TableBody>
                  <CustomRow title='名前'>
                    <a onClick={() => this.setState({userModal: true})}>{request.customer.lastname} {request.customer.firstname}{request.customer.corporation ? '【法人】' : ''}</a>
                    <UserModal open={!!this.state.userModal} onClose={() => this.setState({userModal: false})} user={request.customer} admin={admin} />
                    <Button size='small' variant='contained' color='secondary' style={{marginLeft: 10}} onClick={() => this.setState({editUser: true})}>編集する</Button>
                    {request.customer.requestDeactivate &&
                      <span style={{color: red[500], fontSize: 14, marginLeft: 10}}>{moment(request.customer.requestDeactivate).format('YYYY/MM/DD HH:mm')} 退会申請</span>
                    }
                    <EditUser showNotification open={!!this.state.editUser} onUpdate={this.onUpdateUser} initialValues={request.customer} onClose={() => this.setState({editUser: false})} />
                  </CustomRow>
                  {admin > 1 &&
                    <CustomRow title='ユーザーID'>
                      <p>{request.customer.id}</p>
                      <p>{request.customer.token}</p>
                    </CustomRow>
                  }
                  {admin > 1 &&
                    <CustomRow title='メール'>
                      <p>{request.customer.email} {request.customer.bounce && <span style={{color: red[500]}}>バウンス</span>}</p>
                    </CustomRow>
                  }
                  <CustomRow title='最終アクセス'>
                  <p> {new Date(request.customer.lastAccessedAt).toLocaleString()}</p>
                  </CustomRow>
                  <CustomRow title='プロ'>
                    <p>{request.customer.pro ? 'YES' : 'NO'}</p>
                  </CustomRow>
                  <CustomRow title='連携'>
                    <span style={{display: 'flex', alignItems: 'center'}}>
                      <p>LINE: {request.customer.lineId ? 'YES': 'NO'}</p>
                      {request.customer.lineId && <LineMessageButton
                        style={{marginLeft: 10 }}
                        user={request.customer}
                        onSend={() => this.props.openSnack('送信しました')}
                        onError={(err) => this.props.openSnack(`Error: ${err && err.message || '予期せぬエラーが発生しました'}`)}
                      />}
                    </span>
                    <p>Google: {request.customer.googleId ? 'YES': 'NO'}</p>
                    <p>Facebook: {request.customer.facebookId ? 'YES': 'NO'}</p>
                  </CustomRow>
                </TableBody>
              </Table>
            </CustomRow>
            <CustomRow title='作成日時'>{createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}</CustomRow>
            <CustomRow title='状態'>
              <p>{request.deleted ? '削除' : request.status === 'suspend' ? 'キャンセル' : request.status === 'open' ? statusOpen : '決定' }</p>
              {request.suspendReason && <p>理由: {request.suspendReason}</p>}
              {(request.deleted || request.status === 'suspend') &&
                <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({revertConfirm: true})}>
                  依頼中に戻す
                </Button>
              }
            </CustomRow>
            <CustomRow title='見積もり期待度'>
              {request.pt || 0} / 100
            </CustomRow>
            <CustomRow title='スペシャル'>
              {request.specialSent.length > 0 ?
                request.specialSent.map(sp => <div key={sp.id}><Link to={`/stats/pros/${sp.id}`}>{sp.name}</Link></div>)
                : 'なし'
              }
            </CustomRow>
            <CustomRow title='送信予定'>
              <div style={styles.columns}>
                {request.willSend ? request.willSend.map(p =>
                  <div key={p._id} style={styles.column}>
                    <Link to={`/stats/pros/${p._id}`}>{p.name}</Link>
                    {p.isBeginner ?
                      <img src='/tools/images/wakaba.png' width='10' height='15' style={{marginLeft: 10}} />
                    : p.meetRateLast3Months ?
                      <p style={{marginLeft: 10}}>見積もり率 {Math.round(p.meetRateLast3Months * 10000) / 100}%</p>
                    : null}
                    {p.matchingBucket && <MatchingBucketChip props={{
                      matchingBucket: p.matchingBucket,
                    }} />}
                    {p.isExactMatch && <ExactMatchChip style={{marginLeft: 10}} />}
                  </div>
                ) : <div>なし</div>}
              </div>
            </CustomRow>
            <CustomRow title='送信済の見込み顧客'>
              <div>
                <Button style={{marginBottom: 10}} size='small' variant='outlined' onClick={() => this.setState({openMailLog: !openMailLog})} disabled={!request.sentLead}>{openMailLog ? '閉じる' : '送信履歴'}</Button>
                {openMailLog ? <MailLogs userInfo loader={this.props.loadEmails} loadProps={{requestId: request.id}} title='address' /> : null}
              </div>
              <Button
                size='small'
                variant='contained'
                color='secondary'
                component={Link}
                to={`/leads/send/${request.id}`}
                disabled={!request.address || request.status !== 'open' || moment().subtract(48, 'hours').isAfter(request.createdAt)}
              >
                見込み顧客に送る
              </Button>
            </CustomRow>
            <CustomRow title='送信対象除外'>
              <div style={styles.columns}>
                {request.excluded.length > 0 ? request.excluded.map((ex, i) =>
                  <div key={`sent_${i}_${ex.id}`} style={styles.column}>
                    <Link to={`/stats/pros/${ex.id}`}>{ex.name}</Link>
                  </div>
                ) : <div>なし</div>}
              </div>
              {admin > 1 && [
                <div key='match' style={{display: 'flex', alignItems: 'flex-end', marginBottom: 10}}>
                  <TextField label='プロフィールID' onChange={e => this.setState({forceExcludeProfileId: e.target.value})} inputProps={{style: {width: 180, fontSize: 12}}} />
                  <Button
                    size='small'
                    variant='contained'
                    color='secondary'
                    style={{minWidth: 82}}
                    disabled={request.status !== 'open' || request.meets.length >= 5 || moment().subtract(timeNumbers.requestExpireHour, 'hours').isAfter(request.createdAt)}
                    onClick={() => this.setExcludeProfile()}
                  >
                    強制除外
                  </Button>
                </div>,
              ]}
            </CustomRow>
            <CustomRow title='未返信'>
              <div style={styles.columns}>
                {request.sent.length > 0 ? request.sent.map((sent, i) =>
                  <div key={`sent_${i}_${sent.id}`} style={styles.column}>
                    <Link to={`/stats/pros/${sent.id}`}>{sent.name}</Link>
                    {sent.isBeginner &&
                      <img src='/tools/images/wakaba.png' width='10' height='15' style={{marginLeft: 10}}/>
                    }
                    {sent.matchingBucket && <MatchingBucketChip props={{
                      matchingBucket: sent.matchingBucket,
                    }} />}
                    {sent.isExactMatch && <ExactMatchChip style={{marginLeft: 10}} />}
                    {request.passed.filter(p => p.profile === sent.id).map(p =>
                      <div key={p._id} style={{marginLeft: 10}}>
                        <span>パス（{p.reason}）</span>
                        {admin > 1 &&
                          <Button size='small' color='secondary' onClick={() => this.setState({cancelPass: p.profile})}>パス解除</Button>
                        }
                      </div>
                    )}
                  </div>
                ) : <div>なし</div>}
              </div>
              {admin > 1 && [
                <div key='match' style={{display: 'flex', alignItems: 'flex-end', marginBottom: 10}}>
                  <TextField label='プロフィールID' onChange={e => this.setState({forceMatchProfileId: e.target.value})} inputProps={{style: {width: 180, fontSize: 12}}} />
                  <Button
                    size='small'
                    variant='contained'
                    color='secondary'
                    style={{minWidth: 82}}
                    disabled={request.status !== 'open' || request.meets.length >= 5 || moment().subtract(timeNumbers.requestExpireHour, 'hours').isAfter(request.createdAt)}
                    onClick={() => this.setMatchProfile()}
                  >
                    強制マッチ
                  </Button>
                </div>,
                <Button
                  key='resend'
                  size='small'
                  variant='contained'
                  color='secondary'
                  disabled={request.status !== 'open' || request.meets.length >= 5 || moment().subtract(timeNumbers.requestExpireHour, 'hours').isAfter(request.createdAt) || request.sent.length == 0}
                  onClick={() => this.setState({resendCondirm: true})}
                >
                  情報変更を再送する
                </Button>,
              ]}
            </CustomRow>
            <CustomRow title='見積もり'>
              {request.meets.map(chipInfo).map((m, i) =>
                <div key={`meet_${m.id}`} style={{display: 'flex', alignItems: 'center', padding: '5px 0', borderTop: i === 5 ? `1px solid ${grey[300]}`: ''}}>
                  <CustomChip
                    style={{background: m.background}}
                    onClick={() => this.showMeet(m)}
                    label={`${m.text}(${m.chats.length})`}
                  />
                  {m.needSupport && <span style={{display: 'flex', alignItems: 'center', marginLeft: 10}}><Warning style={{ color: yellow[800] }}/>3日以上放置</span>}
                  {m.profile ? <Link to={`/stats/pros/${m.profile.id}`} style={{marginLeft: 10}}>{m.profile.name}</Link>
                    : <div style={{marginLeft: 10}}>削除済みプロフィール</div>}
                  {m.matchingBucket && <MatchingBucketChip props={{
                    matchingBucket: m.matchingBucket,
                  }} />}
                  {m.isExactMatch && <ExactMatchChip style={{marginLeft: 10}} />}
                </div>
              )}
              {request.meets.length === 0 && 'なし'}
            </CustomRow>
            <CustomRow title='仮見積もり'>
              {request.pendingMeets.map(chipInfo).map((m, i) =>
                <div key={`meet_${m.id}`} style={{display: 'flex', alignItems: 'center', padding: '5px 0', borderTop: i === 5 ? `1px solid ${grey[300]}`: ''}}>
                  <CustomChip
                    style={{background: m.background}}
                    onClick={() => this.showMeet(m)}
                    label={`${m.text}(${m.chats.length})`}
                  />
                  {m.matchingBucket && <MatchingBucketChip props={{
                    matchingBucket: m.matchingBucket,
                  }} />}
                  {m.isExactMatch && <ExactMatchChip style={{marginLeft: 10}} />}
                  {m.needSupport && <span style={{display: 'flex', alignItems: 'center', marginLeft: 10}}><Warning style={{ color: yellow[800] }}/>3日以上放置</span>}
                  {m.profile ? <Link to={`/stats/pros/${m.profile.id}`} style={{marginLeft: 10}}>{m.profile.name}</Link>
                    : <div style={{marginLeft: 10}}>削除済みプロフィール</div>}
                  {m.matchingBucket && <MatchingBucketChip props={{
                    matchingBucket: m.matchingBucket,
                  }} />}
                  {m.isExactMatch && <ExactMatchChip style={{marginLeft: 10}} />}
                </div>
              )}
              {request.pendingMeets.length === 0 && 'なし'}
            </CustomRow>
            {request.time &&
              <CustomRow title='モーダル時間'>
                {Math.floor(request.time / 60)}分{request.time % 60}秒
              </CustomRow>
            }
            {request.referrer &&
              <CustomRow title={'リファラー'}>
              <div style={{maxHeight: 100, overflowY: 'auto'}}>
                <div>{request.referrer}</div>
              </div>
            </CustomRow>}
            {request.stack && request.stack.length > 0 &&
              <CustomRow title={`モーダルまで(${request.stack.length})`}>
                <div style={{maxHeight: 100, overflowY: 'auto'}}>
                  {request.stack.map((s, i) => <p key={i}>{s}</p>)}
                </div>
              </CustomRow>
            }
            {(request.tags && request.tags.length) ?
              <CustomRow title={'タグ'}>
                {request.tags.map(t =>
                  <CustomChip
                    key={t}
                    style={{background: '#FFB500'}}
                    label={t} />
                )}
              </CustomRow> : ''}
            <CustomRow title='IPアドレス'>
              <div>{request.ip}</div>
              {request.locationData &&
                <div>
                  {[
                    request.locationData.postal_code,
                    request.locationData.country_name,
                    request.locationData.region_name,
                    request.locationData.city_name,
                  ].join(' ')}
                </div>
              }
            </CustomRow>
            {admin > 2 &&
              <CustomRow title='要CSチェック'>
                <div>
                  {request.interview.map(int => <div key={int}>{interviewDescription[int]}</div>)}
                  <Button variant='contained' size='small' color='secondary' onClick={() => this.setState({editInterview: true})}>フラグ編集</Button>
                  <Button style={{marginLeft: 10}} variant='contained' size='small' color='secondary' onClick={() => this.openBlackList()}>入力欄チェックルール編集</Button>
                </div>
              </CustomRow>
            }
            {request.distance &&
              <CustomRow title='マッチ距離'>
                <p style={{color: secondary.main}}>{request.distance / 1000}km</p>
              </CustomRow>
            }
          </TableBody>
        </Table>
      </div>
    )

    const blacklistTypes = [
      { target: 'email', title: 'Emailアドレス' },
      { target: 'name', title: '姓名' },
      { target: 'input', title: '入力欄' },
      { target: 'ip', title: 'IPアドレス' },
      { target: 'phone', title: '電話番号' },
    ]

    return (
      <div style={styles.root}>
        <Button variant='outlined' component={Link} to='/stats/requests' style={styles.back}>
          <LeftIcon />
          戻る
        </Button>
        <RequestInfo
          showAll
          admin={admin}
          edit={this.edit}
          request={request}
          customer={request.customer}
          profile={{}}
          middleSpace={middleComponent}
          noCountDown={request.status !== 'open' || request.meets.length > 4}
          pointComponent={<PointDisplay point={request.point} />}
        />
        {admin > 2 &&
          <div style={{padding: 10, display: 'flex'}}>
            {!request.copy && request.meets.length > 0 &&
              <Button variant='contained' color='secondary' onClick={() => this.copy()}>コピー</Button>
            }
            <div style={{flex: 1}} />
            {request.status === 'open' &&
              <>
                <Button variant='contained' color='secondary' style={{marginRight: 10}} onClick={() => this.setState({suspendModal: true})}>運営削除</Button>
                <Button variant='contained' color='secondary' onClick={() => this.setState({cancelModal: true})}>代理キャンセル</Button>
              </>
            }
          </div>
        }
        <ConfirmDialog
          open={!!this.state.suspendModal}
          title='サスペンドしますか？'
          onClose={() => this.setState({suspendModal: false})}
          onSubmit={this.suspend}
        >
          <p>{request.service.name}の依頼 by {request.customer.lastname}様</p>
          <p>理由: 運営判断による削除</p>
        </ConfirmDialog>
        <ConfirmDialog
          title='依頼者の代理でキャンセルしますか？'
          open={Boolean(this.state.cancelModal)}
          onClose={() => this.setState({cancelModal: false})}
          onSubmit={this.cancel}
         >
          <p>{request.service.name}の依頼 by {request.customer.lastname}様</p>
         </ConfirmDialog>
        {meet ?
          <Dialog
            open={!!this.state.dialog}
            onClose={() => this.setState({dialog: false})}
          >
            <DialogTitle>見積もり情報</DialogTitle>
            <DialogContent style={{padding: 0}}>
              <MeetDetail form={meet.id} initialValues={meet} loadRequest={this.load} />
            </DialogContent>
          </Dialog>
        : null}
        {request ?
          <Dialog
            open={!!this.state.edit}
            onClose={() => this.setState({edit: false})}
          >
            <RequestInfoForEdit request={request} edit={this.edit} />
          </Dialog>
         : null}
        <Dialog
          open={!!this.state.cancelPass}
          onClose={() => this.setState({cancelPass: null})}
        >
          <DialogTitle>パスをキャンセルしますか？</DialogTitle>
          <DialogActions>
            <Button onClick={() => this.setState({cancelPass: null})}>
              キャンセル
            </Button>
            <Button onClick={() => this.handleCancelPass()} color='primary' autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <ConfirmDialog
          open={!!this.state.resendCondirm}
          title='パスを解除し再送しますか？'
          onClose={() => this.setState({resendCondirm: false})}
          onSubmit={() => this.resend()}
        >
          <p>{request.meets.length + request.sent.length}人にメールを送信します。</p>
          <p>パスしたプロはパスが解除されます。</p>
        </ConfirmDialog>
        <Dialog
          open={!!this.state.editInterview}
          onClose={() => this.setState({editInterview: false})}
        >
          <DialogTitle>フラグを編集</DialogTitle>
          <DialogContent>
            <FormGroup row>
            {Object.keys(interviewDescription).map(key =>
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    color='primary'
                    checked={this.state.interview.includes(key)}
                    onChange={() => this.changeInterview(key)}
                  />
                }
                label={interviewDescription[key]}
              />
            )}
            </FormGroup>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({editInterview: false})}>キャンセル</Button>
            <Button variant='contained' color='primary' onClick={() => this.updateInterview()} style={{width: 100}}>更新</Button>
          </DialogActions>
        </Dialog>
        <ConfirmDialog
          open={!!revertConfirm}
          title='本当に依頼中に戻しますか？'
          onClose={() => this.setState({revertConfirm: false})}
          onSubmit={() => this.revertRequest()}
        />
        <ConfirmDialog
          open={!!matchProfile}
          title='このプロをマッチさせますか？'
          onClose={() => this.setState({matchProfile: false})}
          onSubmit={() => this.matchProfile()}
        >
          <ProInfo profile={matchProfile} admin={admin} />
        </ConfirmDialog>
        <ConfirmDialog
          open={!!excludeProfile}
          title='このプロを送信対象から除外しますか？'
          onClose={() => this.setState({excludeProfile: false})}
          onSubmit={() => this.excludeProfile()}
        >
          <ProInfo profile={excludeProfile} admin={admin} />
        </ConfirmDialog>
        <Dialog open={!!this.state.checkInput} onClose={() => this.setState({checkInput: false})}>
          <DialogTitle>入力欄チェックルール（ブラックリスト）</DialogTitle>
          <DialogContent>
            {blacklistTypes.map(t => [
              <h3 key='title'>{t.title}</h3>,
              ...blacklists.filter(b => b.target === t.target).map(b =>
                <BlacklistForm key={b.id} form={`blacklist${b.id}`} initialValues={b} />
              ),
              <div key='add' style={{display: 'flex', justifyContent: 'flex-end', width: '100%', paddingRight: 25, marginBottom: 10, marginTop: 10}}>
                <Button size='small' variant='contained' onClick={() => this.createBlackList({ target: t.target})}>項目追加</Button>
              </div>,
            ])}
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}

const ProInfo = (props)  => {
  const profile = props.profile
  const admin = props.admin
  if (!profile) return null
  return (
    <Table>
      <TableBody>
        <CustomRow title='プロフィール名'>{profile.name}</CustomRow>
        <CustomRow title='ユーザー名'>{profile.pro.lastname} {profile.pro.firstname}</CustomRow>
        <CustomRow title='開始日時'>{new Date(profile.createdAt).toLocaleDateString()}</CustomRow>
        <CustomRow title='住所'>{profile.address}</CustomRow>
        <CustomRow title='メインカテゴリ'>{profile.category.name}</CustomRow>
        {admin > 1 &&
            <CustomRow title='メールアドレス'>{profile.pro.email}</CustomRow>
        }
      </TableBody>
    </Table>
  )
}

const MatchingBucketChip = withTheme(({ props, theme }) => {
  const { grey, red, blue } = theme.palette
  const { matchingBucket } = props

  const styles = {
    buckets: {
      classicDistance: {
        background: grey[100],
        label: 'distance',
      },
      classicMeetRateDistance: {
        background: grey[200],
        label: 'distance + MR',
      },
      classicRandomFilter: {
        background: grey[100],
        label: 'random',
      },
      matchedByUser: {
        background: blue[100],
        label: 'user match',
      },
      matchedByAdmin: {
        background: red[100],
        label: 'admin match',
      },
      newPro: {
        background: red[200],
        label: 'new pro',
      },
      signedUpWithRequest: {
        background: grey[100],
        label: 'request signup',
      },
      heavyUser: {
        background: blue[100],
        label: 'heavy user',
      },
      lightUser: {
        background: grey[100],
        label: 'light user',
      },
    },
  }
  return <CustomChip
    label={styles.buckets[matchingBucket].label}
    style={{marginLeft: 10, background: styles.buckets[matchingBucket].background}}
  />
})

@withStyles(() => ({
  button: {
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
}))
@reduxForm({
  form: 'lineMessage',
  validate: (values) => {
    const errors = {}
    if (!values.text) {
      errors.text = '必須項目です'
    }
    return errors
  },
})
@connect(null, { pushMessage })
class LineMessageButton extends React.Component {

  state = {
    open: false,
  }

  submit = (values) => {
    const { pushMessage, user, onError, onSend } = this.props
    pushMessage(user._id, values)
      .then(() => {
        if (onSend) onSend()
        this.closeDialog()
      })
      .catch((err) => {
        if (onError) onError(err)
      })
  }

  openDialog = () => {
    this.setState({open: true})
  }

  closeDialog = () => {
    this.setState({open: false})
  }

  render() {
    const { className, style, classes, handleSubmit } = this.props
    const { open } = this.state

    return (
      <div className={className} style={style}>
        <Button size='small' variant='contained' className={classes.button} onClick={this.openDialog}>LINE送信</Button>
        <Dialog
          open={open}
        >
          <form onSubmit={handleSubmit(this.submit)}>
            <DialogTitle>LINEメッセージ送信</DialogTitle>
            <DialogContent>
              <Field name='text' component={renderTextArea} label='メッセージ' type='text' />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.closeDialog}>
              キャンセル
              </Button>
              <Button type='submit' variant='contained' color='primary'>
                送信
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>
    )
  }
}
