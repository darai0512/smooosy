import React from 'react'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
} from '@material-ui/core'
import { Stepper, Step, StepLabel, StepContent } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme, withStyles } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationMoreVert from '@material-ui/icons/MoreVert'
import ActionAssignment from '@material-ui/icons/Assignment'
import ActionSchedule from '@material-ui/icons/Schedule'
import ActionStars from '@material-ui/icons/Stars'
import ActionWork from '@material-ui/icons/Work'
import ActionPayment from '@material-ui/icons/Payment'
import MapsRateReview from '@material-ui/icons/RateReview'

import { update as updateUser, load as loadUser } from 'modules/auth'
import { update as updateRequest } from 'modules/request'
import { readAll as readNotices } from 'modules/notice'
import RequestInfo from 'components/RequestInfo'
import CountDown from 'components/CountDown'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ConfirmDialog from 'components/ConfirmDialog'
import SelectService from 'components/SelectService'
import LineLogin from 'components/LineLogin'
import DuplicateRequestDialog from 'components/DuplicateRequestDialog'
import AboutMeetDialog from 'components/AboutMeetDialog'
import { sendGAEvent } from 'components/GAEventTracker'
import { timeNumbers, GAEvent } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent

@withWidth({
  largeWidth: 840,
})
@connect(
  state => ({
    request: state.request.request,
  }),
  { updateRequest, readNotices, updateUser, loadUser }
)
@withTheme
@withStyles(() => ({
  paper: {
    maxWidth: 600,
  },
  meetsList: {
    padding: 0,
    fontSize: 15,
  },
}))
export default class RequestOverview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      confirmOpen: false,
      openRecommend: false,
    }
  }

  componentDidMount() {
    const { created } = this.props.location.state || {}
    if (created) this.afterCreated()
    this.props.readNotices({
      type: 'remindMeets',
      model: 'Request',
      item: this.props.request.id,
    })
  }

  afterCreated = () => {
    const { request } = this.props
    // バウンスダイアログを表示させるために再度 loadUser
    // バウンス検証はタイムラグがあるため、setTimeout で再度検証
    this.props.loadUser()
    setTimeout(() => this.props.loadUser(), 5000)
    this.setState({
      created: true,
      address: request.address,
      related: request.interview.indexOf('duplicate') !== -1,
    })
    this.props.history.replace(this.props.location.pathname)
  }

  toggle = () => {
    this.setState({open: !this.state.open})
  }

  handleSuspend = () => {
    this.props.updateRequest(this.props.request.id, {status: 'suspend'})
    this.setState({confirmOpen: false, anchor: null})
  }

  handleClose = () => {
    const { request } = this.props
    this.setState({created: false})
    const recommendServices = request.service.recommendServices
    if (recommendServices && recommendServices.length > 0) {
      this.setState({openRecommend: true})
    }
  }

  handleRecommend = (service) => {
    sendGAEvent(dialogOpen, pageType.RequestOverview, service.key)
    if (service.matchMoreEnabled) {
      const { address } = this.state
      return this.props.history.push(`/instant-results?serviceId=${service.id}&zip=${address || ''}`)
    }
    this.props.history.push(`/services/${service.key}`)
  }

  onLineLogin = ({lineCode, page}) => {
    this.afterCreated()
    return this.props.updateUser({lineCode, page})
  }

  render() {
    const { request, width, theme, classes } = this.props
    const { common, grey } = theme.palette

    let stepIndex = 1
    if (request.status === 'close') {
      stepIndex = 2
    }

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 57,
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        width: width === 'xs' ? '100%' : '60vw',
        maxWidth: 800,
        margin: '10px auto',
      },
      stepContent: {
        margin: '10px 0',
        padding: 10,
        border: `1px solid ${grey[300]}`,
      },
    }

    const expired = new Date(request.createdAt) < moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate()

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
            {width === 'xs' && (
              <Button component={Link} to={`/requests/${request.id}`}><NavigationChevronLeft />戻る</Button>
            )}
            </div>
            <div>依頼の状況</div>
            <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end', color: grey[500]}}>
              {request.status === 'open' &&
                <div>
                  <IconButton onClick={(e) => this.setState({anchor: e.currentTarget})}><NavigationMoreVert /></IconButton>
                  <Menu
                    open={!!this.state.anchor}
                    anchorEl={this.state.anchor}
                    getContentAnchorEl={null}
                    anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                    transformOrigin={{horizontal: 'right', vertical: 'top'}}
                    onClose={() => this.setState({anchor: null})}
                  >
                    <MenuItem onClick={() => this.setState({confirmOpen: true})} >依頼をキャンセルする</MenuItem>
                  </Menu>
                </div>
              }
            </div>
          </div>
        }
      >
        <div style={styles.main}>
          {request.status === 'suspend' ?
          <div style={{textAlign: 'center'}}>
            <div style={{margin: 10, fontSize: 18}}>依頼をキャンセルしました</div>
            {request.suspendReason && <div style={{margin: 10}}>理由: {request.suspendReason}</div>}
            <Button
              variant='contained'
              color='primary'
              onClick={this.toggle}
            >
              依頼内容を見る
            </Button>
          </div>
          :
          <Stepper activeStep={stepIndex} orientation='vertical'>
            <Step active>
              <StepLabel>依頼を作成</StepLabel>
              <StepContent>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={this.toggle}
                  style={{margin: 5}}
                >
                  依頼内容を見る
                </Button>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>{request.service.providerName}の見積もりを比べる</StepLabel>
              <StepContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ActionAssignment />
                    </ListItemIcon>
                    <ListItemText primary={`見積もり数：${request.meets.length}/5件`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ActionSchedule />
                    </ListItemIcon>
                    <ListItemText primary={
                      expired ? '見積もり受付終了' :
                      <p>見積もり受付終了まで残り
                        <CountDown style={{fontWeight: 'bold'}} start={new Date(request.createdAt)} prefix='' includeSecond={true} />
                      </p>
                    } />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ActionStars />
                    </ListItemIcon>
                    <ListItemText primary={
                      <p>
                        希望にあった{request.service.providerName}を選び、
                        <span style={{fontWeight: 'bold'}}>「決定する」</span>
                        ボタンを押しましょう
                      </p>
                    } />
                  </ListItem>
                </List>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>{request.service.providerName}を雇う</StepLabel>
              <StepContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ActionWork />
                    </ListItemIcon>
                    <ListItemText primary={`${request.service.providerName}に依頼内容をしてもらいましょう`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ActionPayment />
                    </ListItemIcon>
                    <ListItemText primary='取り決めた報酬を支払いましょう' />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <MapsRateReview />
                    </ListItemIcon>
                    <ListItemText primary='依頼が終わったらクチコミを書きましょう' />
                  </ListItem>
                </List>
              </StepContent>
            </Step>
          </Stepper>
          }
        </div>
        <Dialog
          open={!!this.state.open}
          classes={{paper: classes.paper}}
          onClose={() => this.setState({open: false})}
        >
          <Paper><RequestInfo request={request} customer={request.customer} /></Paper>
        </Dialog>
        <DuplicateRequestDialog request={request} open={this.state.related} onClose={() => this.setState({related: false})} />
        <AboutMeetDialog request={request} open={!this.state.related && !!this.state.created} onClose={this.handleClose} />
        {request.service.recommendServices && <SelectService open={this.state.openRecommend} services={request.service.recommendServices} title='他にもおすすめのサービスに依頼しませんか？' label='依頼する' onClose={() => this.setState({openRecommend: false})} onSelect={this.handleRecommend} />}
        <ConfirmDialog
          title='本当にキャンセルしてよろしいですか？'
          open={!!this.state.confirmOpen}
          onSubmit={() => this.handleSuspend()}
          onClose={() => this.setState({confirmOpen: false, anchor: null})}
        >
          キャンセルするとすべてのプロと連絡がとれなくなります。
        </ConfirmDialog>
        <div style={{display: 'none'}}>
          <LineLogin onLogin={this.onLineLogin} page={`/requests/${this.props.request.id}/overview`} />
        </div>
      </AutohideHeaderContainer>
    )
  }
}
