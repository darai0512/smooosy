import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import { Hidden } from '@material-ui/core'

import { cpFetch, cpUnload } from 'modules/category'
import OGPMeta from 'components/OGPMeta'
import Loading from 'components/Loading'
import ZipBox from 'components/ZipBox'
import Container from 'components/Container'
import SubHeader from 'components/SubHeader'
import LPButton from 'components/LPButton'
import ThreeStep from 'components/ThreeStep'
import PickupProfiles from 'components/PickupProfiles'
import ServicePapers from 'components/ServicePapers'
import RequestPaper from 'components/RequestPaper'
import MeetPapers from 'components/MeetPapers'
import Footer from 'components/Footer'
import SelectService from 'components/SelectService'
import QueryDialog from 'components/cards/QueryDialog'
import BreadCrumb from 'components/BreadCrumb'
import ServiceValues from 'components/ServiceValues'
import LocationList from 'components/LocationList'
import GridPageInformation from 'components/GridPageInformation'
import MediaSiteArticles from 'components/MediaSiteArticles'
import LinkList from 'components/LinkList'
import GAEventTracker from 'components/GAEventTracker'
import { LazyLoadImage } from 'components/LazyLoad'
import { prefectures, webOrigin, imageSizes } from '@smooosy/config'
import { GAEvent, seo } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent


