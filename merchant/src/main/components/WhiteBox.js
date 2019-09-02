import React from 'react'
import { withStyles } from '@material-ui/core/styles'

let WhiteBox = ({
  title,
  className,
  titleClassName,
  classes,
  children,
}) => (
  <div className={[classes.root, className].join(' ')}>
    <div className={[classes.title, titleClassName].join(' ')}>{title}</div>
    {children}
  </div>
)

WhiteBox = withStyles(theme => ({
  root: {
    background: 'rgba(255, 255, 255, .75)',
    maxWidth: 500,
    margin: '20px 0',
    padding: 30,
    border: `1px solid ${theme.palette.grey[300]}`,
    zIndex: 10,
    [theme.breakpoints.down('xs')]: {
      maxWidth: '100%',
      margin: '0 auto',
      padding: 15,
    },
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.palette.grey[800],
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 12,
      fontSize: 16,
    },
  },
}))(WhiteBox)

export default WhiteBox
