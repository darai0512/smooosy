import React from 'react'
import { connect } from 'react-redux'
import { update as updateUser } from 'modules/auth'
import { FormGroup, RadioGroup, Radio, FormControlLabel } from '@material-ui/core'
import { DialogContent } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import AgreementLinks from 'components/AgreementLinks'
import ResponsiveDialog from 'components/ResponsiveDialog'
import Payment from 'components/Payment'
import { showIntercom, hideIntercom } from 'lib/intercom'
import { payment } from '@smooosy/config'

const YEN_PER_POINT = payment.pricePerPoint.withTax
const paymentTable = payment.table
const MIN_PRICE = {
  creditcard: 0,
  conveni: 2000,
  netbank: 2000,
}

@withWidth()
@connect(
  state => ({
    conveniInfo: state.point.conveniInfo,
  }),
  { updateUser }
)
@withTheme
export default class PointModal extends React.Component {
  static defaultProps = {
    title: 'SMOOOSYポイントを購入',
    open: false,
    minPoint: 0,
    beforeMeet: false,
    onPaid: () => {},
    onClose: () => {},
    hideCreditCard: false,
    defaultType: 'creditcard',
  }

  constructor(props) {
    super(props)
    this.state = {
      type: 'creditcard',
    }
  }

  componentDidMount() {
    const { hideCreditCard, defaultType } = this.props
    if (hideCreditCard && defaultType === 'creditcard') {
      this.selectPayment('netbank')
    } else {
      this.selectPayment(defaultType)
    }
    window.hj && window.hj('trigger', 'payment')
  }

  selectPayment = (type) => {
    const { selectedPrice } = this.state
    const { minPoint } = this.props
    this.setState({type})
    const available = Object.keys(paymentTable).filter(key => paymentTable[key] >= minPoint && key >= MIN_PRICE[type])
    if (available.indexOf(selectedPrice) === -1) {
      this.selectPrice(available[0])
    }
  }

  selectPrice = (selectedPrice) => {
    const { minPoint } = this.props
    const point = paymentTable[selectedPrice]
    let paymentInfo = {price: parseInt(selectedPrice, 10), point}
    if (selectedPrice < 0) {
      paymentInfo = {
        price: minPoint * YEN_PER_POINT,
        point: minPoint,
      }
    }
    this.setState({paymentInfo, selectedPrice})
  }

  onPaid = () => {
    this.props.onPaid()
  }

  onClose = () => {
    showIntercom()
    this.props.onClose()
  }

