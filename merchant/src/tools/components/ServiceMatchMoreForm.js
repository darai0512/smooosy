import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray, FormSection, formValueSelector } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'
import { Button, Radio, FormControlLabel } from '@material-ui/core'

import { update as updateService } from 'tools/modules/service'
import { open as openSnack } from 'tools/modules/snack'
import PriceToPointGraph from 'tools/components/PriceToPointGraph'
import renderPricesToPoints from 'tools/components/form/renderPricesToPoints'
import positiveNumberValidate from 'tools/components/form/positiveNumberValidate'
import renderSwitch from 'components/form/renderSwitch'
import renderRadioGroup from 'components/form/renderRadioGroup'
import renderNumberInput from 'components/form/renderNumberInput'
import JobRequirement from 'components/JobRequirement'
import PriceValuesSetting from 'components/PriceValuesSetting'
import { initializePriceValues, parsePriceValues, getQueries } from 'lib/proService'
import renderTextInput from 'components/form/renderTextInput'

const selector = formValueSelector('serviceMatchMoreForm')

function validatePricesToPoints(pricesToPoints) {
  let errors = []

  for (let i = 0; i < pricesToPoints.length; ++i) {
    const error = {}

    let curr = pricesToPoints[i], prev

    if (i > 0) {
      prev = pricesToPoints[i - 1]
    }

    if (prev) {
      if (parseFloat(curr.price) <= parseFloat(prev.price)) {
        error.price = 'price must increase'
      }

      if (parseFloat(curr.points) <= parseFloat(prev.points)) {
        error.points = 'point cost must increase'
      }
    }

    errors.push(error)
  }

  return errors
}

@connect(
  state => ({
    matchMoreEditable: selector(state, 'matchMoreEditable'),
    priceValues: selector(state, 'priceValues'),
    pricesToPoints: selector(state, 'pricesToPoints'),
    estimatePriceType: selector(state, 'estimatePriceType'),
  }),
  { updateService, openSnack }
)
@reduxForm({
  form: 'serviceMatchMoreForm',
  validate: values => {
    const errors = {}
    if (values.budgetMin) {
      errors.budgetMin = positiveNumberValidate(values.budgetMin)
    }
    if (values.budgetMax) {
      errors.budgetMax = positiveNumberValidate(values.budgetMax)
    }

    if (values.budgetMin && values.budgetMax) {
      if (parseFloat(values.budgetMin) % 5 !== 0) {
        errors.budgetMin = '5の倍数にしてください'
      }
      if (parseFloat(values.budgetMax) % 5 !== 0) {
        errors.budgetMax = '5の倍数にしてください'
      }
      if (parseFloat(values.budgetMax) < parseFloat(values.budgetMin)) {
        errors.budgetMin = '最大値より大きい値です'
      }
    }

    if (values.maxPointCost) {
      errors.maxPointCost = positiveNumberValidate(values.maxPointCost)
    }

    if (values.pricesToPoints) {
      errors.pricesToPoints = validatePricesToPoints(values.pricesToPoints)
    }

    return errors
  },
})
@withStyles(theme => ({
  root: {
    padding: 10,
  },
  section: {
    marginBottom: 10,
  },
  error: {
    fontWeight: 'bold',
    color: theme.palette.red[500],
  },
  budget: {
    display: 'flex',
  },
}))
export default class ServiceMatchMoreForm extends React.Component {
  constructor(props) {
    super(props)
    const { service } = props

    const {
      baseQueries,
      discountQueries,
      addonQueries,
      singleBasePriceQuery,
    } = getQueries({jobRequirements: [], service})

    this.state = {
      baseQueries,
      discountQueries,
      addonQueries,
      singleBasePriceQuery,
    }

    const priceValues = initializePriceValues(props.service.priceValues, false)
    delete priceValues.travelFee

    props.initialize({
      ...props.initialValues,
      priceValues,
    })
  }

