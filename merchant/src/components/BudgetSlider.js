import React from 'react'
import { withStyles } from '@material-ui/core'
import Slider from 'components/Slider'

import { getEstimateAcquisition } from 'lib/proService'

export default class BudgetSlider extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: props.defaultValue,
      estimateAcquisition: null,
    }

    if (props.service) {
      const { budgetMin, budgetMax } = props.service
      this.state.value = Math.max(budgetMin, Math.min(budgetMax, props.defaultValue))
      this.state.estimateAcquisition = getEstimateAcquisition({service: props.service, budget: this.state.value})
      props.onChange && props.onChange(this.state.value)
    }
  }

  onChange = (value) => {
    // プロ設定値ポイント
    const estimateAcquisition = getEstimateAcquisition({service: this.props.service, budget: value})
    this.setState({value, estimateAcquisition})
    this.props.onChange && this.props.onChange(value)
  }

  render () {
    const { service, disabled, classes, isSetup } = this.props
    const { value, estimateAcquisition } = this.state

    return (
      <BudgetSliderComponent
        service={service}
        disabled={disabled}
        classes={classes}
        isSetup={isSetup}
        onChange={this.onChange}
        value={value}
        estimateAcquisition={estimateAcquisition}
      />
    )
  }
}

export const BudgetSliderComponent = withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  values: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  budget: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  aquisition: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  red: {
    color: theme.palette.red[500],
  },
  sub: {
    fontSize: 16,
    color: theme.palette.grey[500],
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  attention: {
    marginTop: 10,
    fontSize: 12,
    color: theme.palette.grey[500],
  },
}))(({classes, value, estimateAcquisition, service, isSetup, disabled, onChange}) => {
  return (
    <div className={classes.root}>
      <div className={classes.values}>
        <div>
          <div className={classes.budget}>予算{value}pt</div>
          <div className={classes.sub}>一週間の最大利用ポイント数</div>
        </div>
        {estimateAcquisition &&
          <div>
            <div className={[classes.aquisition, estimateAcquisition.min === 0 ? classes.red : ''].join(' ')}>
              {estimateAcquisition.min !== estimateAcquisition.max && `${estimateAcquisition.min}-`}{estimateAcquisition.max}件
            </div>
            <div className={classes.sub}>推定ご指名数</div>
          </div>
        }
      </div>
      <Slider value={value} step={5} min={service.budgetMin} max={service.budgetMax} onChange={onChange} disabled={disabled} />
      {isSetup &&
        <div className={classes.attention}>
          ラクラクお得モードはONになります。サービスごとの設定画面から切り替えが可能です。
        </div>
      }
    </div>
  )
})