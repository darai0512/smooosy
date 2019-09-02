import React from 'react'
import { connect } from 'react-redux'
import { Paper, Button, CircularProgress } from '@material-ui/core'
import { DialogContent, DialogActions } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { load as loadUser } from 'modules/auth'
import { addCard } from 'modules/point'
import { load as loadPoint, paymentInfo } from 'modules/point'
import Chats from 'components/Chats'
import PointModal from 'components/PointModal'
import PointCampaignDialog from 'components/PointCampaignDialog'
import ResponsiveDialog from 'components/ResponsiveDialog'
import AgreementLinks from 'components/AgreementLinks'
import CreditCardInput from 'components/CreditCardInput'
import { StarterProgramBannerMini } from 'components/pros/StarterProgramBanner'
import ConsumptionTaxDialog from 'components/pros/ConsumptionTaxDialog'
import { priceFormat } from 'lib/string'
import { payment, discountReasons } from '@smooosy/config'

@withStyles((theme) => ({
  action: {
    flex: 1,
  },
  title: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  pointContainer: {
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      width: 240,
    },
  },
  points: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
  },
  divider: {
    marginTop: 10,
    borderTop: `1px solid ${theme.palette.common.black}`,
    paddingTop: 5,
  },
  point: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shortage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.palette.red[500],
  },
  shortagePoint: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  small: {
    fontSize: 14,
  },
  payment: {
    flex: 1,
  },
  footerButtons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
      alignItems: 'stretch',
    },
  },
  bankConvini: {
    flex: 1,
    height: 40,
    marginRight: 10,
    marginTop: 0,
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
      marginTop: 10,
    },
  },
  creditCampaign: {
    background: theme.palette.grey[200],
    marginTop: 10,
    padding: 10,
  },
}), {withTheme: true})
@connect(
  state => ({
    user: state.auth.user,
    point: state.point.point,
  }),
  { loadPoint, paymentInfo, addCard, loadUser }
)
export default class PreviewModal extends React.Component {

  state = {
    openAddCard: false,
    creating: false,
  }

  onPaid = () => {
    this.props.loadPoint()
    this.props.paymentInfo()
    this.setState({pointModal: false})
  }

  onCloseCampaign = () => {
    this.props.loadPoint()
    this.setState({campaign: false})
  }

  onOpenAddCard = () => {
    this.setState({openAddCard: true})
  }

  onCloseAddCard = () => {
    this.setState({openAddCard: false})
  }

  addCardAndSubmit = ({id}) => {
    const body = {}
    if (id) body.token = id
    this.setState({openAddCard: false, creating: true})
    this.props.addCard(body)
      .then(() => {
        this.props.loadUser()
        return this.props.onReload()
      })
      .then(this.props.onSubmit)
      .catch(err => {
        this.setState({errorMessage: err.data.message})
      })
      .finally(() => {
        this.setState({creating: false})
      })
  }

