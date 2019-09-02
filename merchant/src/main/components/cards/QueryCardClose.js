import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import NavigationClose from '@material-ui/icons/Close'

const QueryCardClose = ({classes, className, onClose}) => {
  const rootClasses = [ classes.close ]
  if (className) rootClasses.push(className)

  return (
    <NavigationClose className={rootClasses.join(' ')}  onClick={onClose} />
  )
}

export default withStyles({
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    color: 'rgba(0, 0, 0, 0.05)',
  },
})(QueryCardClose)
