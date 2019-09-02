import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Hidden } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { withAMP } from 'contexts/amp'

import { spFetch, spUnload } from 'modules/service'
import { open as openSnack } from 'modules/snack'
import OGPMeta from 'components/OGPMeta'
import ThreeStep from 'components/ThreeStep'
import BreadCrumb from 'components/BreadCrumb'
import ServiceValues from 'components/ServiceValues'
import Loading from 'components/Loading'
import Conversion from 'components/Conversion'
import Container from 'components/Container'
import Footer from 'components/Footer'
import QueryDialog from 'components/cards/QueryDialog'
import LocationList from 'components/LocationList'
import LinkList from 'components/LinkList'
import GridPageLayout from 'components/GridPageLayout'
import { LazyLoadImage } from 'components/LazyLoad'
import { getActionURL } from 'lib/servicePage'
import { webOrigin, imageSizes, prefectures, seo, GAEvent } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent

@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  contents: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: '24px 0 32px',
    [theme.breakpoints.down('xs')]: {
      padding: '16px 0',
    },
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
}))
@connect(
  state => ({
    services: state.service.allServices,
    user: state.auth.user,
    service: state.service.spInfo.service,
    profiles: state.service.spInfo.profiles || [],
    leads: state.service.spInfo.leads || [],
    media: state.service.spInfo.media || [],
    locationService: state.service.spInfo.locationService,
    parents: state.service.spInfo.parents || [],
    brothers: state.service.spInfo.brothers || [],
    children: state.service.spInfo.children || [],
    request: state.service.spInfo.request,
    relatedServices: state.service.spInfo.relatedServices,
    price: state.service.spInfo.price || {},
    category: state.service.spInfo.category,
    reviewInfo: state.service.spInfo.reviewInfo,
    recommendArticles: state.service.spInfo.recommendArticles,
    locationRelatedServices: state.service.spInfo.locationRelatedServices,
    locationCategories: state.service.spInfo.locationCategories,
  }),
  { spFetch, spUnload, openSnack }
)
export default class ServicePage extends React.Component {
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
    if (!this.props.service) { // already have data by SSR
      this.load()
    }
    window.hj && window.hj('trigger', 'ServicePage')
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.props.spUnload()
      this.load()
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

  load = () => {
    const { location: { search }, match: { params: { key, pref, city, town } } } = this.props

    let parentPath = `/services/${key}`
    if (city) parentPath += `/${pref}`
    if (town) parentPath += `/${city}`
    this.props.spFetch({key, pref, city, town})
      .catch(() => this.props.history.replace(parentPath + search, this.props.location.state))
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
    const actionURL = getActionURL({ location, service, zip, defaultZip: this.getDefaultZip(), pos, dateTime })

    if (service.matchMoreEnabled) {
      this.props.history.push(actionURL)
    } else {
      this.props.history.replace(actionURL)
    }
  }

  getDefaultZip = () => {
    const { service, locationService, match: { params: { city, town } } } = this.props
    const defaultZip = (service.matchMoreEnabled && locationService && (city || town)) ? this.props.locationService.path.replace(/,/g, '') : ''
    return defaultZip
  }

