import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Hidden } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { spFetch, spUnload } from 'modules/service'
import { open as openSnack } from 'modules/snack'
import { sendLog } from 'modules/auth'
import OGPMeta from 'components/OGPMeta'
import Loading from 'components/Loading'
import Conversion from 'components/Conversion'
import Container from 'components/Container'
import ThreeStep from 'components/ThreeStep'
import Footer from 'components/Footer'
import QueryDialog from 'components/cards/QueryDialog'
import BreadCrumb from 'components/BreadCrumb'
import ServiceValues from 'components/ServiceValues'
import LocationList from 'components/LocationList'
import LinkList from 'components/LinkList'
import GridPageLayout from 'components/GridPageLayout'
import { withAMP } from 'contexts/amp'
import { getActionURL } from 'lib/servicePage'
import { webOrigin, imageSizes, seo, GAEvent, BQEventTypes } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent
const TRUNCATE_HEIGHT = 360


@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  paddingText: {
    width: '100%',
    margin: '0px auto',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
  breadCrumb: {
    padding: '10px 0',
  },
  // for RenderAbout
  truncateFixedHeight: {
    minHeight: TRUNCATE_HEIGHT - 1,
    maxHeight: TRUNCATE_HEIGHT + 1,
  },
}))
@connect(
  state => ({
    services: state.service.allServices,
    user: state.auth.user,
    service: state.service.spInfo.service,
    category: state.service.spInfo.category || {},
    profiles: state.service.spInfo.profiles || [],
    leads: state.service.spInfo.leads || [],
    media: state.service.spInfo.media || [],
    children: state.service.spInfo.children || [],
    price: state.service.spInfo.price || {},
    request: state.service.spInfo.request,
    reviewInfo: state.service.spInfo.reviewInfo,
    relatedServices: state.service.spInfo.relatedServices,
    recommendArticles: state.service.spInfo.recommendArticles,
    locationCategories: state.service.spInfo.locationCategories,
  }),
  { spFetch, spUnload, openSnack, sendLog }
)
export default class ServiceTopPage extends React.Component {

  constructor(props) {
    super(props)
    const state = props.location.state || qs.parse(props.location.search.slice(1))
    this.state = {
      open: !!(state && state.modal),
      specialSent: state ? state.sp : null,
      zip: state ? state.zip : null,
      fromAMP: !!state.ampId, // AMP経由時はampId存在する
    }
  }

