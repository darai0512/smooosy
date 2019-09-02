import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { connect } from 'react-redux'
import { withApiClient } from 'contexts/apiClient'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { withAMP } from 'contexts/amp'
import { loadServiceArticle, unload } from 'modules/article'
import { Link } from 'react-router-dom'
import OGPMeta from 'components/OGPMeta'
import ZipBox from 'components/ZipBox'
import Container from 'components/Container'
import ThreeStep from 'components/ThreeStep'
import BreadCrumb from 'components/BreadCrumb'
import ArticleContents from 'components/wp/ArticleContents'
import ArticleCategoryTree from 'components/wp/ArticleCategoryTree'
import PopularArticleList from 'components/wp/PopularArticleList'
import RelatedPost from 'components/wp/RelatedPost'
import Footer from 'components/Footer'
import QueryDialog from 'components/cards/QueryDialog'
import Loading from 'components/Loading'
import StickyBar from 'components/StickyBar'
import LPBanner from 'components/LPBanner'
import LinkList from 'components/LinkList'
import GAEventTracker from 'components/GAEventTracker'
import WPTracker from 'components/wp/WPTracker'
import { webOrigin, imageSizes, GAEvent } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent

@withAMP
@withApiClient
@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      overflowY: 'hidden',
    },
  },
  footerRoot: {
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 150,
    },
  },
  header: {
    height: '80vh',
    zIndex: 5,
    position: 'relative',
    background: theme.palette.grey[100],
  },
  experimentHeader: {
    height: '100vh',
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
    padding: '100px 15px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '70px 15px 15px',
    },
  },
  title: {
    width: '100%',
    maxWidth: 1200,
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
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  main: {
    paddingTop: '40px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: '20px',
    },
  },
  sideThreeStep: {
    display: 'block',
  },
  breadcrumbs: {
    marginBottom: 10,
  },
  content: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  article: {
    flex: 1,
  },
  spWidth: {
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      margin: '0 auto',
    },
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  zip: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  side: {
    width: 300,
    marginLeft: 20,
    marginBottom: 20,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      margin: '20px 0',
    },
  },
  sticky: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    border: `1px solid ${theme.palette.grey[300]}`,
    position: 'sticky',
    top: 20,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
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
  siteDesc: {
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    minHeight: 50,
    fontSize: 16,
  },
  mobileSticky: {
    textAlign: 'center',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    position: 'fixed',
    top: 0,
    width: '100%',
    padding: 10,
    background: theme.palette.common.white,
    zIndex: 2,
    boxShadow: `
    0px 1px 5px 0px rgba(0, 0, 0, 0.2),
    0px 2px 2px 0px rgba(0, 0, 0, 0.14),
    0px 3px 1px -2px rgba(0, 0, 0, 0.12)
    `,
  },
}))
@connect(
  state => ({
    wpInfo: state.article.wpInfo,
  }),
  { loadServiceArticle, unload }
)
export default class ServiceArticlePage extends React.Component {
  static defaultProps = {
    service: null,
    html: '',
  }

  constructor(props) {
    super(props)
    const state = this.props.location.state || qs.parse(this.props.location.search.slice(1))
    this.state = {
      open: !!(state && state.modal),
      specialSent: state ? state.sp : null,
      zip: state ? state.zip : null,
      fromAMP: !!state.ampId, // AMP経由時はampId存在する
    }
  }

  componentDidUpdate(prevProps) {
    if (Object.keys(this.props.wpInfo).length === 0) {
      this.load()
    } else if (prevProps.location.pathname !== this.props.location.pathname) {
      this.props.unload()
      this.load()
    }
    if (prevProps.location.search !== this.props.location.search) {
      const state = qs.parse(this.props.location.search.slice(1))
      this.setState({
        open: !!(state && state.modal),
        specialSent: state ? state.sp : null,
        zip: state ? state.zip : null,
        fromAMP: false,
      })
    }
  }

  load = () => {
    const { id, key } = this.props.match.params
    const isPickup = /\/pickups\//.test(this.props.location.pathname)
    this.props.loadServiceArticle(id, key, isPickup)
      .catch((err) => {
        if (err && err.data && err.data.redirect) {
          this.props.history.replace(err.data.redirect)
        } else {
          this.props.history.replace(`/services/${key}`)
        }
      })
  }

  componentDidMount() {
    if (Object.keys(this.props.wpInfo).length === 0) {
      this.load()
    }
    window.hj && window.hj('trigger', 'ServiceArticlePage')
  }

  componentWillUnmount() {
    this.props.unload()
  }

  onZipEnter = (zip, pos) => {
    const { wpInfo: { service } } = this.props
    if (service.matchMoreEnabled) {
      this.props.history.push(`/instant-results?serviceId=${service.id}${zip ? `&zip=${zip}` : ''}`)
    } else {
      const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
      this.setState({zip})
      this.props.history.replace(`${currentPath}?modal=true${zip ? `&zip=${zip}` : ''}&source=zipbox&pos=${pos}`)
    }
  }

