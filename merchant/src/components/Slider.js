import React from 'react'
import { withStyles } from '@material-ui/core/styles'

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
  disabled: {
    '&::-webkit-slider-thumb': {
      backgroundColor: theme.palette.grey[300],
    },
    '&::-moz-range-thumb': {
      backgroundColor: theme.palette.grey[300],
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
  },
  unit: {
    fontSize: 16,
    marginLeft: 5,
  },
}))
export default class Slider extends React.Component {
  static defaultProps = {
    step: 1,
    disabled: false,
  }

  onChange = (e) => {
    const value = e.target.value
    this.props.onChange && this.props.onChange(value)
  }

  render () {
    const { min, max, step, disabled, value, classes } = this.props

    return (
      <input
        disabled={disabled}
        className={[classes.slider, disabled ? classes.disabled : ''].join(' ')}
        value={value}
        min={min}
        max={max}
        step={step}
        type='range'
        onChange={this.onChange}
      />
    )
  }
}
