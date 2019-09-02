import React from 'react'
import { withStyles } from '@material-ui/core'

let PointDisplay = ({point, classes}) => (
  <>
    <p className={classes.title}>利用ポイント</p>
    <div className={classes.point}>
      <p>{point || 0} pt</p>
    </div>
  </>
)

PointDisplay = withStyles(() => ({
  title: {
    fontSize: 13,
  },
  point: {
    fontSize: 26,
  },
}))(PointDisplay)

export default PointDisplay