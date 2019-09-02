import React from 'react'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import moment from 'moment'
import { LazyLoadImage } from 'components/LazyLoad'

let PostSummary = (props) => {
  const { posts, classes } = props

  return (
    <>
      {posts.map(post =>
        <div key={post.id} className={classes.summary}>
          <div>
            <h2 className={classes.title}><Link className={classes.titleLink} to={post.url}>{post.title}</Link></h2>
            <div className={classes.info}>{moment(post.date).format('YYYY年MM月DD日')} By <Link to={`/articles/authors/${post.authorId}`}>{post.author}</Link></div>
          </div>
          <div className={classes.content}>
            <Link className={classes.imageLink} to={post.url}>
              <LazyLoadImage alt={post.title} src={post.thumbnail || post.img.src} className={classes.image} width={180} height={120} />
            </Link>
            <div className={classes.excerpt}>{post.excerpt}<Link to={post.url}>もっと読む</Link></div>
          </div>
        </div>
      )}
      {posts.length === 0 && <div>記事はありません</div>}
    </>
  )
}

PostSummary = withStyles(theme => ({
  summary: {
    display: 'flex',
    flexDirection: 'column',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    marginBottom: 20,
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      marginLeft: 10,
      marginRight: 10,
    },
  },
  title: {
    fontSize: 24,
    [theme.breakpoints.down('xs')]: {
      fontSize: 20,
    },
  },
  titleLink: {
    color: theme.palette.common.black,
    '&:hover': {
      color: theme.palette.blue.A200,
      textDecoration: 'underline',
    },
  },
  ':hover': {},
  info: {
    fontSize: 14,
    color: theme.palette.grey[500],
    marginTop: 5,
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  imageLink: {
    [theme.breakpoints.down('xs')]: {
      margin: '0 auto',
    },
  },
  image: {
    width: 180,
    height: 120,
    objectFit: 'cover',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      height: 'auto',
      maxWidth: 180,
    },
  },
  excerpt: {
    marginLeft: 20,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
      marginTop: 10,
    },
  },
}))(PostSummary)

export default PostSummary
