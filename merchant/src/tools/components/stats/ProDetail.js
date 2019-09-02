import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  Paper,
  Button,
  Dialog,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import { red, yellow } from '@material-ui/core/colors'
import withWidth from '@material-ui/core/withWidth'
import CloseIcon from '@material-ui/icons/Close'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import RoomIcon from '@material-ui/icons/Room'
import WatchLaterIcon from '@material-ui/icons/WatchLater'
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn'

import { load } from 'tools/modules/profile'
import { load as loadPoint } from 'tools/modules/point'
import { loadAllByPro as loadEmails } from 'tools/modules/maillog'
import Loading from 'components/Loading'
import GoogleMapStatic from 'components/GoogleMapStatic'
import UserAvatar from 'components/UserAvatar'
import SimpleExpand from 'components/SimpleExpand'
import MemoList from 'tools/components/MemoList'
import ProUserInfo from 'tools/components/stats/ProUserInfo'
import ProCampaignInfo from 'tools/components/stats/ProCampaignInfo'
import ProfileManageTab from 'tools/components/stats/ProfileManageTab'
import ReceiveRequestsTab from 'tools/components/stats/ReceiveRequestsTab'
import FeedbackTab from 'tools/components/stats/FeedbackTab'
import ProfileIntroductionTab from 'tools/components/stats/ProfileIntroductionTab'
import ProServiceTab from 'tools/components/stats/ProServiceTab'
import ProStat from 'tools/components/ProStat'
import MailLogs from 'tools/components/stats/MailLogs'
import EditUser from 'tools/components/stats/EditUser'
import CsEmailTemplateSelect from 'tools/components/CsEmailTemplateSelect'
import { Identification, Licence } from 'tools/components/CSTaskPage'
import { loadByProfile } from 'tools/modules/cstask'
import { shortTimeString, relativeTime } from 'lib/date'
import CSLog from 'tools/components/stats/CSLog'

