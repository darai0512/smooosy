import React from 'react'

import qs from 'qs'
import { Helmet } from 'react-helmet'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import Container from 'components/Container'
import ThreeStep from 'components/ThreeStep'
import Pagination from 'components/Pagination'
import PostSummary from 'components/wp/PostSummary'
import ArticleCategoryTree from 'components/wp/ArticleCategoryTree'
import ArticleAuthor from 'components/wp/ArticleAuthor'
import Footer from 'components/Footer'
import Loading from 'components/Loading'

const PER_PAGE = 10

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
    paddingTop: '40px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: '20px',
    },
  },
  article: {
    flex: 1,
  },
  container: {
    display: 'flex',
    alignItems: 'flex-start',
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
      width: '90%',
      margin: '0 auto 10px',
    },
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
export default class ArticleAuthorPage extends React.Component {
  constructor(props) {
    super(props)
    const search = qs.parse(props.location.search.slice(1))
    const page = parseInt(search.page || 1, 10)
    this.state = { page }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      const search = qs.parse(this.props.location.search.slice(1))
      const page = parseInt(search.page || 1, 10)
      this.setState({page, articles: null})
      this.load(page)
      document.body.parentNode.scrollTop = 0
    }
  }

  load = page => {

    this.props.apiClient
      .get(`/api/articles/authors/${this.props.match.params.id}?page=${page}&per_page=${PER_PAGE}`)
      .then(res => res.data)
      .then(({wpCategories, author, articles, total}) => this.setState({wpCategories, author, articles, total}))
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
    const { articles, wpCategories, author, page, total } = this.state
    if (!wpCategories) return <Loading />

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{`SMOOOSY - ${author.display_name}の記事一覧`}</title>
        </Helmet>
        <div className={classes.header}>
          <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src='/images/media_top.jpg' />
          <div className={[classes.fullSize, classes.mask].join(' ')} />
          <div className={classes.coverText}>
          <h1 className={classes.title}>
            {`${author.display_name}の記事一覧`}
          </h1>
          </div>
        </div>
        <Container className={classes.threeStep}>
          <ThreeStep />
        </Container>
         <Container maxWidth={1200} className={classes.main}>
          <div className={classes.container}>
            <div className={classes.article}>
              {articles ?
                <>
                  <ArticleAuthor author={author} />
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
              <aside className={[classes.side, classes.sticky].join(' ')}>
                <nav>
                  <h3 className={classes.subtitle}>記事カテゴリ</h3>
                  <ArticleCategoryTree wpCategories={wpCategories} />
                </nav>
              </aside>
            }
          </div>
        </Container>
        <Footer />
      </div>
    )
  }
}
