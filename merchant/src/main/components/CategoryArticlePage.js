import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { withAMP } from 'contexts/amp'

import { loadCategoryArticle, unload } from 'modules/article'
import Loading from 'components/Loading'
import OGPMeta from 'components/OGPMeta'
import ZipBox from 'components/ZipBox'
import Container from 'components/Container'
import BreadCrumb from 'components/BreadCrumb'
import ArticleContents from 'components/wp/ArticleContents'
import ThreeStep from 'components/ThreeStep'
import ArticleCategoryTree from 'components/wp/ArticleCategoryTree'
import PopularArticleList from 'components/wp/PopularArticleList'
import RelatedPost from 'components/wp/RelatedPost'
import Footer from 'components/Footer'
import SelectService from 'components/SelectService'
import QueryDialog from 'components/cards/QueryDialog'
import StickyBar from 'components/StickyBar'
import LPBanner from 'components/LPBanner'
import LinkList from 'components/LinkList'
import GAEventTracker from 'components/GAEventTracker'
import WPTracker from 'components/wp/WPTracker'
import { webOrigin, GAEvent } from '@smooosy/config'
const { category: { dialogOpen }, pageType } = GAEvent


@withAMP
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
  main: {
    paddingTop: '40px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: '20px',
    },
  },
  breadcrumbs: {
    marginBottom: 10,
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
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
    [theme.breakpoints.down('sm')]: {
      width: '95%',
      margin: '0 auto 10px',
    },
  },
  spaceTop: {
    marginTop: 10,
  },
  sideThreeStep: {
    display: 'block',
  },
  button: {
    minHeight: 50,
    fontSize: 16,
  },
}))
@connect(
  state => ({
    wpInfo: state.article.wpInfo,
  }),
  { loadCategoryArticle, unload }
)
// This renders pages like `/t/photographers/media`
export default class CategoryArticlePage extends React.Component {
  constructor(props) {
    super(props)
    const state = props.location.state || qs.parse(props.location.search.slice(1))
    this.state = {
      selectModal: !!(state && state.modal),
      zip: state ? state.zip : null,
      dialogService: state && state.service ? state.service : null,
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
        selectModal: !!(state && state.modal),
        zip: state ? state.zip : null,
        dialogService: state && state.service ? state.service : null,
      })
    }
  }

  load = () => {
    const { id, key } = this.props.match.params
    const isPickup = /\/pickups\//.test(this.props.location.pathname)
    this.props.loadCategoryArticle(id, key, isPickup)
      .catch(() => this.props.history.replace(`/t/${key}`))
  }

  componentDidMount() {
    if (Object.keys(this.props.wpInfo).length === 0) {
      this.load()
    }
    window.hj && window.hj('trigger', 'CategoryArticlePage')
  }

  componentWillUnmount() {
    this.props.unload()
  }

  onSelect = service => {
    if (service.matchMoreEnabled) {
      const { zip } = this.state
      this.props.history.push(`/instant-results?serviceId=${service.id}${zip ? `&zip=${zip}` : ''}`)
    } else {
      const { profiles } = this.props.wpInfo
      const state = this.props.location.state || qs.parse(this.props.location.search.slice(1))
      let specialSent = profiles.find(profile => profile.id === state.sp)
      specialSent = specialSent && specialSent.services.includes(service.id) ? specialSent : null

      this.setState({
        dialogService: service.key,
        specialSent,
        selectModal: false,
      })
    }
  }

  queryClose = () => {
    this.setState({dialogService: null, specialSent: null})
    this.props.history.replace(this.props.location.pathname)
  }

  onZipEnter = (zip, pos) => {
    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    this.setState({zip})
    this.props.history.replace(`${currentPath}?modal=true${zip ? `&zip=${zip}` : ''}&source=zipbox&pos=${pos}`)
  }

  render() {
    const { wpInfo, classes } = this.props
    if (Object.keys(wpInfo).length === 0) return  <Loading />

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
      category,
      services,
      reviewInfo,
      relatedServices,
      prefLocationServices,
    } = wpInfo

    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    const currentURL = webOrigin + currentPath

    const articleType = marusen ? 'pickups' : 'media'
    const breadcrumbs = [{path: '/', text: 'SMOOOSYトップ'}]
    breadcrumbs.push({path: '/media', text: 'メディアトップ'})
    breadcrumbs.push({path: `/t/${category.key}/media`, text: `${category.name}の記事一覧`})
    breadcrumbs.push({path: `/t/${category.key}/${articleType}/${articleId}`, text: title})

    const CoverContent = () => (
      <>
        <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={shareImage} />
        <div className={[classes.fullSize, classes.mask].join(' ')} />
        <div className={classes.coverText}>
          <h1 className={classes.title}>
            {title}
          </h1>
          <ZipBox
            title={zipTitle || `ぴったりの${category.name}をさがす`}
            gaEvent={{
              category: dialogOpen,
              action: pageType.CategoryArticlePage,
              label: category.key,
            }}
            currentPath={currentPath}
            onEnter={zip => this.onZipEnter(zip, 'cover')}
          />
        </div>
      </>
    )

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <OGPMeta
          title={title}
          description={meta.yoast_wpseo_metadesc || ''}
          url={currentURL}
          shareImage={wpInfo.shareImage}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='Article'
          rating={reviewInfo}
          published={published}
          modified={modified}
          author={author}
        />
        <div className={classes.header}>
          <CoverContent />
        </div>
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
                  serviceOrCategory={category}
                  pageType={pageType.CategoryArticlePage}
                  currentPath={currentPath}
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
                  action={pageType.CategoryArticlePage}
                  label={category.key}
                >
                  <Button variant='contained' color='primary' component={Link} to={`${currentPath}?modal=true&source=sticky_button`} className={classes.button}>
                    {category.name}のプロをさがす
                  </Button>
                </GAEventTracker>
              </div>
            </aside>
          </div>
        </Container>
        <StickyBar direction='bottom'>
          <LPBanner
            serviceOrCategoryKey={category.key}
            gaEvent={{
              category: dialogOpen,
              action: pageType.CategoryArticlePage,
              label: category.key,
            }}
            to={`${currentPath}?modal=true&source=slidein_banner`}
            />
        </StickyBar>
        <Container gradient maxWidth={1200}>
          <aside className={classes.subtitle}>
            <h3>おすすめ記事</h3>
            <RelatedPost posts={relatedPosts} />
          </aside>
          <aside className={[classes.subtitle, classes.spaceTop].join(' ')}>
            <h3>関連サービス一覧</h3>
            <LinkList list={relatedServices} linkFunction={s => `/services/${s.key}`} />
          </aside>
        </Container>
        <Footer rootClass={classes.footerRoot} />
        <SelectService open={!!this.state.selectModal} services={services} title='どのようなサービスをお探しですか？' label='次へ' onClose={() => this.props.history.replace(currentPath)} onSelect={this.onSelect} />
        <QueryDialog open={!!this.state.dialogService} serviceKey={this.state.dialogService} onClose={this.queryClose} specialSent={this.state.specialSent ? this.state.specialSent.id : null} initialZip={this.state.zip} />
      </div>
    )
  }
}