  render() {
    const { wpInfo, classes } = this.props
    const { fromAMP } = this.state
    if (Object.keys(wpInfo).length === 0 || !wpInfo.service) return  <Loading />

    const {
      title,
      author,
      authorId,
      published,
      modified,
      doms,
      shareImage,
      zipTitle,
      meta,
      marusen,
      relatedPosts,
      articleId,
      wpCategories,
      populars,
      service,
      reviewInfo,
      relatedServices,
      prefLocationServices,
    } = wpInfo

    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    const currentURL = webOrigin + currentPath
    const pageMetaDescription = meta.yoast_wpseo_metadesc || ''
    const articleType = marusen ? 'pickups' : 'media'
    const breadcrumbs = [{path: '/', text: 'SMOOOSYトップ'}]
    breadcrumbs.push({path: '/media', text: 'メディアトップ'})
    breadcrumbs.push({path: `/services/${service.key}/media`, text: `${service.name}の記事一覧`})
    breadcrumbs.push({path: `/services/${service.key}/${articleType}/${articleId}`, text: title})
    const matchMorePath = service.matchMoreEnabled ? `/instant-results?serviceId=${service.id}` : null

    const CoverContent = () => (
      <>
        <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={shareImage || service.image + imageSizes.cover} />
        <div className={[classes.fullSize, classes.mask].join(' ')} />
        <div className={classes.coverText}>
          <h1 className={classes.title}>
            {title}
          </h1>
          <ZipBox
            title={zipTitle || `ぴったりの${service.providerName}をさがす`}
            gaEvent={{
              category: dialogOpen,
              action: pageType.ServiceArticlePage,
              label: service.key,
            }}
            service={service.matchMoreEnabled ? service : null}
            currentPath={matchMorePath || currentPath}
            onEnter={zip => this.onZipEnter(zip, 'cover')}
          />
        </div>
      </>
    )

    const FirstView = () => (
      <>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <OGPMeta
          title={title}
          description={pageMetaDescription}
          url={currentURL}
          shareImage={shareImage || (service.image + imageSizes.ogp)}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='Article'
          published={published}
          modified={modified}
          author={author}
          rating={reviewInfo}
        />
        <div className={classes.header} >
          <CoverContent />
        </div>
        <Container className={classes.threeStep}>
          <ThreeStep />
        </Container>
      </>
    )

    if (fromAMP && !!this.state.open) {
      return (
        <div className={classes.root}>
          <FirstView />
          <QueryDialog open={!!this.state.open} serviceKey={service.key} onClose={() => this.props.history.replace(currentPath)} specialSent={this.state.specialSent} initialZip={this.state.zip} />
        </div>
      )
    }

    return (
      <div className={classes.root}>
        <FirstView />
        <Container maxWidth={1200} className={classes.main}>
          <div className={classes.container}>
            <div className={classes.article}>
              <div className={classes.breadcrumbs}>
                <BreadCrumb breads={breadcrumbs} />
              </div>
              <div className={classes.content}>
                <ArticleContents
                  doms={doms}
                  author={author}
                  authorId={authorId}
                  published={published}
                  modified={modified}
                  serviceOrCategory={service}
                  pageType={pageType.ServiceArticlePage}
                  currentPath={currentPath}
                  matchMorePath={matchMorePath}
                  prefLocationServices={prefLocationServices}
                />
                <WPTracker articleId={articleId} />
              </div>
            </div>
            <aside className={classes.side}>
              <nav>
                <h3 className={classes.subtitle}>人気の記事</h3>
                <PopularArticleList populars={populars} />
                <h3 className={[classes.subtitle, classes.spaceTop].join(' ')}>記事カテゴリ</h3>
                <ArticleCategoryTree wpCategories={wpCategories} />
              </nav>
              <div className={classes.sticky}>
                <h3>SMOOOSYについて</h3>
                <div className={classes.siteDesc}>SMOOOSYは暮らしからビジネスまで、色々なプロと出会えるサービスです。</div>
                <ThreeStep className={classes.sideThreeStep} />
                <GAEventTracker
                  category={dialogOpen}
                  action={pageType.ServiceArticlePage}
                  label={service.key}
                >
                  <Button variant='contained' color='primary' component={Link} to={matchMorePath || `${currentPath}?modal=true&source=sticky_button`} className={classes.button}>
                    {service.name}のプロをさがす
                  </Button>
                </GAEventTracker>
              </div>
            </aside>
          </div>
        </Container>
        <StickyBar direction='bottom'>
          <LPBanner
            serviceOrCategoryKey={service.key}
            gaEvent={{
              category: dialogOpen,
              action: pageType.ServiceArticlePage,
              label: service.key,
            }}
            to={matchMorePath || `${currentPath}?modal=true&source=slidein_banner`}
            />
        </StickyBar>
        <Container gradient maxWidth={1200}>
          <aside className={classes.subtitle}>
            <h3>おすすめ記事</h3>
            <RelatedPost service={service} posts={relatedPosts} />
          </aside>
          <aside className={[classes.subtitle, classes.spaceTop].join(' ')}>
            <h3>関連サービス一覧</h3>
            <LinkList list={relatedServices} linkFunction={s => `/services/${s.key}`} />
          </aside>
        </Container>
        <Footer rootClass={classes.footerRoot} />
        <QueryDialog open={!!this.state.open} serviceKey={service.key} onClose={() => this.props.history.replace(currentPath)} specialSent={this.state.specialSent} initialZip={this.state.zip} />
      </div>
    )
  }
}
