import React from 'react'
import RatingStar from 'components/RatingStar'
import StarIcon from '@material-ui/icons/Star'
import withStylesWithProps from 'components/withStylesWithProps'
import { amber } from '@material-ui/core/colors'

@withStylesWithProps((theme, props) => ({
  root: {
    display: 'flex',
  },
  stars: {
    width: 150,
    [theme.breakpoints.down('xs')]: {
      width: 120,
    },
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 28,
    },
  },
  rating: {
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 5,
  },
  count: {
    marginTop: 10,
    marginLeft: 5,
    fontSize: 14,
  },
  separate: {
    width: 2,
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
    marginLeft: 20,
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 5,
      marginRight: 5,
    },
  },
  barWrap: {
    flex: 1,
  },
  number: {
    width: 10,
  },
  star: {
    color: theme.palette.grey[500],
    width: 16,
    height: 16,
    marginRight: 10,
    [theme.breakpoints.down('xs')]: {
      marginRight: 5,
    },
  },
  bar: {
    flex: 1,
    maxWidth: 150,
    position: 'relative',
    marginRight: 10,
    [theme.breakpoints.down('xs')]: {
      marginRight: 5,
    },
  },
  barEmpty: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    background: theme.palette.grey[500],
  },
  barFill: {
    width: 0,
    height: 10,
    borderRadius: 5,
    background: amber[700],
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  parcent: {
    textAlign: 'right',
    width: 40,
  },
  fill5: {
    width: `${100 * props.reviews.filter(r => r.rating === 5).length / props.reviews.length}%`,
  },
  fill4: {
    width: `${100 * props.reviews.filter(r => r.rating === 4).length / props.reviews.length}%`,
  },
  fill3: {
    width: `${100 * props.reviews.filter(r => r.rating === 3).length / props.reviews.length}%`,
  },
  fill2: {
    width: `${100 * props.reviews.filter(r => r.rating === 2).length / props.reviews.length}%`,
  },
  fill1: {
    width: `${100 * props.reviews.filter(r => r.rating === 1).length / props.reviews.length}%`,
  },
}))
class ReviewStat extends React.PureComponent {

  render() {
    const {classes, className, averageRating, reviews} = this.props

    return (
      <div className={[classes.root, className].join(' ')}>
        <div>
          <div className={classes.averageRating}>{averageRating.toFixed(1)}</div>
          <div className={classes.stars}>
            <RatingStar rating={averageRating} />
          </div>
          <span className={classes.count}>{reviews.length}件のレビュー</span>
        </div>
        <div className={classes.separate} />
        <div className={classes.barWrap}>
          {
            [...Array(5)].map((_, idx) => (
              <div key={`rating_bar${idx}`} className={classes.rating}>
                <div className={classes.number}>{5 - idx}</div>
                <StarIcon className={classes.star} />
                <div className={classes.bar}>
                  <div className={classes.barEmpty} />
                  <div className={[classes.barFill, classes[`fill${5 - idx}`]].join(' ')} />
                </div>
                <div className={classes.parcent}>{`${Math.floor(reviews.filter(r => r.rating === 5 - idx).length / reviews.length * 100) || 0}%`}</div>
              </div>
            ))
          }
        </div>
      </div>
    )
  }
}

export default ReviewStat