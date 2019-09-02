import React from 'react'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'

let NewsList = ({className, articles, classes}) => (
  <div className={[classes.list, className].join(' ')}>
    {articles.map(article =>
      <div key={article.id} className={classes.article}>
        <div className={classes.header}>
          <time className={classes.date}>{moment(article.date).format('YYYY年MM月DD日')}</time>
          <div className={classes.category}>{(article.category || {}).name || 'お知らせ'}</div>
        </div>
        <div className={classes.main}>
          <Link className={classes.title} to={`/company/news/${article.id}`}>{article.title}</Link>
        </div>
      </div>
    )}
  </div>
)

NewsList = withStyles(theme => ({
  list: {
    margin: '20px 0 80px',
  },
  article: {
    display: 'flex',
    padding: '20px 0',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
  },
  main: {
    flex: 1,
  },
  date: {
    color: theme.palette.grey[600],
    fontSize: 14,
    width: 120,
  },
  category: {
    border: `2px solid ${theme.palette.secondary.main}`,
    borderRadius: 4,
    width: 100,
    height: 24,
    fontWeight: 'bold',
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    display: 'block',
    fontSize: 16,
    marginTop: 15,
    marginLeft: 120,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
    },
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  ':hover': {},
}))(NewsList)

export default NewsList

