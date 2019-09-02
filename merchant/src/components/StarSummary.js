import React from 'react'
import { withStyles } from '@material-ui/core'
import ToggleStar from '@material-ui/icons/Star'
import { amber } from '@material-ui/core/colors'

let StarSummary = props => {
  const { ratingAverage, reviewCount, classes } = props

  return (
    <div className={classes.starBase}>
      <div className={classes.starWrap}>
        <div className={classes.ratingAverage}>{Number.parseFloat(ratingAverage).toFixed(1)}</div>
        <ToggleStar className={classes.star} />
        <div className={classes.reviewCount}>{`(${reviewCount})`}</div>
      </div>
    </div>
  )
}

StarSummary = withStyles(theme => ({
  starBase: {
    width: '100%',
    padding: '10%',
    position: 'relative',
  },
  starWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
  },
  ratingAverage: {
    fontSize: 20,
    color: amber[500],
  },
  reviewCount: {
    fontSize: 20,
    color: theme.palette.grey[500],
  },
  star: {
    height: 'auto',
    maxHeight: '100%',
    color: amber[500],
  },
}))(StarSummary)

export default StarSummary