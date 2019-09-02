import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import japaneseNumber from 'lib/japaneseNumber'

const minPos = 0
const maxPos = 100

@withStyles(theme => ({
  slider: {
    marginBottom: 20,
    overscrollBehavior: 'contain',
    appearance: 'none',
    backgroundColor: '#eaeaea',
    height: 2,
    width: '100%',
    borderRadius: 6,
    '&:focus': {
      outline: 'none',
    },
    '&:active': {
      outline: 'none',
    },
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      cursor: 'pointer',
      position: 'relative',
      width: 32,
      height: 32,
      display: 'block',
      backgroundColor: theme.palette.primary.main,
      border: 'none',
      borderRadius: '50%',
    },
    '&::-ms-tooltip': {
      display: 'none',
    },
    '&::-moz-range-track': {
      height: 0,
    },
    '&::-moz-range-thumb': {
      appearance: 'none',
      cursor: 'pointer',
      position: 'relative',
      width: 32,
      height: 32,
      display: 'block',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '50%',
    },
  },
  values: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    margin: '10px 0 15px',
  },
  input: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
  },
  number: {
    fontSize: 32,
    height: 42,
  },
  unit: {
    fontSize: 16,
    marginLeft: 5,
  },
}))
export default class LogisticalSlider extends React.PureComponent {

  constructor(props) {
    super(props)
    const { defaultValue } = props
    this.state = {}

    if (defaultValue) {
      this.position = this.calcLogisticInverse(defaultValue)
      this.state.value = defaultValue
    } else {
      // 真ん中の値を設定
      this.position = (maxPos + minPos) / 2
      this.state.value = this.calcLogistic(this.position)
      props.onChange(this.state.value) // 親に通知
    }
  }

  calcLogistic = position => {
    const { min, max } = this.props
    const minv = Math.log(min < 1 ? 1 : min)
    const maxv = Math.log(max < 1 ? 1 : max)
    const scale = (maxv - minv) / (maxPos - minPos)
    const value = Math.exp(minv + scale * position)
    const digit = Math.pow(10, Math.floor(Math.floor(value).toString().length - 1)) / 2
    const result = Math.round(Math.round(value / digit) * digit)
    return result
  }

  calcLogisticInverse = value => {
    const { min, max } = this.props
    const minv = Math.log(min < 1 ? 1 : min)
    const maxv = Math.log(max < 1 ? 1 : max)
    const scale = (maxv - minv) / (maxPos - minPos)
    const position = (Math.log(value) - minv) / scale
    return position
  }

  onChangeSlider = (e) => {
    const position = e.target.value
    if (position === this.position) return
    this.position = position
    const value = this.calcLogistic(Number(position))
    if (value !== this.state.value) {
      this.setState({value})
      this.props.onChange(value)
    }
  }

  render () {
    const { min, max, unit = '', rootClass, classes } = this.props
    const { value } = this.state

    if (!min || !max) return null

    return (
      <div className={rootClass}>
        <div className={classes.input}>
          <span className={classes.number}>{japaneseNumber(value).format()}<span className={classes.unit}>{unit}</span></span>
        </div>
        <div className={classes.values}>
          <div>{japaneseNumber(min).format()}{unit}</div>
          <div>{japaneseNumber(max).format()}{unit}</div>
        </div>
        <input
          className={classes.slider}
          value={this.calcLogisticInverse(value)}
          min={minPos}
          max={maxPos}
          type='range'
          onChange={this.onChangeSlider}
        />
      </div>
    )
  }
}