  submit = values => {
    const data = {
      id: values.id,
      allowsTravelFee: values.allowsTravelFee,
      matchMoreEditable: values.matchMoreEditable,
      matchMoreEnabled: values.matchMoreEnabled,
      budgetMin: Math.floor(values.budgetMin),
      budgetMax: Math.floor(values.budgetMax),
      maxPointCost: values.maxPointCost,
      estimatePriceType: values.estimatePriceType,
      usePriceValueBudget: values.usePriceValueBudget,
      priceValues: parsePriceValues(values.priceValues),
      pricesToPoints: values.pricesToPoints,
      instantResultAnnotation: values.instantResultAnnotation,
    }

    return this.props.updateService(data)
      .then(() => this.props.openSnack('保存しました'))
  }

  render() {
    const { pricesToPoints, matchMoreEditable, estimatePriceType, handleSubmit, submitting, classes } = this.props
    const { baseQueries, discountQueries, addonQueries, singleBasePriceQuery } = this.state
    const jobRequirements = this.props.initialValues.jobRequirements.filter(jr => jr.query.usedForPro && jr.query.options.length > 0)

    const saveDisabled = (
      submitting || matchMoreEditable && jobRequirements.length === 0
    )

    return (
      <form className={classes.root}>
        <Field name='instantResultAnnotation' label='ご指名検索ページ注釈' component={renderTextInput} />
        <Field name='matchMoreEditable' label='プロ向けリリース' component={renderSwitch} />
        {matchMoreEditable &&
          <Field name='matchMoreEnabled' label='依頼者向けリリース' component={renderSwitch} />
        }
        <div className={classes.section}>
          <h3>プロの仕事条件</h3>
          質問マスターで設定してください
          {jobRequirements.length > 0 ?
            <details>
              <summary>プレビュー</summary>
              {jobRequirements.map((jr, i) =>
                <JobRequirement key={i} jobRequirement={jr} disabled />
              )}
            </details>
          :
            <div className={classes.error}>質問が設定されていません！</div>
          }
        </div>
        <div className={classes.section}>
          <h3>料金設定</h3>
          <Field name='usePriceValueBudget' label='SMOOOSYが予算を設定する' component={renderSwitch} />
          <Field row name='estimatePriceType' component={renderRadioGroup} label='価格設定タイプ'>
            <FormControlLabel control={<Radio color='primary' />} value='fixed' label='通常' />
            <FormControlLabel control={<Radio color='primary' />} value='float' label='概算' />
            <FormControlLabel control={<Radio color='primary' />} value='minimum' label='XX円〜' />
          </Field>
          <Field name='allowsTravelFee' label='プロが交通費を設定可能' component={renderSwitch} />
          <FormSection name='priceValues'>
            <PriceValuesSetting
              baseQueries={baseQueries}
              discountQueries={discountQueries}
              addonQueries={addonQueries}
              singleBasePriceQuery={singleBasePriceQuery}
              estimatePriceType={estimatePriceType}
            />
          </FormSection>
          <h3>予算設定</h3>
          <div className={classes.budget}>
            <Field inputStyle={{width: 150, marginRight: 5}} name='budgetMin' label='予算の最小値(pt)' component={renderNumberInput} step={5} />
            <Field inputStyle={{width: 150, marginRight: 5}} name='budgetMax' label='予算の最大値(pt)' component={renderNumberInput} step={5} />
            <Field inputStyle={{width: 150, marginRight: 5}} name='maxPointCost' label='ポイント上限(pt)' type='number' component={renderNumberInput} step={1} />
          </div>
          <div>
            <h4>Price to points</h4>
            <FieldArray name='pricesToPoints' component={renderPricesToPoints} classes={classes} />
            {pricesToPoints && pricesToPoints.length > 1 && <PriceToPointGraph
              width={500}
              height={400}
              pricesToPoints={pricesToPoints}
            />}
          </div>
        </div>
        <div>
          <Button disabled={saveDisabled} variant='contained' color='secondary' style={{marginTop: 10}} onClick={handleSubmit(this.submit)}>
            保存する
          </Button>
        </div>
      </form>
    )
  }
}
