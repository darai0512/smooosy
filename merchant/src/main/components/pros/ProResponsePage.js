import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { Button, RadioGroup, Radio, FormControlLabel } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import ChatIcon from '@material-ui/icons/Chat'

import { loadForPro as loadMeet } from 'modules/meet'
import { load as loadPoint, paymentInfo } from 'modules/point'
import { open as openSnack } from 'modules/snack'
import { acceptByPro as acceptMeet, declineByPro as declineMeet } from 'modules/meet'
import { pass as passRequest } from 'modules/request'
import RequestInfo from 'components/RequestInfo'
import PriceBreakdown from 'components/PriceBreakdown'
import ProStatusBox from 'components/pros/ProStatusBox'
import Payment from 'components/Payment'
import ConfirmDialog from 'components/ConfirmDialog'
import PassDialog from 'components/pros/PassDialog'
import CampaignBanner from 'components/pros/CampaignBanner'
import PointSimulate from 'components/pros/PointSimulate'
import Chats from 'components/Chats'
import { timeNumbers, payment, passReason } from '@smooosy/config'

const YEN_PER_POINT = payment.pricePerPoint.withTax


const passAgenda = {
  notSendReason: {
    title: '理由を送信しない',
  },
  schedule: {
    title: '忙しく対応できない',
    message: `この度はご依頼いただきありがとうございます。せっかくご指名頂きましたが、現在多くのお客様からご依頼をいただいており、受け入れが困難な状況でございます。
誠に申し訳ございませんがまたの機会によろしくお願い致します。`,
  },
  match: {
    title: '依頼内容の対応が難しい',
    message: `この度はご依頼いただきありがとうございます。せっかくご指名頂きましたが、詳細を拝見させていただきましたところ、お客様のご要望にお応えするのが難しいと思われます。
誠に申し訳ございませんがまたの機会によろしくお願い致します。`,
  },
}

