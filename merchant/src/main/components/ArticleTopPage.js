import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import Container from 'components/Container'
import ThreeStep from 'components/ThreeStep'
import Pagination from 'components/Pagination'
import BreadCrumb from 'components/BreadCrumb'
import PostSummary from 'components/wp/PostSummary'
import ArticleCategoryTree from 'components/wp/ArticleCategoryTree'
import LinkList from 'components/LinkList'
import PopularArticleList from 'components/wp/PopularArticleList'
import Footer from 'components/Footer'
import Loading from 'components/Loading'

const PER_PAGE = 15

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
  fullSize: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: theme.palette.grey[500],
  },
  mask: {
    background: 'rgba(0, 0, 0, .5)',
  },
  coverText: {
    height: '100%',
    padding: '100px 15px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '70px 15px 30px',
    },
  },
  title: {
    zIndex: 10,
  },
  mediaLogo: {
    width: 450,
    height: 84,
    filter: 'drop-shadow(1px 1px 0.5px #000000)',
    [theme.breakpoints.down('xs')]: {
      width: 248,
      height: 46,
    },
  },
  threeStep: {
    background: theme.palette.grey[200],
    padding: 0,
  },
  main: {
    paddingTop: '20px',
  },
  article: {
    flex: 1,
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  breadcrumbs: {
    marginBottom: 10,
  },
  pagination: {
    padding: '40px 0',
    [theme.breakpoints.down('sm')]: {
      padding: '20px 0',
    },
  },
  side: {
    width: 260,
    marginLeft: 20,
    marginBottom: 20,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginTop: 30,
      marginLeft: 0,
    },
  },
  sticky: {
    background: theme.palette.common.white,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 20,
  },
  subtitle: {
    margin: '0 0 10px',
    [theme.breakpoints.down('xs')]: {
      width: '95%',
      margin: '0 auto 10px',
    },
  },
  spaceTop: {
    marginTop: 10,
  },
  categoryLink: {
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  ':hover': {},
  link: {
    marginBottom: 10,
  },
}))
export default class ArticleTopPage extends React.Component {
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
    this.props.apiClient
      .get(`/api/articles?page=${page}&per_page=${PER_PAGE}`)
      .then(res => res.data)
      .then(({categories, wpCategories, populars, articles, total}) => this.setState({categories, wpCategories, populars, articles, total}))
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
    const { articles, categories, wpCategories, populars, page, total } = this.state
    if (!wpCategories) return <Loading />

    const title = 'SMOOOSYメディア'
    const breadcrumbs = [{path: '/', text: 'トップ'}, {text: title}]

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <div className={classes.header}>
          <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src='/images/media_top.jpg' />
          <div className={[classes.fullSize, classes.mask].join(' ')} />
          <div className={classes.coverText}>
          <h1 className={classes.title}>
            <img className={classes.mediaLogo} src='/images/media_logo.png' alt={title} />
          </h1>
          </div>
        </div>
        <Container className={classes.threeStep}>
          <ThreeStep />
        </Container>
         <Container maxWidth={1200} className={classes.main}>
          <div className={classes.breadcrumbs}>
            <BreadCrumb breads={breadcrumbs} />
          </div>
          <div className={classes.container}>
            <div className={classes.article}>
              {articles ?
                <>
                  <div>
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
            {wpCategories &&
              <aside className={classes.side}>
                <nav>
                  <h3 className={classes.subtitle}>人気の記事</h3>
                  <PopularArticleList populars={populars} />
                </nav>
                <div className={classes.sticky}>
                  <h3 className={[classes.subtitle, classes.spaceTop].join(' ')}>記事カテゴリ</h3>
                  <ArticleCategoryTree wpCategories={wpCategories} />
                </div>
              </aside>
            }
          </div>
        </Container>
        <Container maxWidth={1200} className={[classes.main, classes.subtitle].join(' ')}>
          <h3>SMOOOSYのカテゴリ一覧</h3>
          <LinkList list={categories} linkFunction={c => `/t/${c.key}`} />
        </Container>
        <Footer />
      </div>
    )
  }
}
