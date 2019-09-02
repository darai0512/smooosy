import React from 'react'
import { connect } from 'react-redux'
import { Button, CircularProgress, DialogContent } from '@material-ui/core'
import { red } from '@material-ui/core/colors'

import { charge, chargeNetbank, chargeConveni, paymentInfo } from 'modules/point'
import CreditCardInput from 'components/CreditCardInput'
import NetbankInput from 'components/NetbankInput'
import ConveniInput from 'components/ConveniInput'
import ConveniInfo from 'components/ConveniInfo'
import CreditCard from 'components/CreditCard'
import ConfirmDialog from 'components/ConfirmDialog'
import ResponsiveDialog from 'components/ResponsiveDialog'
import Notice from 'components/Notice'

const getDefaultCard = payjpCustomer => {
  if (payjpCustomer && payjpCustomer.default_card) {
    return payjpCustomer.cards.data.find(c => c.id === payjpCustomer.default_card)
  }
  return null
}

@connect(
  state => ({
    defaultCard: getDefaultCard(state.point.payjpCustomer),
    conveniInfo: state.point.conveniInfo,
  }),
  { charge, chargeNetbank, chargeConveni, paymentInfo }
)
export default class Payment extends React.Component {
  static defaultProps = {
    id: '',
    type: 'creditcard',
    payment: {price: 100, point: 1},
    onClick: () => {},
    onPaid: () => {},
    onClose: () => {},
    label: 'ポイントを購入する',
    completeMsg: '',
  }

  constructor(props) {
    super(props)
    this.state = {
      dialog: false,
      paid: false,
    }
  }

  showPaymentDialog = () => {
    const { type, defaultCard } = this.props
    const dialog = (type === 'creditcard' && defaultCard) ? 'direct' : type
    this.setState({dialog})
    this.props.onClick && this.props.onClick()
  }

  onCreated = ({id}) => {
    const body = { price: this.props.payment.price, discountPrice: this.props.payment.discountPrice, point: this.props.payment.point, count: 1 }
    if (id) body.token = id
    this.setState({dialog: false, paid: 'progress'})
    this.props.charge(body)
      .then(() => this.setState({paid: 'complete'}))
      .catch(err => {
        this.setState({paid: 'error', errorMessage: err.data.message})
      })
  }

  onNetbankSubmit = values => {
    this.setState({dialog: false, paid: 'netbank'})
    this.props.chargeNetbank({
      ...values,
      price: this.props.payment.price,
      point: this.props.payment.point,
      path: window.location.pathname,
    }).then(res => {
      window.location.href = res.redirect
    }).catch(err => {
      this.setState({paid: 'error', errorMessage: err.data.message})
    })
  }

  onConveniSubmit = values => {
    this.setState({dialog: false, paid: 'progress'})
    this.props.chargeConveni({
      ...values,
      price: this.props.payment.price,
      point: this.props.payment.point,
    }).then(() => {
      this.setState({paid: 'conveni'})
      this.props.paymentInfo()
    }).catch(err => {
      this.setState({paid: 'error', errorMessage: err.data.message})
    })
  }

  onSubmit = () => {
    this.setState({dialog: false})
    this.onCreated({})
  }

  onPaid = () => {
    this.setState({paid: false})
    if (['complete', 'conveni'].includes(this.state.paid)) {
      this.props.onPaid && this.props.onPaid()
    }
  }

  onCancel = () => {
    this.setState({dialog: false})
    this.props.onClose()
  }

  render() {
    const { dialog, paid } = this.state
    const { label, payment, defaultCard, conveniInfo, completeMsg, rootClass } = this.props

    const resultTitle =
      paid === 'progress' ? '購入中です・・・' :
      paid === 'complete' ? '購入完了しました' :
      paid === 'netbank' ? '銀行のページに移動します・・・' :
      paid === 'conveni' ? '店舗でお支払いください' :
      paid === 'error' ? '決済に失敗しました' : ''

    return (
      <>
        <Button fullWidth className={rootClass} size='large' variant='contained' color='primary' onClick={() => this.showPaymentDialog()}>
          {label}
        </Button>
        <ResponsiveDialog
          open={dialog && dialog !== 'direct'}
          onClose={this.onCancel}
          title={`${payment.point.toLocaleString()}ポイント（${payment.discountPrice ? payment.discountPrice.toLocaleString() : payment.price.toLocaleString()}円）`}
        >
          <DialogContent>
            {dialog === 'creditcard' ?
              <CreditCardInput onCreated={this.onCreated} />
            : dialog === 'netbank' ?
              <NetbankInput onSubmit={this.onNetbankSubmit} />
            : dialog === 'conveni' ?
              <ConveniInput onSubmit={this.onConveniSubmit} />
            : null}
          </DialogContent>
        </ResponsiveDialog>
        <ConfirmDialog
          disableBackdropClick
          open={dialog === 'direct'}
          title='購入しますか？'
          onSubmit={this.onSubmit}
          onClose={this.onCancel}
        >
          <div style={{fontWeight: 'bold', margin: '10px 0'}}>クレジットカード</div>
          <CreditCard info={defaultCard} />
          <div style={{fontWeight: 'bold', margin: '30px 0 10px'}}>購入ポイント</div>
          <div>{payment.point.toLocaleString()}ポイント</div>
          <div style={{fontWeight: 'bold', margin: '30px 0 10px'}}>金額</div>
          <div>{payment.discountPrice ? payment.discountPrice.toLocaleString() : payment.price.toLocaleString()}円</div>
        </ConfirmDialog>
        <ConfirmDialog
          alert
          disableBackdropClick
          open={!!paid}
          title={resultTitle}
          disabled={['progress', 'netbank'].includes(paid)}
          onSubmit={this.onPaid}
        >
          {paid === 'progress' ?
            <div style={{margin: 20, textAlign: 'center'}}><CircularProgress /></div>
          : paid === 'netbank' ?
            <div style={{margin: 20, textAlign: 'center'}}><CircularProgress /></div>
          : paid === 'conveni' ?
            <div>
              <Notice type='info'>
                注意: 支払いから1-4時間程度でポイントが付与されます
              </Notice>
              <ConveniInfo conveni={conveniInfo} />
              <p>※この情報はポイントページでも確認できます。</p>
            </div>
          : paid === 'complete' ?
            <div>{completeMsg}</div>
          : paid === 'error' ?
            <div style={{color: red[500]}}>{this.state.errorMessage}</div>
          : null}
        </ConfirmDialog>
      </>
    )
  }
}
