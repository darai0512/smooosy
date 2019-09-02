import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'

import { update as updateProService } from 'modules/proService'
import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice//ProServiceProgress'
import PriceValuesSetting from 'components/PriceValuesSetting'

import { initializePriceValues, parsePriceValues, getQueries, validateTravelFee } from 'lib/proService'

@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '20px 0',
    color: theme.palette.grey[800],
  },
}))
@connect(
  state => ({
    proService: state.proService.proService,
  }),
  { updateProService }
)
@reduxForm({
  form: 'proServicePrice',
  validate: (values) => {
    const errors = {}
    errors.travelFee = validateTravelFee(values.travelFee)
    return errors
  },
})
export default class ProServicePricePage extends React.Component {
  constructor(props) {
    super(props)

    const {
      location: { pathname },
      proService: { priceValues, jobRequirements, service },
      match: { params: { id } },
    } = props

    const isSetup = /setup\-services/.test(pathname)
    const {
      baseQueries,
      discountQueries,
      addonQueries,
      hideTravelFee,
      singleBasePriceQuery,
    } = getQueries({jobRequirements, service})

    this.state = {
      prevPage: isSetup ? `/setup-services/${id}/job-requirements` : `/account/services/${id}`,
      nextPage: isSetup ? `/setup-services/${id}/promo` : `/account/services/${id}`,
      submitLabel: isSetup ? '更新して次へ' : '料金を更新する',
      passLabel: isSetup ? '設定せず次へ' : '設定せず終了',
      // If there are two base, singular type should come first.
      baseQueries,
      discountQueries,
      addonQueries,
      hideTravelFee,
      singleBasePriceQuery,
    }

    props.initialize(
      initializePriceValues(priceValues, props.proService.chargesTravelFee)
    )
  }

  saveAndExit = () => {
    return this.props.history.push('/account/services')
  }

  onSubmit = values => {
    return this.submit(values).then(() => this.props.history.push(this.state.nextPage))
  }

  pass = () => {
    return this.props.updateProService(this.props.match.params.id, {setupPriceValues: true})
      .then(() => this.props.history.push(this.state.nextPage))
  }

  submit = values => {
    const priceValues = parsePriceValues(values)

    return this.props.updateProService(
      this.props.match.params.id,
      {
        priceValues,
        setupPriceValues: true,
        chargesTravelFee: values.chargesTravelFee,
      }
    )
  }

  render () {
    const { location: { pathname }, proService, handleSubmit, classes } = this.props
    const { submitLabel, passLabel, prevPage, baseQueries, discountQueries, addonQueries, hideTravelFee, singleBasePriceQuery } = this.state
    const service = proService.service
    const isSetup = /setup\-services/.test(pathname)

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={this.saveAndExit} label='あとで設定' /> : null}
          submitLabel={submitLabel}
          prevPage={prevPage}
          passLabel={service.key === 'automobile-body-repair-and-paint' && passLabel}
          pass={this.pass}
        >
          <h3 className={classes.title}>
            {service.name}の料金を設定しましょう
          </h3>
          <PriceValuesSetting
            baseQueries={baseQueries}
            discountQueries={discountQueries}
            addonQueries={addonQueries}
            singleBasePriceQuery={singleBasePriceQuery}
            estimatePriceType={service.estimatePriceType}
            allowsTravelFee={service.allowsTravelFee && !hideTravelFee}
          />
        </ProServiceContainer>
      </form>
    )
  }
}
