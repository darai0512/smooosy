import React from 'react'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import Checkbox from '@material-ui/core/Checkbox'
import Chip from '@material-ui/core/Chip'


export default class ServicePicker extends React.Component {
  handleChange = event => {
    if (this.props.onChange) {
      this.props.onChange(event.target.value)
    }
  };

  render() {
    const { serviceMap, selectedServiceIds, overrideClasses = {} } = this.props

    const classes = { ...this.props.classes, ...overrideClasses }

    return (
      <div>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor='select-multiple'>サービス</InputLabel>
          <Select
            multiple
            value={selectedServiceIds}
            onChange={this.handleChange}
            input={<Input id='select-multiple-chip' />}
            renderValue={selectedIds => (
              <div>
                {selectedIds.map(_id => (
                  <Chip key={serviceMap[_id].name} label={`${serviceMap[_id].name} (${serviceMap[_id].requestCount})`} />
                ))}
              </div>
            )}
          >
            {Object.values(serviceMap).map(service => (
              <MenuItem key={service._id} value={service._id}>
                <Checkbox
                  checked={
                    !!selectedServiceIds.find(
                      s => s === service._id
                    )
                  }
                />
                {service.name} ({service.requestCount})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    )
  }
}
