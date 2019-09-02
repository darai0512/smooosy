import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { generateContinuousMap, generateRangeMap } from 'lib/range'

@withStyles(theme => ({
  selector: {
    width: 170,
    height: 80,
    fontSize: 32,
    background: theme.palette.common.white,
    borderColor: theme.palette.grey[300],
    padding: 20,
    [theme.breakpoints.down('xs')]: {
      width: 190,
    },
  },
  unit: {
    fontSize: 16,
    marginLeft: 5,
  },
}))
export default class ValueSelector extends React.PureComponent {

  constructor(props) {
    super(props)

    this.state = {
      value: props.defaultValue,
    }
  }

  onChange = (e, valueMap) => {
    const mapVal = valueMap[e.target.value]

    this.setState({value: mapVal.value})

    if (this.props.stepSize) {
      this.props.onChange(mapVal.number, mapVal.range)
    } else {
      this.props.onChange(mapVal.number)
    }
  }

  render () {
    const {id, min = 0, max = 0, unit = '', stepSize, rootClass, classes} = this.props
    const {value} = this.state

    if (min > max) return null

    let valueMap

    if (stepSize) {
      valueMap = generateRangeMap(min, max, stepSize)
    } else {
      valueMap = generateContinuousMap(min, max)
    }

    return (
      <div className={rootClass}>
        <div>
          <select
            className={classes.selector}
            value={value}
            onChange={e => this.onChange(e, valueMap)}
            >
            {Object.values(valueMap).map((o, i) =>
              <option key={`${id}_${i}`} value={o.value}>
                {o.value}
              </option>
            )}
          </select>
          <span className={classes.unit}>{unit}</span>
        </div>
      </div>
    )
  }
}

