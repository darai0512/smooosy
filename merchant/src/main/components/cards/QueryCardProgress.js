import React from 'react'
import { LinearProgress } from '@material-ui/core'
import { withStyles } from '@material-ui/core'

const QueryCardProgress = ({value, classes}) => (
  <div className={classes.root}>
    <LinearProgress variant='determinate' value={value} className={classes.progress} />
    {value >= 50 && <div>{value}%完了</div>}
  </div>
)

export default withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    margin: '20px auto',
    width: '60%',
    height: 8,
    borderRadius: 4,
    background: theme.palette.grey[300],
  },
}))(QueryCardProgress)
