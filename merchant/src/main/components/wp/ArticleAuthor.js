import React from 'react'
import { withStyles } from '@material-ui/core'
import { LazyLoadImage } from 'components/LazyLoad'

let ArticleAuthor = ({author, classes}) => (
  <div className={classes.root}>
    <div>
      <LazyLoadImage src={author.avatar} width={90} height={90} />
    </div>
    <div className={classes.content}>
      <h3>著者紹介: {author.display_name}</h3>
      <p>{author.description}</p>
    </div>
  </div>
)

ArticleAuthor = withStyles(theme => ({
  root: {
    display: 'flex',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottom: `1px solid ${theme.palette.grey[500]}`,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
  content: {
    marginLeft: 10,
  },
}))(ArticleAuthor)

export default ArticleAuthor