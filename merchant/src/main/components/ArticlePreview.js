import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { withStyles, Button } from '@material-ui/core'
import ArticleContents from 'components/wp/ArticleContents'
import Container from 'components/Container'
import Loading from 'components/Loading'
import { clearArticleCache } from 'modules/article'
import { open as openSnack } from 'tools/modules/snack'

@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  title: {
    padding: 20,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    display: 'flex',
    alignItems: 'center',
  },
  selected: {
    margin: 10,
  },
  button: {
    marginLeft: 10,
    marginRight: 10,
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  article: {
    flex: 1,
  },
  content: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}))
@connect(
  state => ({
    wpInfo: state.article.wpInfo,
  }),
  { clearArticleCache, openSnack }
)
export default class ArticlePreview extends React.Component {

  state = {
    selected: null,
    submitting: false,
  }

  constructor(props) {
    super(props)
    const query = qs.parse(props.location.search.slice(1))
    this.state = {selected: query.service || query.category}
  }

  clearCache = () => {
    const { wpInfo, location } = this.props
    const query = qs.parse(location.search.slice(1))
    query.marusen = wpInfo.marusen
    this.props.clearArticleCache(wpInfo.articleId, query)
    .then(({Invalidation: {Id}}) => {
      this.props.openSnack(`作成成功 ID: ${Id}`)
    })
    .catch((e) => {
      this.props.openSnack(e.data.message)
    })
    .finally(() => this.setState({submitting: false}))

  }

  render () {
    const { wpInfo, classes } = this.props
    const { selected, submitting } = this.state
    if (Object.keys(wpInfo).length === 0) return  <Loading />

    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    const { author, modified, doms } = wpInfo

    return (
      <div className={classes.root}>
        <Helmet>
          <title>投稿プレビュー</title>
          <meta name='robots' content='noindex' />
        </Helmet>
        <h1 className={classes.title}>{wpInfo.title}</h1>
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: 20}}>
          <Button variant='contained' color='secondary' disabled={submitting} onClick={this.clearCache}>キャッシュ削除</Button>
        </div>
        <Container maxWidth={1200} >
          <div className={classes.container}>
            <div className={classes.article}>
              <div className={classes.content}>
                <ArticleContents
                  doms={doms}
                  author={author}
                  modified={modified}
                  serviceOrCategory={selected}
                  pageType={''}
                  currentPath={currentPath}
                  onZipEnter={() => {}}
                  isPreview
                />
              </div>
            </div>
          </div>
        </Container>
      </div>
    )
  }
}
