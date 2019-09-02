import React from 'react'
import { Helmet } from 'react-helmet'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import Container from 'components/Container'
import NewsList from 'components/company/NewsList'
import Pagination from 'components/Pagination'
import { webOrigin } from '@smooosy/config'

const perPage = 10

@withApiClient
@withStyles(theme => ({
  container: {
    [theme.breakpoints.down('xs')]: {
      maxWidth: '90%',
      margin: '0 auto',
    },
  },
  list: {
    margin: '20px 0 80px',
  },
}))
export default class NewsListPage extends React.Component {
  state = {
    page: 1,
    articles: [],
  }

  load = (page = 1) => {
    this.setState({page})
    this.props.apiClient
      .get(`${webOrigin}/api/news?per_page=${perPage}&page=${page}`)
      // .get(`${wpOrigin}/wp-json/custom/v1/posts?category=${newsCategoryId}&per_page=${perPage}&page=${page}`)
      .then(({data}) => {
        this.setState({
          articles: data.posts,
          total: data.total || 0,
        })
      })
  }

  componentDidMount() {
    this.load()
  }

  render() {
    const { classes } = this.props
    const { articles, total, page } = this.state
    return (
      <Container maxWidth={800} className={classes.container}>
        <Helmet>
          <title>お知らせ一覧</title>
        </Helmet>
        <NewsList className={classes.list} articles={articles} />
        <Pagination total={total} current={page} perpage={perPage} onChange={page => this.load(page)} />
      </Container>
    )
  }
}