  render() {
    const { user, point, isNewbie, values, points, onClose, onSubmit, error, submitting, theme, classes } = this.props
    const { openAddCard, errorMessage, creating } = this.state
    const { grey, red } = theme.palette

    const isShortage = points.total < points.consume
    const chargePoint = points.consume - points.total
    const chargePrice = chargePoint * payment.pricePerPoint.withTax

    // クレカ登録されていない場合でポイントが足りない場合
    const openCreditCard = !user.hasActiveCard && isShortage
    const disabledPayment = openAddCard || submitting || creating

    const submitLabel = points.consume === 0 ? '無料で応募する' :
       isShortage ? ((isNewbie && !user.hasActiveCard) ? 'クレカ設定して応募する' : 'クレカ決済で応募する') : '送信する'

    return (
      <div>
        <ResponsiveDialog
          open={!!values}
          onClose={onClose}
          titleClassName={classes.title}
          title='以下の内容で送信します'
        >
          <DialogContent style={{padding: 20, background: grey[100]}}>
            <ConsumptionTaxDialog>
              {({onOpen}) => <div style={{marginBottom: 10, fontSize: 14}}><a onClick={onOpen}>10月1日（火）より、SMOOOSYポイントに新消費税率（10%）が適用されます</a></div>}
            </ConsumptionTaxDialog>
            <Paper style={{padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              {point &&
                <>
                  <div className={classes.pointContainer}>
                    <div className={classes.points}>
                      <div>応募ポイント</div>
                      <div className={classes.point}>{points.basePoint} pt</div>
                    </div>
                    {points.discounts.map(discount =>
                      <div key={discount.reason} className={classes.points}>
                        <div>{discountReasons[discount.reason]}</div>
                        <div className={classes.point}>{discount.point} pt</div>
                      </div>
                    )}
                    {(isShortage ? points.total > 0 : points.consume > 0) &&
                      <div className={classes.points}>
                        <div>保有ポイントを利用</div>
                        <div className={classes.point}>-{isShortage ? points.total : points.consume} pt</div>
                      </div>
                    }
                    <div className={[classes.points, classes.divider].join(' ')}>
                      <div>購入ポイント</div>
                      <div className={isShortage ? classes.shortage : classes.point}>
                        <div className={classes.shortagePoint}>{isShortage ? chargePoint : 0} pt</div>
                        {isShortage && <div className={[classes.shortage, classes.small].join(' ')}>({chargePrice}円)</div>}
                      </div>
                    </div>
                  </div>
                  {isNewbie && !user.hasActiveCard ?
                    <div className={classes.creditCampaign}>
                      <h3>クレカ設定した場合</h3>
                      <div className={classes.pointContainer}>
                        <div className={classes.points}>
                          <div>応募ポイント</div>
                          <div className={classes.point}>{points.basePoint} pt</div>
                        </div>
                        <div className={classes.points}>
                          <div>{discountReasons.firstCredit}</div>
                          <div className={classes.point}>-{points.basePoint} pt</div>
                        </div>
                        <div className={[classes.points, classes.divider].join(' ')}>
                          <div>購入ポイント</div>
                          <div className={classes.point}>
                            <div className={classes.shortagePoint}>0 pt</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  :
                    null
                  }
                </>
              }
            </Paper>
            <StarterProgramBannerMini style={{marginTop: '16px'}}/>
            <div style={{fontWeight: 'bold', marginTop: 20}}>プレビュー</div>
            <Paper style={{padding: '10px 20px'}}>
              {values &&
                <Chats chats={[{user, text: values.chat}, ...(values.files || [])]} priceString={priceFormat(values)} />
              }
            </Paper>
          </DialogContent>
          <DialogActions style={{display: 'block', margin: 0, padding: 10, borderTop: `1px solid ${grey[300]}`}}>
            {(error || errorMessage) && <div style={{textAlign: 'center', marginBottom: 10, color: red[500]}}>{error || errorMessage}</div>}
            {isShortage && <AgreementLinks label={submitLabel} point={true} style={{marginBottom: 5}} />}
            <div className={classes.footerButtons}>
              {!user.hasActiveCard &&
                <Button
                  className={classes.bankConvini}
                  onClick={isShortage ? () => this.setState({pointModal: true}) : onSubmit}
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={20} color='secondary' /> :
                  isShortage ? 'コンビニ・銀行決済' : 'クレカ設定せず応募する'}
                </Button>
              }
              <Button
                variant='contained'
                color='primary'
                className={classes.payment}
                disabled={disabledPayment}
                onClick={openCreditCard ? this.onOpenAddCard : onSubmit}
              >
                {disabledPayment ? <CircularProgress size={20} color='secondary' /> : submitLabel}
              </Button>
            </div>
          </DialogActions>
        </ResponsiveDialog>
        <ResponsiveDialog
          open={!!openAddCard}
          onClose={this.onCloseAddCard}
        >
          <DialogContent>
            <CreditCardInput onCreated={this.addCardAndSubmit} label='クレカ設定して応募する' />
          </DialogContent>
        </ResponsiveDialog>
        {point &&
          <PointModal
            hideCreditCard
            defaultType='netbank'
            open={!!this.state.pointModal}
            beforeMeet={true}
            minPoint={points.consume - points.total}
            onPaid={this.onPaid}
            onClose={() => this.setState({pointModal: false})}
          />
        }
        <PointCampaignDialog open={!!this.state.campaign} onClose={this.onCloseCampaign} />
      </div>
    )
  }
}
