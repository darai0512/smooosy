import React from 'react'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import Review from 'components/Review'
import ReviewStat from 'components/ReviewStat'

const ReviewList = ({classes, reviewListRef, averageRating, reviews, readMore, onClickReadMore}) => (
  <div ref={reviewListRef} className={classes.backgroundWhite}>
    <h2 className={classes.title}>クチコミ</h2>
    <ReviewStat className={classes.rating} averageRating={averageRating} reviews={reviews} />
    <div className={classes.reviews}>
      {reviews.slice(0, 5).map(r =>
        <div key={r.id} className={classes.review}><Review review={r} /></div>
      )}
      {reviews.length > 5 &&
        <div>
          {!readMore && <Button className={classes.readMoreButton} onClick={onClickReadMore} >さらに読む</Button>}
          {readMore && reviews.slice(5).map(r =>
            <div key={r.id} className={classes.review}><Review review={r} /></div>
          )}
        </div>
      }
    </div>
  </div>
)

export default withStyles(theme => ({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: '10px 0',
  },
  backgroundWhite: {
    background: theme.palette.common.white,
  },
  rating: {
    marginBottom: 10,
  },
  reviews: {
    width: '100%',
    margin: '0 auto',
    marginBottom: 60,
  },
  review: {
    margin: '30px 0',
  },
  readMoreButton: {
    width: '100%',
  },
}))(ReviewList)
