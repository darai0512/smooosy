import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import Container from 'components/Container'
import ThreeStep from 'components/ThreeStep'
import BreadCrumb from 'components/BreadCrumb'
import PostSummary from 'components/wp/PostSummary'
import Pagination from 'components/Pagination'
import ArticleCategoryTree from 'components/wp/ArticleCategoryTree'
import PopularArticleList from 'components/wp/PopularArticleList'
import LinkList from 'components/LinkList'
import Footer from 'components/Footer'
import Loading from 'components/Loading'
import { imageSizes } from '@smooosy/config'

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
    textAlign: 'center',
    fontSize: 34,
    color: theme.palette.common.white,
    zIndex: 10,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  threeStep: {
    background: theme.palette.grey[200],
    padding: 0,
  },
  main: {
    paddingTop: '40px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: '20px',
    },
  },
  breadcrumbs: {
    marginBottom: 10,
  },
  description: {
    background: theme.palette.grey[100],
    padding: 10,
    fontSize: 14,
    borderRadius: 5,
    [theme.breakpoints.down('xs')]: {
      margin: '0 5%',
    },
  },
  content: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      width: '95%',
      margin: '0 auto',
    },
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
  pagination: {
    padding: '40px 0',
    [theme.breakpoints.down('sm')]: {
      padding: '20px 5%',
    },
  },
  links: {
    paddingBottom: 40,
    [theme.breakpoints.down('sm')]: {
      paddingBottom: 20,
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
  link: {
    marginBottom: 10,
  },
}))
export default class ArticleListPage extends React.Component {
  constructor(props) {
    const search = qs.parse(props.location.search.slice(1))
    const page = parseInt(search.page || 1, 10)
    super(props)
    this.state = {
      load: /\/services\//.test(props.location.pathname) ? this.loadForService : this.loadForCategory,
      page,
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      const search = qs.parse(this.props.location.search.slice(1))
      const page = parseInt(search.page || 1, 10)
      this.setState({
        service: false,
        page,
      })
      this.state.load(page)
    }
  }

  loadForCategory = page => {
    const { key } = this.props.match.params

    this.props.apiClient
      .get(`/api/categories/${key}/articles?page=${page}&per_page=${PER_PAGE}`)
      .then(res => res.data)
      .then(({categories, category, wpCategories, populars, articles, total, relatedServices}) => this.setState({categories, category, wpCategories, populars, articles, total, relatedServices}))
      .catch(() => this.props.history.replace(`/t/${key}`))
  }

  loadForService = page => {
    const { key } = this.props.match.params

    this.props.apiClient
      .get(`/api/services/${key}/articles?page=${page}&per_page=${PER_PAGE}`)
      .then(res => res.data)
      .then(({categories, service, wpCategories, populars, articles, total, relatedServices}) => this.setState({categories, service, wpCategories, populars, articles, total, relatedServices}))
      .catch(() => this.props.history.replace(`/services/${key}`))
  }

  componentDidMount() {
    if (!this.state.service || !this.state.category) {
      this.state.load(this.state.page)
    }
  }

  componentWillUnmount() {
    this.setState({service: false, category: false})
  }

  onPageChange = page => {
    this.props.history.push(`${this.props.location.pathname}?page=${page}`)
  }

  render() {
    const { classes } = this.props
    const { categories, category, service, wpCategories, populars, articles, page, total, relatedServices } = this.state
    if (!service && !category) return  <Loading />

    const target = service ? service : category

    const breadcrumbs = [{path: '/', text: 'トップ'}]
    breadcrumbs.push({path: '/media', text: 'メディアトップ'})
    if (service) {
      breadcrumbs.push({text: `${service.name}の記事一覧`})
    } else if (category) {
      breadcrumbs.push({text: `${category.name}の記事一覧`})
    }

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{`記事一覧 ${page}ページ目 | ${target.name}`}</title>
          {target.mediaListPageDescription &&
            <meta name='description' content={`${target.name}の記事一覧 ${page}ページ目 | ${target.mediaListPageDescription}`} />
          }
        </Helmet>
        <div className={classes.header}>
          <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={target.image + imageSizes.cover} />
          <div className={[classes.fullSize, classes.mask].join(' ')} />
          <div className={classes.coverText}>
            <h1 className={classes.title}>
              {`${target.name}の記事一覧`}
            </h1>
          </div>
        </div>
        <Container className={classes.threeStep}>
          <ThreeStep />
        </Container>
        <Container maxWidth={1200} className={classes.main}>
          <div className={classes.container}>
            <div className={classes.article}>
              <div className={classes.breadcrumbs}>
                <BreadCrumb breads={breadcrumbs} />
              </div>
              {target.mediaListPageDescription &&
                <div className={classes.description}>
                  {target.mediaListPageDescription}
                </div>
              }
              <div className={classes.content}>
                <PostSummary posts={articles} />
              </div>
              <div className={classes.pagination}>
                <Pagination total={total} current={page} perpage={PER_PAGE} onChange={this.onPageChange} />
              </div>
            </div>
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
          </div>
        </Container>
        <Container gradient maxWidth={1200}>
          <div className={[classes.links, classes.subtitle].join(' ')}>
            <h3>SMOOOSYのカテゴリ一覧</h3>
            <LinkList list={categories} linkFunction={c => `/t/${c.key}`}/>
          </div>
          <div className={[classes.links, classes.subtitle].join(' ')}>
            <h3>SMOOOSYの関連サービス一覧</h3>
            <LinkList list={relatedServices} linkFunction={s => `/services/${s.key}`} />
          </div>
        </Container>
        <Footer />
      </div>
    )
  }
}
