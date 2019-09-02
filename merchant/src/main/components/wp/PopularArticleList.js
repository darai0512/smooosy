import React from 'react'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import { LazyLoadImage } from 'components/LazyLoad'

let PopularArticleList = ({populars, classes}) => (
  <div className={classes.root}>
    {populars.map((p, idx) =>
      <div key={p.post_id}>
        {idx < 3 &&
          <div className={classes.header}>
            <LazyLoadImage className={classes.rank} src={idx === 0 ? '/images/rank-first.png' : idx === 1 ? '/images/rank-second.png' : '/images/rank-third.png' } width={32} height={32} />{`${idx + 1}位`}
          </div>
        }
        <Link to={p.post_permalink} className={classes.item}>
          <div>
            <LazyLoadImage src={p.thumbnail} className={classes.img} width={100} height={100} />
          </div>
          <span className={classes.popularLink} >{p.post_title}</span>
        </Link>
      </div>
    )}
  </div>
)

PopularArticleList = withStyles(theme => ({
  root: {
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold',
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 14,
  },
  rank: {
    marginRight: 4,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  img: {
    width: 100,
    height: 100,
  },
  popularLink: {
    marginLeft: 10,
    lineHeight: 1.6,
    fontSize: 14,
    fontWeight: 'bold',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  ':hover': {},
}))(PopularArticleList)

export default PopularArticleList
