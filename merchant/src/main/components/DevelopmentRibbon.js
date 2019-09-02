import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { purple } from '@material-ui/core/colors'

const DevelopmentRibbon = ({classes}) => (
  <div className={classes.ribbon}>
    <div className={classes.ribbonText}>開発環境</div>
  </div>
)

export default withStyles(theme => ({
  ribbon: {
    position: 'fixed',
    bottom: 10,
    left: 20,
    width: 500,
    padding: 2,
    margin: '-12px 0 0 -250px',
    fontSize: 12,
    textAlign: 'center',
    color: theme.palette.common.white,
    background: purple[700],
    transform: 'rotate(45deg)',
    zIndex: 2000,
  },
  ribbonText: {
    padding: 3,
    border: `1px dashed ${purple[200]}`,
  },
}))(DevelopmentRibbon)
