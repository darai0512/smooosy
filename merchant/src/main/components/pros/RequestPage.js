import React from 'react'
import qs from 'qs'
import moment from 'moment'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'

import { withApiClient } from 'contexts/apiClient'
import { loadForPro as loadRequest, unloadForPro as unloadRequest } from 'modules/request'
import { load as loadProfile } from 'modules/profile'
import { readAll as readNotices } from 'modules/notice'
import ChangeAccountLink from 'components/ChangeAccountLink'
import RequestInfo from 'components/RequestInfo'
import ResponseForm from 'components/pros/ResponseForm'
import PassDialog from 'components/pros/PassDialog'
import hideIntercom from 'components/hideIntercom'
import PointSimulate from 'components/pros/PointSimulate'
import { calcTab } from 'lib/status'
import { timeNumbers } from '@smooosy/config'


@withApiClient
@withWidth()
@hideIntercom
@connect(
  state => ({
    request: state.request.requestForPro,
    profile: state.profile.profile,
  }),
  { loadRequest, loadProfile, readNotices, unloadRequest }
)
@withTheme
@withRouter
export default class RequestPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      responseMode: false,
      passModal: false,
    }
  }

  componentDidMount() {
    this.load(this.props)
  }

  componentWillUnmount() {
    this.props.unloadRequest()
  }

  componentDidUpdate(prevProps) {
    this.props.id !== prevProps.id && this.load(this.props)
  }

  load = (props) => {
    this.props.loadRequest(props.id).then(({requestForPro}) => {
      const query = qs.parse(props.location.search.slice(1))
      this.props.loadProfile(requestForPro.profile)
      if (requestForPro.pass) return

      if (query.mode === 'pass') {
        setTimeout(() => this.setState({passModal: true}), 0)
      } else if (query.mode === 'meet' || query.redirect) {
        setTimeout(() => this.setState({responseMode: true}), 0)
      } else if (query.mode === 'tbd') {
        setTimeout(() => this.setState({responseMode: true, needMoreInfo: true}), 0)
      }
    }).catch(err => {
      // 応募済みの場合は見積もり画面に移動
      if (err.status === 302) {
        const { meet } = err.data
        this.setState({meet})
      }
      this.setState({error: err.status})
    })

    this.props.readNotices({
      type: 'newRequest',
      model: 'Request',
      item: props.id,
    })
  }

  reload = () => {
    this.load(this.props)
  }

  onPass = () => {
    this.setState({passModal: false})
    this.props.history.push('/pros/requests')
  }

  render() {
    const { request, profile, width, theme } = this.props
    const { passModal, error } = this.state

    const { grey, common } = theme.palette

    if (error === 404) {
      return <div style={{fontSize: 20, margin: 40}}>依頼が存在しません</div>
    } else if (error === 403) {
      return (
        <div style={{margin: 40}}>
          <div style={{fontSize: 20}}>依頼が見つかりません</div>
          <div style={{marginTop: 20}}>
            別のアカウントでログインしている場合は、再度<ChangeAccountLink>ログイン</ChangeAccountLink>してください。
          </div>
        </div>
      )
    } else if (error === 302) {
      const url = `/pros/${calcTab(this.state.meet)}/${this.state.meet.id}`
      return (
        <div style={{margin: 40}}>
          <div style={{fontSize: 20}}>すでに応募している依頼です</div>
          <div style={{marginTop: 20}}>
            <Link to={url}>応募済みの画面</Link>に移動してください。
          </div>
        </div>
      )
    }

    if (!request || !profile) {
      return null
    }

    if (request.interview.includes('admin')) {
      return <div style={{fontSize: 20, margin: 40}}>この依頼は応募を停止しました</div>
    }

    if (request.customer.deactivate) {
      return <div style={{fontSize: 20, margin: 40}}>この依頼はキャンセルされました</div>
    }

    if (request.deleted) {
      return <div style={{fontSize: 20, margin: 40}}>この依頼は削除されました（{request.suspendReason}）</div>
    } else if (request.status === 'suspend') {
      return (
        <div style={{margin: 20}}>
          <h3>{request.customer.lastname}様は依頼をキャンセルしました</h3>
          {request.showReason &&
            <div style={{ marginTop: 10}}>
             理由: {request.suspendReason}
            </div>
          }
        </div>
      )
    } else if (request.status === 'close') {
      return (
        <div style={{margin: 20}}>
          <h3>{request.customer.lastname}様の依頼は他の{request.service.providerName}に決定しました</h3>
        </div>
      )
    } else if (request.meets.length >= 5) {
      return (
        <div style={{margin: 20}}>
          <h3>{request.customer.lastname}様の依頼は応募が5件に達したので受付を終了しました</h3>
        </div>
      )
    } else if (new Date(request.createdAt) < moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate()) {
      return (
        <div style={{margin: 20}}>
          <h3>{request.customer.lastname}様の依頼は応募期限を過ぎたため受付を終了しました</h3>
        </div>
      )
    }

    const showRequest = width === 'md' || !this.state.responseMode
    const showResponse = width === 'md' || this.state.responseMode

    const styles = {
      root: {
        height: '100%',
        display: 'flex',
      },
      info: {
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: width == 'md' ? `1px solid ${grey[300]}` : 'none',
      },
      requestInfo: {
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      response: {
        height: '100%',
        width: width === 'md' ? '55%' : '100%',
      },
      titleBar: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: 10,
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
    }

    return (
      <div style={styles.root}>
        {showRequest &&
          <div style={styles.info}>
            <div style={styles.titleBar}>
              <div style={{flex: 1}}>
                <Link to='/pros/requests'>
                  <Button style={{minWidth: 40}}><NavigationChevronLeft /></Button>
                </Link>
              </div>
              <div>依頼内容</div>
              <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                {width === 'md' && !request.pass &&
                  <Button
                    color='primary'
                    style={{height: 40}}
                    onClick={() => this.setState({passModal: true})}
                  >
                    パスする
                  </Button>
                }
              </div>
            </div>
            <div style={styles.requestInfo}>
              <RequestInfo
                request={request}
                customer={request.customer}
                profile={profile}
                pointComponent={
                  <PointSimulate
                    request={request}
                    onUpdateOnePtCampaign={this.reload}
                  />
                }
                />
            </div>
            {width !== 'md' && !request.pass &&
              <div style={{background: grey[700], borderTop: `1px solid ${grey[600]}`, padding: 10}}>
                <div style={{display: 'flex'}}>
                  <Button variant='contained' style={{flex: 1, marginRight: 10}} onClick={() => this.setState({passModal: true})}>パスする</Button>
                  <Button variant='contained' style={{flex: 2}} color='primary' onClick={() => this.setState({responseMode: true})}>メッセージを送る</Button>
                </div>
              </div>
            }
          </div>
        }
        {showResponse &&
          <div style={styles.response}>
            <ResponseForm request={request} onPass={() => this.setState({passModal: true})} closeResponse={() => this.setState({responseMode: false})} needMoreInfo={this.state.needMoreInfo} />
          </div>
        }
        <PassDialog requestForPro={request} profile={profile} open={!!passModal} onClose={this.onPass} />
      </div>
    )
  }
}
