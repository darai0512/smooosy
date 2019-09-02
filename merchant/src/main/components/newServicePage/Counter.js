import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/Add'
import RemoveIcon from '@material-ui/icons/Remove'

@withStyles(theme => ({
  counter: {
    display: 'flex',
    alignItems: 'center',
    width: 40,
  },
  column: {
    flexDirection: 'column-reverse',
  },
  inputWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 40,
    width: '100%',
    textAlign: 'center',
    fontSize: 32,
  },
  button: {
    color: theme.palette.primary.main,
    width: '100%',
    height: 30,
    padding: 0,
    minWidth: 0,
  },
  unit: {
    fontSize: 16,
    marginLeft: 5,
  },
}))
export default class Counter extends React.PureComponent {
  countDown = () => {
    const { max, min, step = 1, loop, value } = this.props
    let newValue = value - step
    if (min > newValue) {
      if (loop) {
        newValue = max
      } else {
        newValue = min
      }
    }
    this.props.onChange(newValue)
  }

  countUp = () => {
    const { max, min, step = 1, loop, value } = this.props
    let newValue = value + step
    if (max < newValue) {
      if (loop) {
        newValue = min
      } else {
        newValue = max
      }
    }
    this.props.onChange(newValue)
  }

  render () {
    const { min = 0, max = 0, unit = '', customClasses = {}, children = value => value, classes, downIcon: DownIcon = RemoveIcon, upIcon: UpIcon = AddIcon, buttonProps, column, loop, value } = this.props

    return (
      <div className={customClasses.root}>
        <div className={[classes.counter, customClasses.counter, column ? classes.column : ''].join(' ')}>
          <Button
            className={[classes.button, customClasses.button].join(' ')}
            onClick={this.countDown}
            disabled={!loop && value <= min}
            {...buttonProps}
          >
            <DownIcon />
          </Button>
          <div className={classes.inputWrap}>
            <div className={[classes.input, customClasses.input].join(' ')}>{children(value)}</div>
            {unit && <span className={[classes.unit, customClasses.unit].join(' ')}>{unit}</span>}
          </div>
          <Button
            className={[classes.button, customClasses.button].join(' ')}
            onClick={this.countUp}
            disabled={!loop && value >= max}
          >
            <UpIcon />
          </Button>
        </div>
      </div>
    )
  }
}