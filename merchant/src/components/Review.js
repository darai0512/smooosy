import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import RatingStar from 'components/RatingStar'
import { relativeTime } from 'lib/date'

const Review = ({review, children, classes}) => (
  <div>
    <div className={classes.head}>
      <div>
        <p className={classes.name}>{review.username}様</p>
        <p>{review.service && review.service.name}</p>
      </div>
      <p>{relativeTime(new Date(review.createdAt))}</p>
    </div>
    <div className={classes.balloon}>
      <div className={classes.balloonBefore} />
      <div className={classes.balloonAfter} />
      <div className={classes.starWrap}>
        <div className={classes.stars}>
          <RatingStar rating={review.rating} />
        </div>
        <div className={classes.rating}>{review.rating}.0</div>
      </div>
      <p className={classes.text}>{review.text}</p>
      {review.reply &&
        <div className={classes.reply}>
          <span className={classes.replyName}>プロからの返信</span>
          <span className={classes.replyText}>{review.reply}</span>
        </div>
      }
      {children}
    </div>
  </div>
)

export default withStyles(theme => ({
  head: {
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 15,
  },
  balloon: {
    position: 'relative',
    margin: '12px 0 0',
    padding: 10,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 5,
    background: theme.palette.common.white,
  },
  balloonBefore: {
    position: 'absolute',
    display: 'block',
    top: -12,
    left: 24,
    width: 0,
    height: 0,
    borderBottom: `12px solid ${theme.palette.grey[300]}`,
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
  },
  balloonAfter: {
    position: 'absolute',
    display: 'block',
    top: -11,
    left: 24,
    width: 0,
    height: 0,
    borderBottom: `12px solid ${theme.palette.common.white}`,
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
  },
  text: {
    marginTop: 5,
    fontSize: 13,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  starWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  stars: {
    width: 100,
  },
  rating: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: 'bold',
  },
  reply: {
    marginTop: 10,
    borderRadius: 3,
    padding: 10,
    fontSize: 13,
    background: theme.palette.grey[200],
  },
  replyName: {
    color: theme.palette.grey[800],
    fontWeight: 'bold',
  },
  replyText: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
}))(Review)