@withWidth()
@connect(
  state => ({
    profile: state.profile.profile,
    point: state.point.point,
    admin: state.auth.admin,
  }),
  { load, loadPoint, loadEmails }
)
@withTheme
export default class ProDetail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tab: 'profile',
      csEmailTemplateSelectDialogOpen: false,
    }
  }

  componentDidMount() {
    this.load(this.props.match.params.id)
  }

  componentDidUpdate(prevProps) {
    const id = this.props.match.params.id
    const prevId = prevProps.match.params.id
    if (id !== prevId) {
      this.load(id)
    }
  }

  load = (id) => {
    this.props.load(id).then(({profile}) => {
      this.props.loadPoint(profile.pro.id)
    })
  }

  onUpdate = () => {
    this.setState({editPro: false})
    this.load(this.props.profile.id)
  }

  closeCsEmailTemplateSelectDialog = () => {
    this.setState({csEmailTemplateSelectDialogOpen: false})
  }

  render() {
    const { profile, point, admin, width, theme } = this.props
    const { grey, common } = theme.palette
    const { tab } = this.state

    if (!profile) return <Loading />

    if (admin === 1) {
      delete profile.pro.phone
    }

    const styles = {
      root: {
        height: '100%',
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      map: {
        position: 'relative',
        width: '100%',
        height: 200,
      },
      backButton: {
        background: common.white,
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 2,
      },
      mask: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, .5)',
        padding: width === 'xs' ? 10 : 20,
        display: 'flex',
        alignItems: 'flex-end',
        color: common.white,
      },
      errorBar: {
        background: red[500],
        color: common.white,
        textAlign: 'center',
      },
      row: {
        display: 'flex',
        flexDirection: width === 'xs' ? 'column': 'row',
        alignItems: 'flex-start',
        padding: width === 'xs' ? 10 : 20,
      },
      left: {
        flexShrink: 0,
        width: width === 'xs' ? '100%' : 320,
        paddingRight: width === 'xs' ? 0 : 10,
      },
      main: {
        marginTop: width === 'xs' ? 10 : 0,
        width: width === 'xs' ? '100%' : 'auto',
        flex: 1,
        minWidth: 0,
        background: common.white,
        flexDirection: 'column',
      },
      closeIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
      },
    }

    const latLng = {
      lat: profile.loc.coordinates[1],
      lng: profile.loc.coordinates[0],
    }

    const leftMenu = admin > 1 ? (
      <div style={styles.left}>
        <EditUser showNotification open={!!this.state.editPro} onUpdate={this.onUpdate} initialValues={profile.pro} onClose={() => this.setState({editPro: false})}/>
        <SimpleExpand header={<h4>CSメモ</h4>} defaultExpanded={width !== 'xs'}>
          <div>
            <CSLog refs={{profile, user: profile.pro}} />
          </div>
          <span>プロフィールメモ</span>
          <MemoList form={`memo_${profile.id}`} profile={profile.id} />
          <Divider style={{marginTop: 5}} />
          <span>ユーザーメモ</span>
          <MemoList form={`memo_${profile.pro.id}`} user={profile.pro.id} />
          <Divider style={{marginTop: 5}} />
          <div style={{display: 'flex', marginTop: 10}}>
            <span>ONB メール送信</span>
            <div style={{flex: 1}} />
            <Button variant='contained' color='primary' size='small' component={Link} to={`/stats/pros/${profile.id}/csEmails`}>テンプレ選択</Button>
          </div>
        </SimpleExpand>
        <SimpleExpand
          header={
            <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
              <h4>ユーザー情報</h4>
              <Button
                size='small'
                variant='contained'
                onClick={(e) => {
                  e.stopPropagation()
                  this.setState({editPro: true})
                }}>
                編集
              </Button>
            </div>
          }
          defaultExpanded={width !== 'xs'}
        >
          <ProUserInfo pro={profile.pro} point={point} onUpdate={this.onUpdate} />
        </SimpleExpand>
        <SimpleExpand header={<h4>キャンペーン情報</h4>} defaultExpanded={width !== 'xs'}>
          <ProCampaignInfo pro={profile.pro} profile={profile} point={point} onUpdate={this.onUpdate} />
        </SimpleExpand>
        <Dialog
          open={!!this.state.csEmailTemplateSelectDialogOpen}
          onClose={this.closeCsEmailTemplateSelectDialog}
        >
          <IconButton style={styles.closeIcon} onClick={this.closeCsEmailTemplateSelectDialog}>
            <CloseIcon />
          </IconButton>
          <CsEmailTemplateSelect profile={profile} onClose={this.closeCsEmailTemplateSelectDialog} />
        </Dialog>
      </div>
    ) : null

    return (
      <div style={styles.root}>
        <div style={styles.map}>
          <GoogleMapStatic center={latLng} zoom={14} markers={[latLng]} width={640} height={200} style={{width: '100%', objectFit: 'cover'}} />
          <Button variant='outlined' component={Link} to='/stats/pros' style={styles.backButton}>
            <LeftIcon />
            戻る
          </Button>
          <div style={styles.mask}>
            <UserAvatar user={profile.pro} style={{border: `2px solid ${common.white}`, minWidth: 64, minHeight: 64}} />
            <div style={{marginLeft: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <h3>{profile.name}</h3>
              <div style={{marginTop: 10, display: 'flex', fontSize: 13}}>
                <RoomIcon style={{width: 16, height: 16, marginRight: 5}} />
                <span style={{marginRight: 10}}>{profile.address}</span>
                <WatchLaterIcon style={{width: 16, height: 16, marginRight: 5}} />
                <span>{relativeTime(new Date(profile.pro.lastAccessedAt || profile.createdAt))}</span>
              </div>
            </div>
          </div>
        </div>
        {profile.deactivate && <div style={styles.errorBar}>退会済み</div>}
        {profile.suspend && <div style={styles.errorBar}>サスペンド中: {profile.suspend}</div>}
        <Tasks />
        <div style={styles.row}>
          {leftMenu}
          <Paper style={styles.main}>
            <Tabs
              variant='scrollable'
              scrollButtons='off'
              value={tab}
              onChange={(e, tab) => this.setState({tab})}
              style={{borderBottom: `1px solid ${grey[300]}`}}
            >
              <Tab style={{minWidth: 'auto', width: 100}} value='profile' label='プロ情報' />
              {admin > 1 && <Tab style={{minWidth: 'auto', width: 100}} value='requests' label='依頼' />}
              {admin > 1 && <Tab style={{minWidth: 'auto', width: 100}} value='stats' label='統計情報' />}
              {admin > 1 && <Tab style={{minWidth: 'auto', width: 100}} value='services' label='サービス' />}
              {admin > 1 && <Tab style={{minWidth: 'auto', width: 100}} value='emails' label='メール' />}
              {admin > 1 && <Tab style={{minWidth: 'auto', width: 100}} value='feedbacks' label='意見' />}
              <Tab style={{minWidth: 'auto', width: 100}} value='prointro' label='プロ紹介' />
              {admin > 1 && <Tab style={{minWidth: 'auto', width: 100}} value='timeline' label='行動履歴' />}
            </Tabs>
            {tab === 'profile' ?
              <ProfileManageTab profile={profile} onUpdate={this.onUpdate} />
            : tab === 'requests' ?
              <ReceiveRequestsTab profile={profile} />
            : tab === 'stats' && profile.stat ?
              <div style={{padding: 20}}>
                <h3 style={{marginBottom: 10}}>プロ統計情報</h3>
                <ProStat stat={profile.stat} />
              </div>
            : tab === 'timeline' ?
              <div>
                <Stepper orientation='vertical'>
                  {point.transactions.filter(e => e.type === 'bought').map((e, i) =>
                    <Step active={this.state[`step${i}`]} key={i}>
                      <StepLabel
                        icon={<MonetizationOnIcon style={{color: yellow[800]}} />}
                        onClick={() => this.setState({[`step${i}`]: !this.state[`step${i}`]})}
                      >
                        <div style={{display: 'flex', color: 'black'}}>
                          <div>{e.point}pt購入</div>
                          <div style={{flex: 1}} />
                          <div>{shortTimeString(new Date(e.createdAt))}</div>
                        </div>
                      </StepLabel>
                      <StepContent>詳細</StepContent>
                    </Step>
                  )}
                </Stepper>
              </div>
            : tab === 'emails' ?
              <div style={{padding: 20, fontSize: 13}}>
                <MailLogs loader={this.props.loadEmails} loadProps={{proEmail: profile.pro.email}} title='subject' />
              </div>
            : tab === 'feedbacks' ?
              <FeedbackTab profile={profile} />
            : tab === 'prointro' ?
              <ProfileIntroductionTab profile={profile} />
            : tab === 'services' ?
              <ProServiceTab profile={profile} />
            : null}
          </Paper>
        </div>
      </div>
    )
  }
}

@connect(state => ({
  profile: state.profile.profile,
  task: state.cstask.taskOfProfile,
}), { loadByProfile })
@withTheme
class Tasks extends React.Component {
  componentDidMount() {
    this.load()
  }

  load = () => {
    this.props.loadByProfile(this.props.profile.id)
  }

  render() {
    const { task, theme: {palette: { grey }} } = this.props
    if (!task || (!task.identification && !task.licence)) return null
    const { identification, licence } = task
    const styles = {
      root: {
        margin: '20px 20px 0',
        padding: 10,
      },
      title: {
        fontSize: 12,
        color: grey[800],
      },
    }
    return (
      <Paper style={styles.root}>
        {identification &&
          <>
            <span style={styles.title}>本人確認</span>
            <Identification minimum postProcess={this.load} task={identification} />
          </>
        }
        {identification && licence && <Divider />}
        {licence &&
          <>
            <span style={styles.title}>資格・免許確認</span>
            <Licence minimum postProcess={this.load} task={licence} />
          </>
        }
      </Paper>
    )
  }
}
