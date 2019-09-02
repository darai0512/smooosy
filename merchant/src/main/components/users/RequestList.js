import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { Paper, Badge, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'

import { loadAll as loadRequests } from 'modules/request'
import { loadAll as loadServices } from 'modules/service'
import Container from 'components/Container'
import SubHeader from 'components/SubHeader'
import UserAvatar from 'components/UserAvatar'
import ServicePapers from 'components/ServicePapers'
import Footer from 'components/Footer'
import QueryDialog from 'components/cards/QueryDialog'
import { shortDateString } from 'lib/date'
import { timeNumbers, popularCategories } from '@smooosy/config'

@connect(
  state => ({
    requests: state.request.requests,
    services: state.service.services,
  }),
  { loadRequests, loadServices }
)
@withStyles(theme => ({
  request: {
    position: 'relative',
    width: 300,
    height: 380,
    margin: '20px 10px',
    padding: '30px 0',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
  },
  doneBadge: {
    color: theme.palette.secondary.main,
    backgroundColor: theme.palette.common.white,
    width: 20,
    height: 20,
    fontSize: 28,
  },
  divider: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    margin: '20px 0',
    width: '100%',
  },
  proImage: {
    border: `2px solid ${theme.palette.common.white}`,
    margin: '0 -10px',
    width: 64,
    height: 64,
    display: 'inline-block',
  },
  proText: {
    fontSize: '.8rem',
    color: theme.palette.grey[700],
    margin: 10,
  },
  proButton: {
    marginTop: 10,
  },
  requestList: {
    display: 'flex',
    flexWrap: 'wrap',
    minHeight: 300,
    justifyContent: 'center',
  },
}))
export default class RequestList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.loadRequests()
    this.props.loadServices()
  }

  handleTouchTapService = (service) => {
    if (service.enabled) {
      this.setState({selected: service.key})
    }
  }

  renderMeetInfo = (request) => {
    const { classes } = this.props

    let hired = null
    for (let m of request.meets) {
      if (m.status === 'progress' || m.status === 'done') {
        hired = m
        break
      }
    }

    return (
      <Paper key={`request_${request.id}`} className={classes.request}>
        {request.status === 'open' && request.meets.length > 0 &&
          <Badge badgeContent='' color='primary' invisible={false} className={classes.badge}>{''}</Badge>
        }
        <h4 style={{margin: '0 10px'}}>{request.service.name}</h4>
        <p>{shortDateString(new Date(request.createdAt))}</p>
        {request.status === 'open' &&
          <p style={{marginTop: 5, fontSize: 13}}><Link to={`/requests/${request.id}/edit`}>編集</Link></p>
        }
        <div className={classes.divider} />
        <div style={{flex: 1}} />
        {request.status === 'close' && hired ?
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{position: 'relative'}}>
              <Badge badgeContent={<CheckCircleIcon fontSize='inherit' />} color='secondary' classes={{badge: classes.doneBadge}}>
                <UserAvatar user={hired.pro} style={{width: 64, height: 64}} />
              </Badge>
            </div>
            {hired.review ?
              <p className={classes.proText}>完了しました</p>
            :
              <Button color='primary' className={classes.proButton} onClick={() => this.props.history.push(`/requests/${request.id}/responses/${hired.id}`, {reviewModal: true})}>
                クチコミを書く
              </Button>
            }
          </div>
        : request.status === 'suspend' ?
          <p className={classes.proText}>依頼をキャンセルしました</p>
        :
          <div>
            {request.meets.map((meet, i) => (
              <UserAvatar key={i} user={meet.pro} className={classes.proImage} />
            ))}
            <p className={classes.proText}>
              {request.meets.length ?
                `${request.meets.length}人の${request.service.providerName}から連絡があります`
              : new Date(request.createdAt) < moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() ?
                `依頼に合う${request.service.providerName}は見つかりませんでした`
              :
                `${request.service.providerName}を探しています`
              }
            </p>
          </div>
        }
        <div style={{flex: 1}} />
        {request.status !== 'suspend' &&
          <Button variant='contained' color='primary' component={Link} to={`/requests/${request.id}`}>
            {
              request.status === 'close' ?  '依頼を見る' :
              request.meets.length > 0 ? '見積もりを見る' :
              '依頼内容を見る'
            }
          </Button>
        }
      </Paper>
    )
  }

  render() {
    const { requests, services, classes } = this.props

    if (!requests) return null

    return (
      <div>
        <Helmet>
          <title>依頼一覧</title>
        </Helmet>
        <Container withPad>
          <div style={{display: 'flex'}}>
            <div style={{fontSize: 20, fontWeight: 'bold'}}>依頼一覧</div>
            <div style={{flex: 1}} />
            <Button variant='contained' color='primary' onClick={() => this.props.history.push('/')} >依頼を作成する</Button>
          </div>
          <div className={classes.requestList}>
            {requests.length === 0 && <div style={{margin: '100px 0', textAlign: 'center'}}>まだ依頼はありません</div>}
            {requests.map(this.renderMeetInfo)}
          </div>
        </Container>
        <Container gradient>
          <SubHeader>人気のサービス</SubHeader>
          {popularCategories.map(c =>
            <ServicePapers
              key={c.key}
              categoryKey={c.key}
              title={c.title}
              services={services.filter(s => s.enabled && c.title === s.tags[0])}
              linkFunction={s => `/services/${s.key}`}
              hoverText={s => `近くの${s.providerName}を探す`}
            />
          )}
        </Container>
        <Footer />
        <QueryDialog open={!!this.state.selected} serviceKey={this.state.selected} onClose={() => this.setState({selected: null})} />
      </div>
    )
  }
}
