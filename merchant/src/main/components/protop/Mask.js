import React from 'react'
import { withStyles } from '@material-ui/core'

let Mask = ({onClick, classes}) => (
  <div className={classes.root} onClick={onClick} />
)

Mask = withStyles(() => ({
  root: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#2f3033',
    opacity: 0.8,
    position: 'fixed',
    top: 0,
    left: 0,
  },
}))(Mask)

export default Mask