  componentDidMount() {
    if (!this.props.service) { /// already have data by SSR
      this.load(this.props)
    }
    window.hj && window.hj('trigger', 'ServicePage')
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.props.spUnload()
      this.load(this.props)
    }
    if (this.props.location.search !== prevProps.location.search) {
      const state = qs.parse(this.props.location.search.slice(1))
      this.setState({
        open: !!(state && state.modal),
        specialSent: state ? state.sp : null,
        fromAMP: false,
      })
    }
  }

  componentWillUnmount() {
    this.props.spUnload()
  }

  load = async (props) => {
    const { match: { params: { key } } } = props

    const res = await this.props.spFetch({key})
      .catch(() => this.props.history.replace('/'))

    if (!res || !res.spInfo) return
    const service = res.spInfo.service
    if (service.deleted) {
      return this.props.history.replace(`/t/${res.spInfo.category.key}`)
    }
  }

  onZipEnter = (zip, pos, dateTime) => {
    const {
      match: { params: { key } },
      location,
    } = this.props

    let service = this.props.service
    if (!service) {
      service = this.props.services.find(s => s.key === key)
      if (!service) return this.props.openSnack('読み込み中です。しばらくお待ち下さい')
    }

    this.setState({zip})
    const actionURL = getActionURL({ location, service, zip, pos, dateTime })

    if (service.matchMoreEnabled) {
      this.props.sendLog(BQEventTypes.match_more.CLICK_SP_TOP_SEARCH, {
        zip,
        serviceId: service._id,
      })
      this.props.history.push(actionURL)
    } else {
      this.props.history.replace(actionURL)
    }
  }

  render() {
    let service = this.props.service
    const {
      category, profiles, leads, media, children, price, request, reviewInfo,
      user, classes, match, relatedServices, recommendArticles,
      locationCategories,
    } = this.props
    const { params: { key } } = match
    const { fromAMP } = this.state

    // ampの場合元ページのpathとURLが代入される
    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')

    if (!service) {
      if (!this.props.services.length) return <Loading />

      service = this.props.services.find(s => s.key === key)
      if (!service) return <Loading />
    }

    const breadcrumbs = [
      {path: '/', text: 'SMOOOSYトップ'},
      {path: `/t/${category.key}`, text: category.name},
      {path: `/services/${service.key}`, text: service.name},
    ]

    if (request) {
      let featureIndex = null
      let featureMeet
      for (let i in request.meets) {
        if (request.meets[i].feature) {
          featureIndex = i
          featureMeet = request.meets[i]
          break
        }
      }
      if (featureIndex !== null) {
        request.meets.splice(featureIndex, 1)
        request.meets.splice(Math.ceil(request.meets.length / 2), 0, featureMeet)
      }
      const fixed = request.meets.filter(m => m.priceType === 'fixed')
      request.averagePrice = fixed.length ? Math.floor(fixed.reduce((sum, m) => sum + m.price, 0) / fixed.length / 100) * 100 : 0
    }

    const matchMorePath = service.matchMoreEnabled ? `/instant-results?serviceId=${service.id}` : null

    if (fromAMP && !!this.state.open) {
      return (
        <div className={classes.root}>
          <FirstView service={service} category={category} currentPath={currentPath} matchMorePath={matchMorePath} reviewInfo={reviewInfo}  onZipEnter={this.onZipEnter} profileCount={profiles.length} />
          <QueryDialog open={!!this.state.open} serviceKey={service.key} onClose={() => this.props.history.replace(currentPath)} specialSent={this.state.specialSent} initialZip={this.state.zip} />
        </div>
      )
    }

    if (!service.pageLayout || service.pageLayout.layout.length === 0) {
      // TBD: spContentTopFlagを消す

      // ------spContentTopFlagあり-------
      // pageInfomation
      // price
      // pickupMedia+Zip
      // pickupProfiles
      // proAnswers
      // requestExample+Zip
      // whatIs
      // pickupMedia+Zip
      // proMedia
      // articleSiteMedia

      // ------spContentTopFlagなし-------
      // pageDescription
      // price
      // pickupMedia+Zip
      // pickupProfiles
      // proAnswers
      // requestExample+Zip
      // whatIs
      // pickupMedia+Zip
      // proMedia
      // pageInfomation
      // articleSiteMedia

      const layout = []
      if (service.spContentTopFlag && (service.pageInformation || []).length > 0) {
        layout.push({'type': 'pageInformation', 'options': {'price': true, 'pickupMedia': true, 'zipbox': true}})
      } else {
        layout.push({'type': 'pageDescription', 'options': {'price': true, 'pickupMedia': true, 'zipbox': true}})
      }

      layout.push({'type': 'pickupProfiles'})
      layout.push({'type': 'pickupProAnswers'})
      layout.push({'type': 'requestExample', 'options': {'zipbox': true}})
      layout.push({'type': 'whatIs', 'options': {'pickupMedia': true, 'zipbox': true}})
      layout.push({'type': 'proMedia'})
      if (!service.spContentTopFlag && (service.pageInformation || []).length > 0) {
        layout.push({'type': 'pageInformation'})
      }
      layout.push({'type': 'mediaSiteArticles'})
      service.pageLayout = { layout }
    }

    const isFocus = seo.focusCategories.includes(category.key)

    return (
      <div className={classes.root}>
        <FirstView service={service} category={category} currentPath={currentPath} matchMorePath={matchMorePath} reviewInfo={reviewInfo} onZipEnter={this.onZipEnter} profileCount={profiles.length} />
        <div>
          <Hidden implementation='css' xsDown>
            <Container>
              <BreadCrumb breads={breadcrumbs} />
            </Container>
          </Hidden>
          <GridPageLayout
            service={service}
            onZipEnter={this.onZipEnter}
            currentPath={currentPath}
            matchMoreEnabled={!!matchMorePath}
            pageType={pageType.ServicePage}
            pageLayout={service.pageLayout}
            ZipBoxProps={{
              gaEvent: {
                category: dialogOpen,
                action: pageType.ServicePage,
                label: service.key,
              },
              service: matchMorePath ? service : null,
              currentPath: matchMorePath || currentPath,
              onEnter: zip => this.onZipEnter(zip, 'price'),
              position: 'price', // for onlySSR
            }}
            priceProps={{
              price,
              service,
            }}
            pickupProfilesProps={{
              truncateHeight: TRUNCATE_HEIGHT,
              customClasses: {fixedHeight: classes.truncateFixedHeight},
              service,
              profiles,
              leads,
              buttonProps: (p) => ({component: Link, to: matchMorePath ? matchMorePath : `${currentPath}?modal=true&sp=${p.id}&source=profile`}),
              category: dialogOpen,
              action: pageType.ServicePage,
              label: service.key,
            }}
            pickupProAnswersProps={{
              proQuestions: service.proQuestions,
            }}
            requestExampleProps={{
              request,
              service,
            }}
            pageDescriptionProps={{
              service,
              description: service.pageDescription ?  service.pageDescription.replace(/{{location([^}]*)}}/g, '') : '',
            }}
            pageInformationProps={{
              pageInformation: service.pageInformation,
            }}
            proMediaProps={{
              service,
              media,
              gaEvent: {
                category: dialogOpen,
                action: pageType.ServicePage,
                label: service.key,
              },
              user,
              currentPath,
            }}
            pickupMediaProps={{
              pickupMedia: service.pickupMedia || [],
            }}
            articleProps={{
              articles: recommendArticles,
            }}
          />
        </div>
        <Hidden implementation='css' smUp>
          <Container className={classes.breadCrumb}>
            <BreadCrumb breads={breadcrumbs} />
          </Container>
        </Hidden>
        {children.length > 0 &&
          <Container type='aside'>
            <div className={classes.paddingText}>
              <LocationList
                title={`全国の${service.providerName || 'プロ'}を探す`}
                base={currentPath}
                list={children.filter(l => !l.isGroup)}
              />
            </div>
          </Container>
        }
        <Container type='aside'>
          <div className={classes.paddingText}>
            <h3>関連サービスの{category.providerName}を探す</h3>
            <LinkList list={relatedServices} linkFunction={s => `/services/${s.key}`} />
          </div>
        </Container>
        {isFocus && locationCategories && locationCategories.length > 0 &&
          <Container type='aside'>
            <div className={classes.paddingText}>
              <h3>近隣の{category.providerName}を探す</h3>
              <LinkList
                list={locationCategories.map(l => ({
                  key: l.key,
                  name: `${l.name.replace(/(都|府|県)$/g, '')}の${category.name}`,
                }))}
                linkFunction={s => `/t/${category.key}/${s.key}`}
              />
            </div>
          </Container>
        }
        <Footer />
        <QueryDialog open={!!this.state.open} serviceKey={service.key} onClose={() => this.props.history.replace(currentPath)} specialSent={this.state.specialSent} initialZip={this.state.zip} />
      </div>
    )

  }
}


