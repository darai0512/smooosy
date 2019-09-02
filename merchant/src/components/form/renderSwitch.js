import React from 'react'
import { FormControlLabel, Switch } from '@material-ui/core'

const renderSwitch = ({input, label, style, ...custom}) => {
  return (
    <FormControlLabel
      label={label}
      style={style}
      control={<Switch color='primary' checked={input.value} onChange={(e, bool) => input.onChange(bool)} />}
      {...custom}
    />
  )
}

export default renderSwitch