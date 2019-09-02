import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import RatingStar from 'components/RatingStar'
import ReadMore from 'components/ReadMore'
import { relativeTime } from 'lib/date'

let SimpleReview = ({review, classes, className}) => (
  <div className={[classes.root, className].join(' ')}>
    <div className={classes.head}>
      <div className={classes.star}><RatingStar rating={review.rating} /></div>
      <div className={classes.grey}>{review.username}様</div>
      <div className={classes.flex} />
      <div className={classes.grey}>{relativeTime(new Date(review.createdAt))}</div>
    </div>
    <div className={classes.text}>
      <ReadMore name={review.id} toggleClass={classes.readmore}>{review.text}</ReadMore>
    </div>
  </div>
)

SimpleReview = withStyles(theme => ({
  root: {
    background: theme.palette.grey[200],
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  head: {
    display: 'flex',
  },
  flex: {
    flex: 1,
  },
  star: {
    width: 100,
    marginRight: 10,
  },
  grey: {
    fontSize: 14,
    color: theme.palette.grey[700],
  },
  text: {
    fontSize: 14,
  },
  readmore: {
    background: theme.palette.grey[200],
    boxShadow: `-20px 0px 20px 0px ${theme.palette.grey[200]}`,
  },
}))(SimpleReview)

export default SimpleReview
