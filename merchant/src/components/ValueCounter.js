import React from 'react'
import { withWidth } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import NumberInput from 'components/form/renderNumberInput'
import AddIcon from '@material-ui/icons/Add'
import RemoveIcon from '@material-ui/icons/Remove'


@withWidth()
@withStyles(theme => ({
  counter: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 32,
    marginLeft: 20,
    marginRight: 20,
  },
  button: {
    color: theme.palette.common.white,
    minWidth: 50,
    height: 50,
    padding: 0,
  },
  unit: {
    fontSize: 16,
    marginLeft: 5,
  },
}))
export default class ValueCounter extends React.PureComponent {

  constructor (props) {
    super(props)
    this.state = { value: props.defaultValue }
  }

  countDown = () => {
    const value = Math.max(this.props.min, this.state.value - 1)
    this.setState({value})
    this.props.onChange(value)
  }

  countUp = () => {
    const value = Math.min(this.props.max, this.state.value + 1)
    this.setState({value})
    this.props.onChange(value)
  }

  onChangeInput = (e) => {
    if (isNaN(Number(e.target.value))) return
    const { min, max } = this.props
    const value = Math.min(max, Math.max(min, Number(e.target.value)))
    if (value !== this.state.value) {
      this.setState({value})
      this.props.onChange(value)
    }
  }

  render () {
    const { min = 0, max = 0, unit = '', rootClass, classes, width } = this.props
    const { value } = this.state

    return (
      <div className={rootClass}>
        <div className={classes.counter}>
          <Button className={classes.button} size='medium' color='primary' variant='contained' onClick={this.countDown} disabled={value === min}><RemoveIcon /></Button>
          <div className={classes.input}>
            <NumberInput
              type={width === 'xs' ? 'tel' : 'number'}
              style={{width: 80}}
              inputStyle={{height: 80, textAlign: 'center', fontSize: 32}}
              hideError
              value={value}
              min={min}
              max={max}
              onChange={this.onChangeInput} />
            <span className={classes.unit}>{unit}</span>
          </div>
          <Button className={classes.button} size='medium' color='primary' variant='contained' onClick={this.countUp} disabled={value === max}><AddIcon /></Button>
        </div>
      </div>
    )
  }
}