@withRouter
@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  main: {
    margin: '0 auto',
    padding: '10px 30px',
    maxWidth: 1000,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: '20px 0 10px',
    [theme.breakpoints.down('xs')]: {
      padding: '30px 15px 15px',
    },
  },
  chatNotice: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 0',
  },
  chatIcon: {
    color: theme.palette.red[500],
    marginRight: 5,
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  request: {
    flex: 1,
  },
  requestWrap: {
    borderWidth: '0 1px',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
  },
  response: {
    position: 'sticky',
    top: 30,
    width: 300,
    marginLeft: 20,
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  box: {
    textAlign: 'center',
    padding: 10,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  button: {
    [theme.breakpoints.up('sm')]: {
      marginBottom: 10,
    },
    [theme.breakpoints.down('xs')]: {
      margin: '0 5px',
      flex: 1,
    },
  },
  rootSp: {
    background: theme.palette.common.white,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  headerSp: {
    padding: 10,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  mainSp: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  responseSp: {
    display: 'flex',
    padding: '10px 5px',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  subTitle: {
    padding: 10,
    background: theme.palette.grey[100],
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  priceBreakdown: {
    padding: 10,
  },
  passDialog: {
    width: 450,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  preview: {
    background: theme.palette.grey[100],
    padding: 20,
    marginTop: 10,
  },
}))
@connect(
  state => ({
    meet: state.meet.meet,
  }),
  { loadMeet, loadPoint, paymentInfo, acceptMeet, passRequest, declineMeet, openSnack }
)
export default class ProResponsePage extends React.Component {
  state = {
    chargePoint: null,
    chargePrice: null,
    reason: 'notSendReason',
    passModal: false,
  }


  componentDidMount() {
    const { status, meet } = this.props
    if (status !== 'contacts') {
      this.props.history.replace(`/pros/contacts/${meet.id}`)
      return
    }
    this.props.paymentInfo()
    this.props.loadPoint().then(({point}) => {
      const { meet } = this.props
      const total = point ? point.sum.limited + point.sum.bought : 0
      const consume = meet.point || 0
      const chargePoint = consume - total
      const chargePrice = chargePoint * YEN_PER_POINT
      this.setState({
        chargePoint,
        chargePrice,
      })
    })
  }

  onAccept = () => {
    this.props.acceptMeet(this.props.meet.id)
      .catch((err) => {
        if (err.data && err.data.message) {
          this.props.openSnack(err.data.message)
        }
        this.props.history.replace('/pros/requests')
      })
  }

  onDecline = () => {
    const { meet } = this.props
    const { reason } = this.state

    if (!passReason[reason]) {
      this.setState({declineDialog: false, passModal: true})
      return
    }

    const passMessage = passAgenda[reason].message
    this.setState({declineDialog: false})
    this.props.passRequest(meet.request._id, {profile: meet.profile.id, reason: passReason[reason]})
    this.props.declineMeet(this.props.meet.id, {passMessage})
      .then(() => this.props.history.push('/pros/requests'))
  }

  onPass = () => {
    this.props.declineMeet(this.props.meet.id)
      .then(() => this.props.history.push('/pros/requests'))
  }

  reload = () => {
    this.props.loadMeet(this.props.meet.id)
  }

  render() {
    const { meet, classes } = this.props
    const { chargePoint, chargePrice, passModal, reason } = this.state

    if (chargePoint === null) return null

    const request = meet.request
    request.service = meet.service
    request.customer = meet.customer

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

    const priceComponent = (
      <>
        <h4 className={classes.subTitle}>
          あなたの設定価格
        </h4>
        <div className={classes.priceBreakdown}>
          <PriceBreakdown price={meet.priceValues} />
        </div>
      </>
    )


    const customerChatCount = meet.chats.filter(c => c.user.id === meet.customer.id).length

    const payButton = chargePoint > 0 ? (
      <Payment
        type='creditcard'
        label='返信する'
        payment={{point: chargePoint, price: chargePrice}}
        onPaid={this.onAccept}
        rootClass={classes.button}
      />
    ) : (
      <Button
        fullWidth
        variant='contained'
        color='primary'
        onClick={this.onAccept}
        className={classes.button}
      >
        返信する
      </Button>
    )

    return (
      <>
        <div className={classes.root}>
          <div className={classes.main}>
            <CampaignBanner request={request} onUpdateOnePtCampaign={this.reload} />
            <div className={classes.title}>
              {meet.customer.lastname}様があなたを指名しています
            </div>
            {customerChatCount > 0 &&
              <div className={classes.chatNotice}>
                <ChatIcon className={classes.chatIcon} />
                チャットが{customerChatCount}件届いています
              </div>
            }
            <div className={classes.row}>
              <div className={classes.request}>
                <div className={classes.requestWrap}>
                  <RequestInfo
                    noCountDown
                    request={request}
                    customer={meet.customer}
                    profile={meet.profile}
                    middleSpace={priceComponent}
                    pointComponent={
                      <PointSimulate
                        request={request}
                        onUpdateOnePtCampaign={this.reload}
                      />
                    }
                  />
                </div>
              </div>
              <div className={classes.response}>
                <div className={classes.box}>
                  この依頼に返信しますか？
                </div>
                <div className={classes.box}>
                  {payButton}
                  <Button fullWidth size='large' variant='outlined' onClick={() => this.setState({declineDialog: true})}>
                    辞退する
                  </Button>
                </div>
                <ProStatusBox meet={meet} meetsCount={request.meets.length} />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.rootSp}>
          <div className={classes.headerSp}>
            <Button component={Link} to='/pros/requests'>
              <LeftIcon />
              戻る
            </Button>
          </div>
          <div className={classes.mainSp}>
            <CampaignBanner request={request} />
            <div className={classes.title}>
              {meet.customer.lastname}様があなたを指名しています
            </div>
            <RequestInfo
              noCountDown
              request={request}
              customer={meet.customer}
              profile={meet.profile}
              middleSpace={priceComponent}
              pointComponent={
                <PointSimulate
                  request={request}
                  onUpdateOnePtCampaign={this.reload}
                />
              }
            />
            <ProStatusBox meet={meet} meetsCount={request.meets.length} />
          </div>
          <div className={classes.responseSp}>
            <Button size='large' variant='outlined' className={classes.button} onClick={() => this.setState({declineDialog: true})}>
              辞退する
            </Button>
            {payButton}
          </div>
        </div>
        <ConfirmDialog
          open={!!this.state.declineDialog}
          onClose={() => this.setState({declineDialog: false})}
          title={`${meet.customer.lastname}様を断りますか？`}
          label='辞退する'
          onSubmit={this.onDecline}
          classes={{paper: classes.passDialog}}
        >
          <RadioGroup
            value={reason}
            onChange={(e) => this.setState({reason: e.target.value})}
          >
            {Object.keys(passAgenda).map(key =>
              <FormControlLabel
                key={key}
                value={key}
                control={<Radio />}
                label={passAgenda[key].title}
              />
            )}
          </RadioGroup>
          {passAgenda[reason].message &&
            <div className={classes.preview}>
              <h4>送信プレビュー</h4>
              <Chats me={meet.pro} chats={[{text: passAgenda[reason].message, user: meet.pro}]} />
            </div>
          }
        </ConfirmDialog>
        <PassDialog onPass={this.onPass} requestForPro={request} profile={meet.profile} open={!!passModal} onClose={() => this.setState({passModal: false})} />
      </>
    )
  }
}
