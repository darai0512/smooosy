import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import { load, unload } from 'modules/news'
import OGPMeta from 'components/OGPMeta'
import Container from 'components/Container'
import Loading from 'components/Loading'
import NewsList from 'components/company/NewsList'
import { webOrigin } from '@smooosy/config'

@withApiClient
@withStyles(theme => ({
  container: {
    [theme.breakpoints.down('xs')]: {
      maxWidth: '90%',
      margin: '0 auto',
    },
  },
  title: {
    padding: '30px 0 10px',
    fontSize: 26,
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  time: {
    textAlign: 'right',
    display: 'block',
    paddingBottom: 30,
  },
}))
@connect(
  state => ({
    news: state.news.news,
  }),
  { load, unload }
)
export default class NewsArticlePage extends React.Component {

  state = {
    articles: [],
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.props.unload()
      this.load()
    }
  }

  load = () => {
    const { id } = this.props.match.params
    this.props.load(id)
      .catch(() => this.props.history.push('/company/news'))

    this.props.apiClient
      .get(`${webOrigin}/api/news?per_page=3&page=1`)
      .then(({data}) => {
        this.setState({
          articles: data.posts,
        })
      })
  }

  componentDidMount() {
    if (!this.props.news) {
      this.load()
    }
  }

  componentWillUnmount() {
    this.props.unload()
  }

  render() {
    const { news, classes } = this.props
    const { articles } = this.state
    if (!news) return  <Loading style={{padding: '30vh 0'}} />
    const { title, content, shareImage, author, published, modified } = news

    return (
      <>
        <OGPMeta
          title={title}
          shareImage={shareImage}
          structuredDataType='NewsArticle'
          author={author}
          published={published}
          modified={modified}
        />
        <Container maxWidth={800} className={classes.container}>
          <h1 className={classes.title}>{title}</h1>
          <time className={classes.time} itemProp='dateModified' dateTime={moment(modified).format('YYYY-MM-DD')}>
            更新日: {moment(modified).format('YYYY年MM月DD日')}
          </time>
          <div className='entry-content' style={{minHeight: '60vh'}} dangerouslySetInnerHTML={{__html: content}} />
        </Container>
        {articles && <Container maxWidth={800} className={classes.container}>
          <NewsList articles={articles} />
        </Container>}
      </>
    )
  }
}
