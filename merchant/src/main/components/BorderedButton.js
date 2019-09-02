import React from 'react'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'

const BorderedButton = withTheme(({children, style, active, disabled, theme, ...custom}) => (
  <Button
    disabled={disabled}
    style={{
      ...style,
      background: disabled ? theme.palette.grey[100] : active ? theme.palette.primary.main : theme.palette.common.white,
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? theme.palette.grey[300] : active ? theme.palette.common.white : theme.palette.primary.main,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: active ? theme.palette.blue.A200 : theme.palette.grey[300],
    }}
    {...custom}
  >
    {children}
  </Button>
))

export default BorderedButton
