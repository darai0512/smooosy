import React from 'react'
import { Checkbox, FormControlLabel } from '@material-ui/core'

const renderCheckbox = ({label, input, meta, labelStyle, labelClass, children, ...custom}) => {
  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            color='primary'
            checked={!!input.value}
            onChange={(event, checked) => input.onChange(checked)}
            {...custom}
          />
        }
        className={labelClass}
        style={labelStyle}
        label={label}
      />
      {children && children(input.value)}
    </>
  )
}

export default renderCheckbox