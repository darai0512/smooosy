import React from 'react'
import { withStyles } from '@material-ui/core'
import { FormControl, FormHelperText, Input, InputLabel, Select } from '@material-ui/core'
import AlertWarning from '@material-ui/icons/Warning'
import { red } from '@material-ui/core/colors'

let renderSelect = ({ onFieldChange, label, input: { name, value, onChange }, meta, children, classes, ...custom }) => (
  <FormControl className={classes.root} error={meta && meta.touched && !!meta.error} {...custom}>
    {label && <InputLabel htmlFor={name}>{label}</InputLabel>}
    <Select
      value={value}
      onChange={event => {
        onChange(event.target.value)
        onFieldChange && onFieldChange(event.target.value)
      }}
      input={<Input id={name} />}
    >
      {children}
    </Select>
    {meta && meta.touched && meta.error && <FormHelperText className={classes.errorText}><AlertWarning className={classes.errorIcon} />{meta.error}</FormHelperText>}
  </FormControl>
)

renderSelect = withStyles(() => ({
  root: {
    minWidth: 150,
  },
  errorText: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  errorIcon: {
    marginTop: -3,
    width: 18,
    height: 18,
    color: red[500],
  },
}))(renderSelect)

export default renderSelect