@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  header: {
    position: 'relative',
    height: '100vh',
    background: theme.palette.grey[100],
    overflow: 'hidden',
  },
  subHeader: {
    maxWidth: 1060,
    margin: '0 auto',
  },
  container: {
    maxWidth: 1080,
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
  mask: {
    background: 'rgba(0, 0, 0, .5)',
  },
  threeStep: {
    background: theme.palette.grey[200],
    padding: 0,
  },
  breadcrumb: {
    paddingBottom: 0,
  },
  pageDescription: {
    width: '90%',
    margin: '0px auto',
    padding: 10,
    fontSize: 15,
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  descLine: {
    margin: '15px 0',
  },
  areaName: {
    fontSize: 22,
    display: 'block',
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
  name: {
    color: theme.palette.common.white,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    marginBottom: 30,
    zIndex: 10,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 10,
    },
  },
  title: {
    fontSize: 35,
    display: 'block',
  },
  paper: {
    margin: '20px auto 40px',
  },
  request: {
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  lpbutton: {
    textAlign: 'center',
  },
  reason: {
    width: '100%',
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
  reasonTitle: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  reasonLink: {
    marginRight: 10,
  },
  reasonChild: {
    margin: '5px 0',
    fontWeight: 'bold',
  },
  paddingText: {
    width: '100%',
    margin: '0px auto',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
}))
@connect(
  state => ({
    category: state.category.cpInfo.category,
    services: state.category.cpInfo.services,
    profiles: state.category.cpInfo.profiles,
    leads: state.category.cpInfo.leads,
    locationService: state.category.cpInfo.locationService,
    brothers: state.category.cpInfo.brothers,
    children: state.category.cpInfo.children,
    request: state.category.cpInfo.request,
    categories: state.category.cpInfo.categories,
    reviewInfo: state.category.cpInfo.reviewInfo,
    recommendArticles: state.category.cpInfo.recommendArticles,
    prefLocationServices: state.category.cpInfo.prefLocationServices,
  }),
  { cpFetch, cpUnload }
)
export default class CategoryPage extends React.Component {
  constructor(props) {
    super(props)
    const state = props.location.state || qs.parse(props.location.search.slice(1))

    this.state = {
      selectModal: !!(state && state.modal),
      zip: state ? state.zip : null,
      dialogService: state && state.service ? state.service : null,
    }
  }

  componentDidMount() {
    if (!this.props.category) { // already have data by SSR
      this.load(this.props)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.props.cpUnload()
      this.load(this.props)
    }

    if (this.props.location.search !== prevProps.location.search) {
      const state = qs.parse(this.props.location.search.slice(1))
      this.setState({
        selectModal: !!(state && state.modal),
        zip: state ? state.zip : null,
        dialogService: state && state.service ? state.service : null,
      })
    }
  }

  componentWillUnmount() {
    this.props.cpUnload()
  }

  load = (props) => {
    const { match: { params: { key, pref, city, town } } } = props

    this.props.cpFetch(key, pref, city, town)
      .catch(() => {
        const parentPath = town ? `/t/${key}/${pref}/${city}` : city ? `/t/${key}/${pref}` : pref ? `/t/${key}` : '/'
        this.props.history.replace(parentPath)
      })

  }

  onSelect = service => {
    if (service.matchMoreEnabled) {
      const { zip } = this.state
      const { locationService, match: { params: { city, town } } } = this.props
      const defaultZip = (locationService && (city || town)) ? this.props.locationService.path.replace(/,/g, '') : ''

      this.props.history.push(`/instant-results?serviceId=${service.id}&zip=${zip || ''}&defaultZip=${defaultZip}`)
    } else {
      const { profiles } = this.props
      const state = this.props.location.state || qs.parse(this.props.location.search.slice(1))
      let specialSent = profiles.filter(profile => profile.id === state.sp)[0]
      specialSent = specialSent && specialSent.services.indexOf(service.id) !== -1 ? specialSent : null

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

  onZipEnter = zip => {
    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    this.setState({zip})
    this.props.history.replace(`${currentPath}?modal=true${zip ? `&zip=${zip}` : ''}`)
  }

  render() {
    const {
      category, services, profiles, leads, locationService, children, brothers, request, categories, classes,
      match: { params: { key, pref, city, town } },
      reviewInfo, recommendArticles, prefLocationServices,
    } = this.props

    if (!services || !category) return <Loading />

    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    const currentURL = webOrigin + currentPath

    let prefName = ''
    if (pref) {
      for (const key in prefectures) {
        if (pref === prefectures[key]) {
          prefName = key
          break
        }
      }
    }

    const cityName = town ? locationService.parentName : city ? locationService.name : null
    const areaName = !locationService ? '' : (pref && !city && !town) ? locationService.name.replace(/(都|府|県)$/g, '') : locationService.name
    const areaNameDesc = !locationService ? '' : town ? locationService.name + `(${prefName})` : city && locationService.code ? locationService.parentName + locationService.name : locationService.name

    const breadcrumbs = [{path: '/', text: 'SMOOOSYトップ'}]
    if (town && locationService) {
      breadcrumbs.push(
        {path: `/t/${key}`, text: category.name},
        {path: `/t/${key}/${pref}`, text: `${prefName} ${category.name}`},
        {path: `/t/${key}/${pref}/${locationService.parentKey}`, text: `${locationService.parentName}の${category.name}`},
        {path: `/t/${key}/${pref}/${locationService.parentKey}/${locationService.key}`, text: `${locationService.name}の${category.name}`}
      )
    } else if (city && locationService) {
      breadcrumbs.push(
        {path: `/t/${key}`, text: category.name},
        {path: `/t/${key}/${locationService.parentKey}`, text: `${locationService.parentName}の${category.name}`},
        {path: `/t/${key}/${locationService.parentKey}/${locationService.key}`, text: `${locationService.name}の${category.name}`}
      )
    } else if (pref && locationService) {
      breadcrumbs.push(
        {path: `/t/${key}`, text: category.name},
        {path: `/t/${key}/${locationService.key}`, text: `${locationService.name}の${category.name}`}
      )
    } else {
      breadcrumbs.push({path: `/t/${key}`, text: category.name})
    }

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
    }

    let broKeys = []
    let bros = []
    for (let a of brothers) {
      if (broKeys.indexOf(a.key) !== -1) continue
      broKeys.push(a.key)
      bros.push(a)
    }
    let childKeys = []
    let childs = []
    for (let a of children) {
      if (childKeys.indexOf(a.key) !== -1) continue
      childKeys.push(a.key)
      childs.push(a)
    }

    let title = ''
    if (category.pageTitle) {
      title = category.pageTitle.replace(/{{category([^}]*)}}/g, (m, c1) => category.name + c1)
      title = title.replace(/{{location([^}]*)}}/g, (m, c1) => areaName ? areaName + c1 : '')
    } else {
      title = `${locationService ? areaName + 'の' : ''}${category.providerName}をさがす【口コミ・料金で比較】`
    }
    const keywords = (pref ? pref + ',' : '') + (city ? city + ',' : '') + category.name + ',プロ,見積もり'
    const service = services[0] || {}
    const shareImage = service.image + imageSizes.ogp
    const description = category.description ?  category.description.replace(/{{category([^}]*)}}/g, (m, c1) => category.name + c1) : `SMOOOSYで${category.providerName}を探しましょう。`
    const pageMetaDescription = category.pageMetaDescription ? category.pageMetaDescription.replace(/{{location([^}]*)}}/g, (m, c1) => areaNameDesc ? areaNameDesc + c1 : '').replace(/{{category([^}]*)}}/g, (m, c1) => category.name + c1) : `${areaNameDesc ? areaNameDesc + 'の' : ''}${category.name}の依頼を無料で一括見積もり。あなたのこだわり・要望に合わせて${category.providerName}が最適な提案・見積もりをしてくれます。`
    const pageDesc = category.pageDescription ? category.pageDescription.replace(/{{location([^}]*)}}/g, (m, c1) => areaNameDesc ? areaNameDesc + c1 : '').replace(/{{category([^}]*)}}/g, (m, c1) => category.name + c1) : ''
    const header = category.providerName + 'を見つけよう'

    const prefServices = prefLocationServices.map(pls => ({...pls.service, hasPref: true}))
    const serviceList = prefServices.length > 0 ? services.map(s => prefServices.find(ps => s.key === ps.key) || s) : services
    const hasAllPrefServices = prefServices.length === services.length

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{title}</title>
          <meta name='keywords' content={keywords} />
        </Helmet>
        <OGPMeta
          title={title}
          description={pageMetaDescription}
          url={currentURL}
          category={category && category.key}
          shareImage={shareImage}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='LocalBusiness'
          rating={reviewInfo}
          addressRegion={prefName}
          addressLocality={cityName}
        />
        <div className={classes.header}>
          <LazyLoadImage layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={services[0].image + imageSizes.cover} />
          <div className={[classes.fullSize, classes.mask].join(' ')} />
          <div className={[classes.fullSize, classes.coverText].join(' ')}>
            <Hidden implementation='css' smUp>
              <h1 className={classes.name}>
                <span className={classes.areaName}>{locationService ? `${areaName}の` : ''}</span>
                <span className={classes.title}>{header}</span>
              </h1>
            </Hidden>
            <Hidden implementation='css' xsDown>
              <h1 className={[classes.name, classes.title].join(' ')}>{locationService ? `${areaName}の${header}` : header}</h1>
            </Hidden>
            <div className={classes.description}>{description}</div>
            <ZipBox
              gaEvent={{
                category: dialogOpen,
                action: pageType.CategoryPage,
                label: category.key,
              }}
              currentPath={currentPath}
              onEnter={this.onZipEnter}
            />
          </div>
          <ServiceValues />
        </div>
        <Container className={classes.threeStep}>
          <ThreeStep />
        </Container>
        <Hidden implementation='css' xsDown>
          <Container className={classes.breadcrumb}>
            <BreadCrumb breads={breadcrumbs} />
          </Container>
        </Hidden>
        {locationService && profiles.length > 0 &&
          <Container type='section' gradient>
            <SubHeader>
              {areaName}の{category.providerName}トップ3
            </SubHeader>
            <PickupProfiles category={dialogOpen} action={pageType.CategoryPage} label={category.key} profiles={profiles.slice(0, 3)} buttonProps={p => ({component: Link, to: `${currentPath}?modal=true&sp=${p.id}`, rel: 'nofollow'})} />
          </Container>
        }
        {services.length > 0 &&
          <Container type='section' gradient>
            <SubHeader className={classes.subHeader}>{category.providerName}登録数、日本最大級！</SubHeader>
            <div className={classes.pageDescription}>
              {pageDesc &&
                pageDesc.split('\n').map((p, i) => <p key={i} className={classes.descLine}>{p}</p>)
              }
            </div>
            <ServicePapers
              wrap
              services={serviceList}
              linkFunction={s => s.hasPref ? `/services/${s.key}/${pref}` : `/services/${s.key}`}
              hoverText={s => hasAllPrefServices ? `${prefName}の${s.providerName}を探す` : `近くの${s.providerName}を探す`}
            />
          </Container>
        }
        {locationService && profiles.length > 3 &&
          <Container type='section' gradient>
            <SubHeader>
              {areaName}の{category.providerName}
            </SubHeader>
            <PickupProfiles category={dialogOpen} action={pageType.CategoryPage} label={category.key} profiles={profiles.slice(3)} leads={leads} buttonProps={p => ({component: Link, to: `${currentPath}?modal=true&sp=${p.id}`, rel: 'nofollow'})} />
          </Container>
        }
        {request &&
          <Container type='section' gradient>
            <SubHeader>実際の依頼例</SubHeader>
            <RequestPaper request={request} className={classes.paper}/>
            <div className={classes.request}>
              {request.meets.length}人の{request.service.providerName}から見積もりが来ました
            </div>
            <MeetPapers meets={request.meets} averagePrice={request.averagePrice} service={request.service} customer={request.customer} />
            <div className={classes.lpbutton}>
              <GAEventTracker category={dialogOpen} action={pageType.CategoryPage} label={category.key} ><LPButton component={Link} to={`${currentPath}?modal=true`} rel='nofollow'>同じような依頼をする</LPButton></GAEventTracker>
            </div>
          </Container>
        }
        {(category.pageInformation || []).length > 0 &&
          <Container type='section' gradient>
            <GridPageInformation
              information={category.pageInformation}
              ZipBoxProps={{
                gaEvent: {
                  category: dialogOpen,
                  action: pageType.CategoryPage,
                  label: category.key,
                },
                currentPath,
                onEnter: this.onZipEnter,
              }}
            />
          </Container>
        }
        <Hidden implementation='css' smUp>
          <Container className={classes.breadcrumb}>
            <BreadCrumb breads={breadcrumbs} />
          </Container>
        </Hidden>
        {
          (recommendArticles || []).length > 0 &&
          <Container type='aside' gradient>
            <SubHeader>{category.name}に関連する記事</SubHeader>
            <MediaSiteArticles articles={recommendArticles} />
          </Container>
        }
        {bros.length + childs.length > 0 &&
          <Area category={category} currentPath={currentPath} bros={bros} childs={childs} prefName={prefName} pref={pref} city={city} town={town} />
        }
        <Container type='aside'>
          <div className={classes.reason}>
            <h3>カテゴリ一覧</h3>
            <LinkList list={categories} linkFunction={c => `/t/${c.key}`} />
          </div>
        </Container>
        <Footer />
        <SelectService open={!!this.state.selectModal} services={services} title='どのようなサービスをお探しですか？' label='次へ' onClose={() => this.props.history.replace(currentPath)} onSelect={this.onSelect} />
        <QueryDialog open={!!this.state.dialogService} serviceKey={this.state.dialogService} onClose={this.queryClose} specialSent={this.state.specialSent ? this.state.specialSent.id : null} initialZip={this.state.zip} />
      </div>
    )
  }
}

