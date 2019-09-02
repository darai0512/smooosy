import React from 'react'
import { Avatar } from '@material-ui/core'
import { withStyles } from '@material-ui/core'

let Finger = ({classFinger, classOne, classes}) => (
  <div className={classes.icon}>
    <Avatar className={[classes.finger, classFinger].join(' ')} src='/images/finger.png' />
    <div className={[classes.one, classOne].join(' ')}>1</div>
  </div>
)

Finger = withStyles(theme => ({
  icon: {
    position: 'relative',
    transform: 'rotateZ(15deg)',
  },
  finger: {
    background: 'rgb(221, 241, 246)',
  },
  one: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: 40,
    height: 40,
    fontSize: 16,
    top: 3,
    left: -3,
    color: theme.palette.common.white,
  },
}))(Finger)

export default Finger