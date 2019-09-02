import React from 'react'
import { withStyles } from '@material-ui/core/styles'

const QueryCardHeader = ({ children, sub, helperText, classes }) => (
  <div className={classes.title}>
    {children}
    {sub && <p className={classes.textOption}>{sub}</p>}
    {helperText && <p className={classes.helperText}>{helperText}</p>}
  </div>
)

export default withStyles(theme => ({
  title: {
    padding: '16px 24px',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      padding: '12px 16px',
      fontSize: 20,
    },
  },
  textOption: {
    margin: '10px 10px 0',
    fontSize: 14,
  },
  helperText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.palette.grey[700],
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
    fontWeight: 'normal',
  },
}))(QueryCardHeader)
