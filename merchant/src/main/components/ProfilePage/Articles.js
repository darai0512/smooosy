import React from 'react'
import moment from 'moment'
import { Paper } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const Articles = ({classes, articles = []}) => (
  <div>
    <h2 className={classes.title}>おすすめ記事</h2>
    <div className={classes.root}>
      {articles.map(article => (
        <Paper className={classes.paper} key={article.id} classes={{root: classes.paperContent}}>
          <a href={article.url} className={classes.link}>
            {article.thumbnail ? <img src={article.thumbnail}  className={classes.image} /> : <div className={classes.image} />}
            <div className={classes.content}>
              <div className={classes.date}>
                {moment(article.date).format('YYYY年MM月DD日')}
              </div>
              <h4 className={classes.article}>{article.title}</h4>
            </div>
          </a>
        </Paper>
      ))}
    </div>
  </div>
)

export default withStyles(theme => ({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: '10px 0',
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    padding: '20px 0 30px',
    [theme.breakpoints.down('xs')]: {
      flexWrap: 'nowrap',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px 0 20px',
    },
  },
  paper: {
    width: 150,
    marginBottom: 32,
    borderRadius: 5,
    paddingBottom: 5,
    [theme.breakpoints.down('sm')]: {
      width: 200,
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      maxWidth: 450,
      marginBottom: 16,
    },
  },
  paperContent: {
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
  link: {
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
    },
  },
  image: {
    borderRadius: '5px 5px 0 0',
    width: 150,
    height: 100,
    objectFit: 'cover',
    [theme.breakpoints.down('sm')]: {
      width: 200,
      height: 132,
    },
    [theme.breakpoints.down('xs')]: {
      width: '50%',
      height: 150,
      borderRadius: 0,
    },
  },
  content: {
    color: theme.palette.common.black,
    padding: 10,
  },
  date: {
    color: theme.palette.grey[700],
    fontSize: 10,
  },
  article: {
    fontSize: 13,
  },
}))(Articles)
