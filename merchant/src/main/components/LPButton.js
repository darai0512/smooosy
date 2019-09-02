import React from 'react'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const LPButton = withStyles(theme => ({
  root: {
    margin: 20,
    height: 50,
    minWidth: 260,
    borderRadius: 6,
    boxShadow: `0 5px 0 ${theme.palette.primary.B400}`,
    position: 'relative',
    top: 0,
    transition: '100ms all linear',
    fontSize: 18,
    textShadow: '2px 2px rgba(0, 0, 0, .12)',
    '&:hover': {
      boxShadow: 'none',
      top: 5,
    },
  },
  disabled: {
    boxShadow: `0 5px 0 ${theme.palette.grey[500]}`,
  },
}))(({ children, classes, className, ...custom }) => {
  const rootClasses = [ 'LPButton', classes.root ]
  if (custom.disabled) rootClasses.push(classes.disabled)
  if (className !== undefined) {
    rootClasses.push(className)
  }

  return (
    <Button className={rootClasses.join(' ')} variant='contained' color='primary' {...custom}>
      {children}
    </Button>
  )
})

export default LPButton
