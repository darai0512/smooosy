import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'

const styles = theme => ({
  formControl: {
    margin: theme.spacing(),
    minWidth: 120,
    maxWidth: 500,
  },
})

const distances = [
  {
    name: '5kmまで',
    maxDistance: 5000,
  },
  {
    name: '10kmまで',
    maxDistance: 10000,
  },
  {
    name: '25kmまで',
    maxDistance: 25000,
  },
  {
    name: '50kmまで',
    maxDistance: 50000,
  },
]

class DistancePicker extends React.Component {
  state = {};

  handleChange = event => {
    if (this.props.onChange) {
      this.props.onChange(event.target.value)
    }
  };

  render() {
    const { distance, overrideClasses = {} } = this.props

    const classes = { ...this.props.classes, ...overrideClasses }

    return (
      <div>
        <FormControl className={classes.formControl}>
          <InputLabel shrink={!!distance} htmlFor='select-distance'>距離</InputLabel>
          <Select
            inputProps={{
              name: 'distance',
              id: 'select-distance',
            }}
            value={distance}
            onChange={this.handleChange}
          >
            {distances.map(distance => (
              <MenuItem key={distance.maxDistance} value={distance.maxDistance}>{distance.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    )
  }
}

export default withStyles(styles)(DistancePicker)
