import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, FormSection } from 'redux-form'
import { withStyles, Dialog, DialogContent, DialogActions, DialogTitle, Button, Divider } from '@material-ui/core'

import PriceValuesSetting from 'components/PriceValuesSetting'
import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'
import CampaignWarning from './CampaignWarning'

import { updateMany } from 'modules/proService'
import { initializePriceValues, parsePriceValues, checkFilledBaseQuery, getQueries, validateTravelFee, showPriceValues } from 'lib/proService'

const AUTOMOBILE_REPAIR_KEY = 'automobile-body-repair-and-paint'
@connect(state => ({
  proServices: state.proService.proServices,
}), { updateMany })
@reduxForm({
  form: 'proServiceBulkPrice',
  validate: (values, props) => {
    const errors = {}
    const { proServices, isSetup } = props
    for (const id in proServices) {
      const ps = proServices[id]
      const showPV = showPriceValues(ps, isSetup)
      if (!showPV) continue
      if (values[id] && values[id].travelFee) {
        const travelFeeError = validateTravelFee(values[id].travelFee)
        errors[id] = {travelFee: travelFeeError}
      }
    }
    return errors
  },
  warn: (values, props) => {
    const warns = {}
    const { proServices, isSetup } = props
    for (const id in proServices) {
      const ps = proServices[id]
      const showPV = showPriceValues(ps, isSetup)
      if (!showPV || ps.service.key === AUTOMOBILE_REPAIR_KEY) continue

      if (ps.service.singleBasePriceQuery) {
        if (values[id] && (!values[id].singleBase || (typeof values[id].singleBase.singleBase !== 'number' && !values[id].singleBase.singleBase))) {
          warns[id] = {singleBase: {singleBase: '価格を入力してください'}}
        }
        continue
      }

      const warn = checkFilledBaseQuery((values[id] || {}).base, ps)
      if (warn.length) {
        warns[id] = {...warns[id], base: {}}
        // white space is added to show warning icon
        warn.forEach(w => warns[id].base[w] = ' ')
      }
    }

    warns._warning = Object.keys(warns)
    return warns
  },
})
@withStyles(theme => ({
  root: {
    height: '100%',
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
    WebkitOverflowScrolling: 'touch',
  },
  title: {
    textAlign: 'center',
    paddingTop: 20,
    color: theme.palette.grey[800],
    fontSize: 28,
  },
  subText: {
    color: theme.palette.grey[700],
    textAlign: 'center',
    padding: '0 5px',
  },
  sectionWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionRoot: {
    margin: '40px 0 10px',
  },
  confirm: {
    width: '100%',
    position: 'sticky',
    bottom: 0,
    padding: 10,
    background: theme.palette.common.white,
    borderRadius: 0,
  },
  button: {
    fontSize: 18,
    height: 50,
  },
  bold: {
    fontWeight: 'bold',
  },
}))
export default class ProServiceBulkPricePage extends React.Component {
  constructor(props) {
    super(props)
    const { proServices, isSetup } = props
    const initialValues = {}
    const queries = {}
    const psIds = Object.keys(proServices).sort((a, b) => proServices[b].reqCount - proServices[a].reqCount)
    this.automobileRepairAnnotation = ''
    for (const id of psIds) {
      const ps = proServices[id]
      if (ps.service.key === AUTOMOBILE_REPAIR_KEY) {
        this.automobileRepairAnnotation = `※${ps.service.name}を除く`
      }
      const showPV = showPriceValues(ps, isSetup)
      if (showPV) {
        queries[id] = getQueries({jobRequirements: ps.jobRequirements, service: ps.service})
        initialValues[id] = initializePriceValues(ps.priceValues, ps.chargesTravelFee)
      }
    }
    props.initialize(initialValues)
    this.state = {
      queries,
    }
    this.submitLabel = props.isSetup ? '更新して次へ' : '料金を更新する'
  }

  saveAndExit = values => this.submit(values).then(() => this.props.history.push('/account/services'))

  onSubmit = values => this.submit(values).then(this.props.next)

  submit = values => {
    const { warning, proServices } = this.props
    const data = {}
    for (const id in values) {
      if (proServices[id].service.key === AUTOMOBILE_REPAIR_KEY) {
        data[id] = {
          priceValues: [],
          chargesTravelFee: false,
          setupPriceValues: true,
        }
      }
      if (warning.includes(id)) continue
      const priceValues = parsePriceValues(values[id])
      data[id] = {
        priceValues,
        chargesTravelFee: values[id].chargesTravelFee,
        setupPriceValues: true,
      }
    }
    return this.props.updateMany(data)
  }

  confirmFinish = (values) => {
    if (this.props.warning.length) {
      this.setState({confirm: true})
    } else {
      this.onSubmit(values)
    }
  }

  afterConfirm = (values) => {
    return this.onSubmit(values)
  }

  onCloseDialog = () => this.setState({confirm: false})

  render () {
    const { proServices, handleSubmit, classes, submitting, location: { pathname }, warning = [], isSetup } = this.props

    const { queries, confirm } = this.state
    if (!queries) return null

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.confirmFinish)}>
        <ProServiceContainer
          stepper={this.props.isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={this.submitLabel}
          submitDisabled={submitting}
          back={this.props.back}
        >
          <h3 className={classes.title}>
            価格の設定
          </h3>
          <div className={classes.subText}>基本料金の記入は必須です。未記入の場合、指名を受けられません。{this.automobileRepairAnnotation}</div>
          <CampaignWarning />
          <div className={classes.sectionWrap}>
            {Object.keys(queries).map((id, idx, arr) => {
              const { baseQueries, discountQueries, addonQueries, hideTravelFee, singleBasePriceQuery } = queries[id]
              const service = proServices[id].service
              return (
                <React.Fragment key={id}>
                  <div className={classes.sectionRoot}>
                    <div className={classes.serviceName}>{service.name}</div>
                    <div>
                      <FormSection name={id}>
                        <PriceValuesSetting
                          baseQueries={baseQueries}
                          baseRequired={false}
                          discountQueries={discountQueries}
                          addonQueries={addonQueries}
                          singleBasePriceQuery={singleBasePriceQuery}
                          estimatePriceType={service.estimatePriceType}
                          allowsTravelFee={service.allowsTravelFee && !hideTravelFee}
                        />
                      </FormSection>
                    </div>
                  </div>
                  {idx !== arr.length - 1 && <Divider />}
                </React.Fragment>
              )
            })}
          </div>
        </ProServiceContainer>
        <Dialog open={confirm} onClose={this.onCloseDialog}>
          <DialogTitle>
            <div>入力が完了していません</div>
            <CampaignWarning />
          </DialogTitle>
          <DialogContent>
            <div>基本料金の入力が完了していない</div>
            {warning.map(id => <div className={classes.bold} key={id}>「{proServices[id].service.name}」</div>)}
            <div>の情報は保存されません。</div>
          </DialogContent>
          <DialogActions>
            <Button style={{minWidth: 120}} variant='outlined' onClick={this.onCloseDialog} disabled={submitting}>設定に戻る</Button>
            <Button style={{minWidth: 120}} variant='contained' color='primary' onClick={handleSubmit(this.afterConfirm)} disabled={submitting}>入力済サービスのみ保存して{isSetup ? '次へ' : '終了'}</Button>
          </DialogActions>
        </Dialog>
      </form>
    )
  }
}
