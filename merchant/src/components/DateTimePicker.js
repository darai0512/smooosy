import React from 'react'
import { TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const DateTimePicker = withStyles(theme => ({
  root: {
    marginBottom: 10,
    marginTop: 5,
  },
  label: {
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
  input: {
    border: `1px solid ${theme.palette.grey[300]}`,
    width: 240,
    height: 21,
    borderRadius: 4,
    paddingLeft: 10,
    paddingTop: 10,
    '&:focus': {
      borderColor: theme.palette.blue.B200,
    },
  },
}))(({input, type, meta, classes, label, ...custom}) => {
  type = type || 'date-local'
  const err = meta && meta.touched && meta.error
  return <TextField
    label={
      <label className={classes.label}>{label}</label>
    }
    classes={{root: classes.root}}
    type={type}
    InputProps={{
      disableUnderline: true,
      classes: {
        input: classes.input,
      },
    }}
    inputProps={input}
    InputLabelProps={{shrink: true}}
    error={err} {...custom}
  />
})

export default DateTimePicker