  render() {
    const { paymentInfo, type } = this.state
    const { title, open, minPoint, beforeMeet, hideCreditCard, width, theme } = this.props
    const { grey } = theme.palette

    const styles = {
      title: {
        padding: 24,
        fontSize: width === 'xs' ? 16 : 18,
        fontWeight: 'bold',
      },
      dialogContent: {
        padding: width === 'xs' ? '0 12px 12px' : '0 24px 24px',
      },
      selectableForm: {
        borderWidth: '1px 1px 0',
        borderStyle: 'solid',
        borderColor: grey[300],
        display: 'block',
      },
      selectWrap: {
        width: '100%',
        borderBottom: `1px solid ${grey[300]}`,
        cursor: 'pointer',
      },
      select: {
        padding: width === 'xs' ? '0px 12px' : '0px 24px',
        width: '100%',
      },
      other: {
        marginTop: -10,
        padding: width === 'xs' ? '0 12px 8px 48px' : '0 24px 12px 60px',
      },
      memo: {
        fontSize: 11,
        color: grey[500],
      },
      notificationTitle: {
        fontWeight: 'bold',
        flexWrap: 'wrap',
        margin: 'auto 10px',
        fontSize: width === 'xs' ? 12 : 16,
      },
    }

    return (
      <ResponsiveDialog
        open={open}
        onOpen={hideIntercom}
        onClose={this.onClose}
        title={title}
      >
        <DialogContent style={styles.dialogContent}>
          <FormGroup style={styles.selectableForm} value={type}>
            {!hideCreditCard &&
              <div style={styles.selectWrap} onClick={() => this.selectPayment('creditcard')}>
                <FormControlLabel
                  style={styles.select}
                  value='creditcard'
                  control={<Radio color='primary' checked={type === 'creditcard'} />}
                  label='クレジットカード'
                />
                <div style={styles.other}>
                  {Object.values(payment.cardBrandImages).map((image, i) =>
                    <img key={i} src={image} style={{height: 26, marginRight: 1}} />
                  )}
                </div>
              </div>
            }
            <div style={styles.selectWrap} onClick={() => this.selectPayment('netbank')}>
              <FormControlLabel
                style={styles.select}
                value='netbank'
                control={<Radio color='primary' checked={type === 'netbank'}  />}
                label='銀行支払い'
              />
              <div style={styles.other}>
                {Object.values(payment.netbankTypes).map((bank, i) =>
                  <img key={i} src={bank.image} style={{height: 30, margin: 2}} />
                )}
              </div>
            </div>
            <div style={styles.selectWrap} onClick={() => this.selectPayment('conveni')}>
              <FormControlLabel
                style={styles.select}
                value='conveni'
                control={<Radio color='primary' checked={type === 'conveni'}  />}
                label='コンビニ支払い'
              />
              <div style={styles.other}>
                {Object.values(payment.conveniTypes).map((conveni, i) =>
                  <img key={i} src={conveni.image} style={{height: 30, margin: 2}} />
                )}
                <p style={styles.memo}>※ ポイント付与まで1-4時間かかります</p>
              </div>
            </div>
          </FormGroup>
          <RadioGroup value={this.state.selectedPrice} onChange={e => this.selectPrice(e.target.value)}>
            {Object.keys(paymentTable).map(price =>
              paymentTable[price] < minPoint || price < MIN_PRICE[type] ? null :
              <FormControlLabel
                key={price}
                value={price}
                style={{minHeight: '65px', position: 'relative', marginRight: 0}}
                control={<Radio color='primary' />}
                label={
                  <span>
                    <span><span style={{fontSize: width === 'xs' ? 20 : 24}}>{paymentTable[price].toLocaleString()}</span> pt</span>
                    <span style={{textAlign: 'right', position: 'absolute', right: 0}}>
                      <span style={{fontSize: width === 'xs' ? 10 : 12}}>
                        （税込）
                      </span>
                      <span style={{fontSize: width === 'xs' ? 20 : 24}}>
                        {parseInt(price, 10).toLocaleString()}円
                      </span>
                    </span>
                  </span>
                }
              />
            )}
            {beforeMeet && !hideCreditCard && type === 'creditcard' &&
              <FormControlLabel
                value={'-1'}
                style={{minHeight: '70px', position: 'relative', marginRight: 0}}
                control={<Radio color='primary' />}
                label={
                  <span>
                    <span><span style={{fontSize: width === 'xs' ? 20 : 24}}>不足分購入（{minPoint}</span><span>pt</span><span style={{fontSize: width === 'xs' ? 20 : 24}}>）</span></span>
                    <span style={{textAlign: 'right', position: 'absolute', right: 0}}>
                      <span style={{fontSize: width === 'xs' ? 10 : 12}}>
                        （税込）
                      </span>
                      <span style={{fontSize: width === 'xs' ? 20 : 24}}>
                        {(minPoint * YEN_PER_POINT).toLocaleString()}円
                      </span>
                    </span>
                  </span>
                }
              />
            }
          </RadioGroup>
          <div style={{height: 10}} />
          <AgreementLinks label='ポイントを購入する' point={true} style={{marginBottom: 5}} />
          <Payment style={{margin: 10}} type={type} payment={paymentInfo} onPaid={this.onPaid} />
        </DialogContent>
      </ResponsiveDialog>
    )
  }
}