let FirstView = ({service, category, currentPath, matchMorePath, reviewInfo, onZipEnter, profileCount, classes}) => {
  let title = ''
  if (service.pageTitle) {
    title = service.pageTitle.replace(/{{name}}/g, service.name)
    title = title.replace(/{{location([^}]*)}}/g, '')
    title = title.replace(/{{profileCount([^}]*)}}/g, (m, c1) => profileCount && profileCount >= seo.titleProfileCountMin ? profileCount + c1 : '')
  } else {
    title = `${service.name}【口コミ・料金で比較】`
  }
  const keywords = '' + service.tags.join(',')
  const pageMetaDescription = service.pageMetaDescription ? service.pageMetaDescription.replace(/{{location([^}]*)}}/g, '') : `${service.name}を無料で一括見積もり。あなたのこだわり・要望に合わせて${service.providerName}が最適な提案・見積もりをしてくれます。${service.name}はSMOOOSYで。`
  const currentURL = webOrigin + currentPath

  const defaultProps = {
    service, onZipEnter, currentPath, matchMoreEnabled: !!matchMorePath, ga: {pageType: pageType.ServicePage}, position: 'cover',
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='keywords' content={keywords} />
      </Helmet>
      <OGPMeta
        title={title}
        description={pageMetaDescription}
        url={currentURL}
        shareImage={service.image + imageSizes.ogp}
        width={1200}
        height={630}
        twitterCard='summary_large_image'
        structuredDataType='LocalBusiness'
        rating={reviewInfo}
        category={category && category.key}
        service={service && service.key}
      />
      <div className={classes.header}>
        <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={service.image + imageSizes.cover} />
        <div className={[classes.fullSize, classes.mask].join(' ')} />
        <div className={[classes.fullSize, classes.coverText].join(' ')}>
          <h1 className={classes.name}>
            <p>{service.name}</p>
          </h1>
          <div className={classes.description}>{service.description}</div>
            <Conversion
              {...defaultProps}
            />
          </div>
        <ServiceValues />
      </div>
      <Container className={classes.threeStep}>
        <ThreeStep providerName={service.providerName} />
      </Container>
    </>
  )
}

FirstView = withStyles((theme) => ({
  header: {
    position: 'relative',
    height: '100vh',
    background: theme.palette.grey[100],
    overflow: 'hidden',
  },
  fullSize: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cover: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    background: theme.palette.grey[500],
  },
  mask: {
    background: 'rgba(0, 0, 0, .5)',
  },
  coverText: {
    padding: '100px 15px 110px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '70px 15px 80px',
    },
  },
  name: {
    fontSize: 36,
    color: theme.palette.common.white,
    zIndex: 10,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      fontSize: 26,
    },
  },
  description: {
    fontSize: 18,
    color: theme.palette.common.white,
    zIndex: 10,
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    marginBottom: 10,
    padding: '0px 8px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  threeStep: {
    background: theme.palette.grey[200],
    padding: 0,
  },
  zipBox: {
    maxWidth: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      maxWidth: 300,
    },
  },
  zipBoxFont: {
    paddingLeft: 15,
    paddingRight: 15,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  zipInput: {
    height: 60,
    [theme.breakpoints.down('xs')]: {
      height: 55,
    },
  },
  zipInputFont: {
    fontSize: 18,
  },
  zipButton: {
    height: 60,
    [theme.breakpoints.down('xs')]: {
      height: 55,
    },
  },
}))(FirstView)

FirstView = withAMP(FirstView)
