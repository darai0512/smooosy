import React from 'react'
import { Paper } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { LazyLoadImage } from 'components/LazyLoad'


let RelatedPost = (props) => {
  const { posts = [], classes } = props

  return (
    <div className={classes.wrap}>
      {posts.map(related =>
        <Paper key={related.id} className={classes.paper} component='a' href={related.url}>
          <div><LazyLoadImage src={related.thumbnail || related.img.src} className={classes.image} width={300} height={200} /></div>
          <div>
            <div className={classes.date}>{related.date}</div>
            <div className={classes.text}>{related.title}</div>
          </div>
        </Paper>
      )}
      {(posts || []).length === 0 && <div>記事はありません</div>}
      {[...Array(4)].map((_, i) => <div key={i} className={classes.dummyPaper} />)}
    </div>
  )
}

RelatedPost = withStyles(theme => ({
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  paper: {
    width: 200,
    margin: 5,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      margin: '5px 0',
    },
  },
  dummyPaper: {
    width: 200,
    margin: '0 5px',
  },
  image: {
    width: 200,
    height: 133,
    objectFit: 'cover',
    [theme.breakpoints.down('xs')]: {
      width: 120,
      height: 80,
    },
  },
  date: {
    fontSize: 11,
    padding: '10px 10px 0',
    color: theme.palette.grey[500],
  },
  text: {
    flex: 1,
    padding: '0 10px 10px',
    fontWeight: 'bold',
    fontSize: 14,
  },
}))(RelatedPost)

export default RelatedPost