  render() {
    let service = this.props.service
    const {
      profiles, leads, media, locationService, parents, brothers, children, price, request,
      user, classes, match, category, reviewInfo, relatedServices, recommendArticles,
      locationRelatedServices, locationCategories,
    } = this.props
    const { params: { key, pref, city, town } } = match
    const { fromAMP } = this.state

    // ampの場合元ページのpathとURLが代入される
    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')

    if (!locationService) return <Loading />

    if (!service) {
      if (!this.props.services.length) return <Loading />

      service = this.props.services.find(s => s.key === key)
      if (!service) return <Loading />
    }

    let prefName = ''
    if (pref) {
      for (const key in prefectures) {
        if (pref === prefectures[key]) {
          prefName = key
          break
        }
      }
    }

    const prefNameWithoutSuffix = prefName.replace(/(都|府|県)$/g, '')
    const cityName = town ? locationService.parentName : city ? locationService.name : null
    const areaName = (city || town) ? locationService.name : locationService.name.replace(/(都|府|県)$/g, '')
    const areaNameDesc = town ? locationService.name + `(${prefName})` : city && locationService.code ? locationService.parentName + locationService.name : locationService.name

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
    const defaultZip = this.getDefaultZip()

    const breadcrumbs = [{path: '/', text: 'SMOOOSYトップ'}]
    if (category) breadcrumbs.push({path: `/t/${category.key}`, text: category.name})
    breadcrumbs.push({path: `/services/${key}`, text: service.name})

    if (town) {
      breadcrumbs.push(
        {path: `/services/${key}/${pref}`, text: prefName},
        {path: `/services/${key}/${pref}/${locationService.parentKey}`, text: `${locationService.parentName}の${service.name}`},
        {path: `/services/${key}/${pref}/${locationService.parentKey}/${locationService.key}`, text: `${locationService.name}の${service.name}`}
      )
    } else if (locationService && locationService.parentKey !== 'japan') {
      breadcrumbs.push(
        {path: `/services/${key}/${locationService.parentKey}`, text: `${locationService.parentName}の${service.name}`},
        {path: `/services/${key}/${locationService.parentKey}/${locationService.key}`, text: `${locationService.name}の${service.name}`}
      )
    } else if (locationService) {
      breadcrumbs.push(
        {path: `/services/${key}/${locationService.key}`, text: `${locationService.name}の${service.name}`}
      )
    }

    if (fromAMP && !!this.state.open) {
      return (
        <div className={classes.root}>
          <FirstView
            service={service}
            category={category}
            currentPath={currentPath}
            matchMorePath={matchMorePath}
            prefName={prefName}
            cityName={cityName}
            areaName={areaName}
            areaNameDesc={areaNameDesc}
            reviewInfo={reviewInfo}
            onZipEnter={this.onZipEnter}
            defaultZip={defaultZip}
            profileCount={profiles.length}
           />
          <QueryDialog open={!!this.state.open} serviceKey={service.key} onClose={() => this.props.history.replace(currentPath)} specialSent={this.state.specialSent} initialZip={this.state.zip} />
        </div>
      )
    }

    if (!service.pageLayout || service.pageLayout.layout.length === 0) {
      const layout = []
      layout.push({'type': 'pageDescription', 'options': {'price': true, 'pickupMedia': true, 'zipbox': true}})
      layout.push({'type': 'pickupProfiles'})
      layout.push({'type': 'pickupProAnswers'})
      layout.push({'type': 'requestExample', 'options': {'zipbox': true}})
      layout.push({'type': 'whatIs', 'options': {'pickupMedia': true, 'zipbox': true}})
      layout.push({'type': 'proMedia'})
      layout.push({'type': 'mediaSiteArticles'})
      service.pageLayout = { layout }
    }

    const isFocus = seo.focusCategories.includes(category.key)
    return (
      <div className={classes.root}>
        <FirstView
          service={service}
          category={category}
          currentPath={currentPath}
          matchMorePath={matchMorePath}
          prefName={prefName}
          cityName={cityName}
          areaName={areaName}
          areaNameDesc={areaNameDesc}
          reviewInfo={reviewInfo}
          onZipEnter={this.onZipEnter}
          defaultZip={defaultZip}
          profileCount={profiles.length}
        />
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
        <Area parents={parents} brothers={brothers} subs={children} currentPath={currentPath} category={category} service={service} city={city} town={town} prefName={prefNameWithoutSuffix} />
        {isFocus && locationCategories && locationCategories.length > 0 &&
          <Container type='aside'>
            <div className={classes.paddingText}>
              <h3>{`${prefNameWithoutSuffix}近隣の${category.providerName}を探す`}</h3>
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
        <Container type='aside'>
          <div className={classes.paddingText}>
            {isFocus && locationRelatedServices && locationRelatedServices.length > 0 ?
              <>
                <h3>{`${prefNameWithoutSuffix}の関連サービス一覧`}</h3>
                <LinkList
                  list={locationRelatedServices.map(l => ({
                    key: l.service.key,
                    name: isFocus && pref ? `${prefNameWithoutSuffix}の${l.service.name}` : l.service.name,
                  }))}
                  linkFunction={s => `/services/${s.key}${isFocus && pref ? `/${pref}` : ''}`}
                />
              </>
              : <>
                <h3>{isFocus ?
                  '関連サービス一覧' :
                  `関連サービスから${category.providerName || 'プロ'}を探す`
                }</h3>
                <LinkList
                  list={relatedServices}
                  linkFunction={s => `/services/${s.key}`}
                />
            </>
          }
          </div>
        </Container>
        <Footer />
        <QueryDialog open={!!this.state.open} serviceKey={service.key} onClose={() => this.props.history.replace(currentPath)} specialSent={this.state.specialSent} initialZip={this.state.zip} />
      </div>
    )
  }
}

let FirstView = ({service, category, currentPath, matchMorePath, prefName, cityName, areaName, areaNameDesc, reviewInfo, onZipEnter, defaultZip, profileCount, classes}) => {

  let title = ''
  if (service.pageTitle) {
    title = service.pageTitle.replace(/{{name}}/g, service.name)
    title = title.replace(/{{location([^}]*)}}/g, (m, c1) => areaName + c1)
    title = title.replace(/{{profileCount([^}]*)}}/g, (m, c1) => profileCount && profileCount >= seo.titleProfileCountMin ? profileCount + c1 : '')
  } else {
    title = `${areaName}の${service.name}【口コミ・料金で比較】`
  }
  const currentURL = webOrigin + currentPath
  const keywords = areaName + ',' + service.tags.join(',')
  const pageMetaDescription = service.pageMetaDescription ? service.pageMetaDescription.replace(/{{location([^}]*)}}/g, (m, c1) => areaNameDesc + c1) : `${areaNameDesc}の${service.name}を無料で一括見積もり。あなたのこだわり・要望に合わせて${service.providerName}が最適な提案・見積もりをしてくれます。${service.name}はSMOOOSYで。`

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
        addressRegion={prefName}
        addressLocality={cityName}
      />
      <div className={classes.header}>
        <LazyLoadImage layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={service.image + imageSizes.cover} />
        <div className={[classes.fullSize, classes.mask].join(' ')} />
        <div className={[classes.fullSize, classes.coverText].join(' ')}>
          <h1 className={classes.name}>
            <Hidden implementation='css' smUp>
              <p>{`${areaName}の`}</p>
              <p>{service.name}</p>
            </Hidden>
            <Hidden implementation='css' xsDown>
              {`${areaName}の${service.name}`}
            </Hidden>
          </h1>
          <div className={classes.description}>{service.description}</div>
            <Conversion
              service={service}
              onZipEnter={onZipEnter}
              defaultZip={defaultZip}
              currentPath={currentPath}
              matchMoreEnabled={!!matchMorePath}
              ga={{
                pageType: pageType.ServicePage,
              }}
              position='cover'
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

