import React from 'react'
import { FormControl, RadioGroup } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'


const renderRadioGroup = withTheme(({label, input: { value, onChange }, children, hidden, theme, ...custom}) => {
  const { grey } = theme.palette

  return (
    <FormControl style={{display: hidden ? 'none' : 'block'}}>
      <div style={{display: 'flex', alignItems: 'center'}}>
        {label && <div style={{flex: 1, fontSize: 13, fontWeight: 'bold', color: grey[700]}}>{label}</div>}
      </div>
      <RadioGroup
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        {...custom}
      >
        {children}
      </RadioGroup>
    </FormControl>
  )
})

export default renderRadioGroup
