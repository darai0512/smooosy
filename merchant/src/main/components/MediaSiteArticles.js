import React from 'react'
import moment from 'moment'
import { Paper } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

@withStyles(theme => ({
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
    width: '32%',
    maxWidth: 450,
    marginBottom: 32,
    borderRadius: 5,
    paddingBottom: 5,
    [theme.breakpoints.only('sm')]: {
      width: '48%',
    },
    [theme.breakpoints.down('xs')]: {
      width: '95%',
      marginBottom: 16,
    },
  },
  content: {
    color: theme.palette.common.black,
    padding: 20,
  },
  date: {
    color: theme.palette.grey[800],
    fontSize: 14,
    paddingBottom: 4,
  },
}))
export default class MediaSiteArticles extends React.PureComponent {

  render () {
    const { articles, classes } = this.props

    return (
        <div className={classes.root}>
          {articles.map(article => (
            <Paper className={classes.paper} key={article.id}>
              <a href={article.url}>
                <div style={{
                  borderRadius: '5px 5px 0 0',
                  height: 200,
                  background: article.thumbnail ? `url(${article.thumbnail}) center/cover` : 'transparent',
                }}/>
                <div className={classes.content}>
                  <div className={classes.date}>
                    {moment(article.date).format('YYYY年MM月DD日')}
                  </div>
                  <h3>{article.title}</h3>
                </div>
              </a>
            </Paper>
          )
          )}
        </div>
    )
  }
}