let Area = ({parents, brothers, subs, currentPath, category, service, city, town, prefName, classes}) => {
  const proStr = `${service.providerName || 'プロ'}`
  const isFocus = seo.focusCategories.includes(category.key)
  const cityName = city ? '駅' : '市区町村'
  const townName = town ? '駅' : city ? '市区町村' : '都道府県'

  return (
  <>
    {parents.length + brothers.length + subs.length > 0 &&
      <Container>
        <div className={classes.paddingText}>
          <LocationList
            title={isFocus ? '都道府県一覧' : `都道府県から${proStr}を探す`}
            base={`/services/${service.key}`}
            list={parents}
          />
          <LocationList
            title={isFocus ? '地域一覧' : `地域から${prefName}の${proStr}を探す`}
            base={currentPath.split('/').slice(0, -1).join('/')}
            list={brothers.filter(l => l.isGroup)}
          />
          <LocationList
            title={isFocus ? `${townName}一覧` : `${townName}から${prefName}の${proStr}を探す`}
            base={currentPath.split('/').slice(0, -1).join('/')}
            list={brothers.filter(l => !l.isGroup)}
          />
          <LocationList
            title={isFocus ? '地域一覧' : `地域から${prefName}の${proStr}を探す`}
            base={currentPath}
            list={subs.filter(l => l.isGroup)}
          />
          <LocationList
            title={isFocus ? `${cityName}一覧` : `${cityName}から${prefName}の${proStr}を探す`}
            base={currentPath}
            list={subs.filter(l => !l.isGroup)}
          />
        </div>
      </Container>
    }
  </>
  )
}

Area = withStyles((theme) => ({
  paddingText: {
    width: '100%',
    margin: '0px auto',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
}))(Area)
