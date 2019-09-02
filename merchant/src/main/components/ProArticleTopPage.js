import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { Paper } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import Container from 'components/Container'
import BreadCrumb from 'components/BreadCrumb'
import Pagination from 'components/Pagination'
import Footer from 'components/Footer'
import Loading from 'components/Loading'

const PER_PAGE = 12

@withApiClient
@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  header: {
    zIndex: 5,
    position: 'relative',
    background: theme.palette.grey[100],
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cover: {
    backgroundImage: 'url(/images/pro_media_top.jpg)',
    backgroundSize: 'contain',
    backgroundColor: theme.palette.grey[500],
    [theme.breakpoints.down('xs')]: {
      backgroundSize: 'cover',
    },
  },
  mask: {
    background: 'rgba(0, 0, 0, .7)',
  },
  coverText: {
    height: '100%',
    padding: '100px 15px 50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '80px 15px 40px',
    },
  },
  title: {
    zIndex: 10,
  },
  mediaLogo: {
    width: 600,
    height: 180,
    filter: 'drop-shadow(1px 1px 0.5px #000000)',
    [theme.breakpoints.down('xs')]: {
      width: 300,
      height: 90,
    },
  },
  threeStep: {
    background: theme.palette.grey[200],
    padding: 0,
  },
  main: {
    paddingTop: '20px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: '10px',
    },
  },
  breadcrumbs: {
    marginLeft: '10px',
    paddingBottom: '20px',
    [theme.breakpoints.down('xs')]: {
      paddingBottom: '10px',
    },
  },
  article: {
    flex: 1,
  },
  postSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  pagination: {
    padding: '40px 0',
    [theme.breakpoints.down('sm')]: {
      padding: '20px 0',
    },
  },
}))
export default class ProArticleTopPage extends React.Component {
  constructor(props) {
    super(props)
    const search = qs.parse(props.location.search.slice(1))
    const page = parseInt(search.page || 1)
    this.state = { page }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      const search = qs.parse(this.props.location.search.slice(1))
      const page = parseInt(search.page || 1)
      this.setState({page, articles: null})
      this.load(page)
      document.body.parentNode.scrollTop = 0
    }
  }

  load = page => {
    let categoryKey = this.props.match.params.category
    let url = categoryKey ? `/api/categories/${categoryKey}/articles?type=pro&page=${page}&per_page=${PER_PAGE}`
      : `/api/articles/pro?page=${page}&per_page=${PER_PAGE}`

    this.props.apiClient
      .get(url)
      .then(res => res.data)
      .then(({category, articles, total}) => this.setState({category, articles, total}))
      .catch(() => this.props.history.replace('/'))
  }

  componentDidMount() {
    this.load(this.state.page)
  }

  onPageChange = page => {
    this.props.history.push(`${this.props.location.pathname}?page=${page}`)
  }

  render() {
    const { classes } = this.props
    const { category, articles, page, total } = this.state

    const breadcrumbs = [{path: '/', text: 'トップ'}]
    if (category) {
      breadcrumbs.push({path: '/pro-media', text: 'プロフェッショナルズ'})
      breadcrumbs.push({text: `${category.name}の記事一覧`})
    } else {
      breadcrumbs.push({text: 'プロフェッショナルズ'})
    }

    const title = 'SMOOOSY・プロフェッショナルズ'

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{title}</title>
          <meta name='description' content='仕事には、その人それぞれの価値観や流儀がある。さまざまな分野の第一線で活躍するSMOOOSYのプロたち。彼らが日々何を感じ、何を求め仕事に向き合っているのか。彼らのプロフェッショナリズムに迫った。' />
        </Helmet>
        <div className={classes.header}>
          <div className={[classes.cover, classes.fill].join(' ')} />
          <div className={[classes.mask, classes.fill].join(' ')} />
          <div className={classes.coverText}>
          <h1 className={classes.title}>
            <img className={classes.mediaLogo} src={'/images/pro_media_logo.png'} alt={title} />
          </h1>
          </div>
        </div>
         <Container maxWidth={1200} className={classes.main}>
          <div className={classes.container}>
            <div className={classes.article}>
              <div className={classes.breadcrumbs}>
                <BreadCrumb breads={breadcrumbs} />
              </div>
              {articles ?
                <>
                  <div className={classes.postSummary}>
                    <PostSummary posts={articles} />
                  </div>
                  <div className={classes.pagination}>
                    <Pagination total={total} current={page} perpage={PER_PAGE} onChange={this.onPageChange} />
                  </div>
                </>
              :
                <Loading />
              }
            </div>
          </div>
        </Container>
        <Footer />
      </div>
    )
  }
}

const PostSummary = withStyles(theme => ({
  summary: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 20,
    marginRight: 20,
    width: 320,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 10,
      marginRight: 10,
    },
  },
  dummy: {
    width: 320,
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 10,
      marginRight: 10,
    },
  },
  link: {
    textDecoration: 'none',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    color: theme.palette.grey[900],
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    margin: '0 10px 10px',
    color: theme.palette.grey[500],
    alignSelf: 'flex-end',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: 10,
  },
  image: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    [theme.breakpoints.down('xs')]: {
      height: 'auto',
    },
  },
  excerpt: {
    fontSize: 15,
    [theme.breakpoints.down('xs')]: {
      marginTop: 10,
    },
  },
}))(props => {
  const { posts, classes } = props
  const dummies = (3 - posts.length % 3) % 3
  return (
    <>
      {posts.map(post =>
        <Paper key={post.id} className={classes.summary}>
          <Link to={post.url} className={classes.link}>
            <img alt={post.title} src={post.thumbnail || post.img.src} className={classes.image} width={240} height={160} />
            <div className={classes.content}>
              <h2 className={classes.title}>{post.title}</h2>
              <div className={classes.excerpt}>{post.excerpt}</div>
            </div>
          </Link>
          <div className={classes.info}>{moment(post.date).format('YYYY年MM月DD日')} By <Link to={`/articles/authors/${post.authorId}`}>{post.author}</Link></div>
        </Paper>
      )}
      {dummies > 0 && [...new Array(dummies)].map((_, idx) => <div key={idx} className={classes.dummy} />)}
      {posts.length === 0 && <div>記事はありません</div>}
    </>
  )
})
