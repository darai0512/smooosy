import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'

import Footer from 'components/Footer'
import NewsListPage from 'components/company/NewsListPage'
import NewsArticlePage from 'components/company/NewsArticlePage'

let NewsContainer = ({match, classes}) => (
  <div className={classes.root}>
    <p className={classes.header}>ニュース</p>
    <Switch>
      <Route exact path={match.path + '/:id'} component={NewsArticlePage} />
      <Route exact path={match.path} component={NewsListPage} />
      <Redirect to={match.path} />
    </Switch>
    <Footer />
  </div>
)

NewsContainer = withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  header: {
    paddingTop: 50,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      paddingTop: 30,
    },
  },
}))(NewsContainer)

export default NewsContainer