let Area = ({classes, category, currentPath, bros, childs, prefName, pref, city, town}) => {

  const proStr = category.providerName || 'プロ'
  const isFocus = seo.focusCategories.includes(category.key)
  const cityName = city ? '駅' : pref ? '市区町村' : '都道府県'
  const townName = town ? '駅' : city ? '市区町村' : '都道府県'

  return (
    <Container type='aside'>
      <div className={classes.reason}>
        <LocationList
          title={isFocus ? '地域一覧' : `地域から${prefName}の${proStr}を探す`}
          base={currentPath.split('/').slice(0, -1).join('/')}
          list={bros.filter(l => l.isGroup)}
        />
        <LocationList
          title={isFocus ? `${townName}一覧` : `${townName}から${prefName}の${proStr}を探す`}
          base={currentPath.split('/').slice(0, -1).join('/')}
          list={bros.filter(l => !l.isGroup)}
        />
        <LocationList
          title={isFocus ? '地域一覧' : `地域から${prefName}の${proStr}を探す`}
          base={currentPath}
          list={childs.filter(l => l.isGroup)}
        />
        <LocationList
          title={isFocus ? `${cityName}一覧` : `${cityName}から${prefName}の${proStr}を探す`}
          base={currentPath}
          list={childs.filter(l => !l.isGroup)}
        />
      </div>
    </Container>
  )
}

Area = withStyles((theme) => ({
  reason: {
    width: '100%',
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
}))(Area)
