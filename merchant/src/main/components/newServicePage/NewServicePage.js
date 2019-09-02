import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { connect } from 'react-redux'
import {
  Divider,
  withStyles,
} from '@material-ui/core'
import { withApiClient } from 'contexts/apiClient'

import { servicePageV2, servicePageV2Unload, loadAll as loadAllServices } from 'modules/service'
import InstantResult from 'components/InstantResult'
import Footer from 'components/Footer'
import QueryDialog from 'components/cards/QueryDialog'
import OGPMeta from 'components/OGPMeta'
import BreadCrumb from 'components/BreadCrumb'
import ProfilePageDialog from 'components/ProfilePageDialog'

import Cover from './Cover'
import ZipInputBox from './ZipInputBox'

import { getDialogInfo, parseQueryParams } from 'lib/instant'
import { logDataFromPS } from 'lib/proService'
import { FlowTypes, imageSizes, webOrigin, BQEventTypes } from '@smooosy/config'
import { sendLog } from 'modules/auth'


@connect(state => ({
  data: state.service.servicePageV2,
}), { servicePageV2, servicePageV2Unload, loadAllServices, sendLog })
@withStyles(theme  => ({
  root: {
    background: theme.palette.common.white,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    [theme.breakpoints.down('xs')]: {
      padding: 5,
    },
  },
  instantResult: {
    background: theme.palette.common.white,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      border: 'none',
      borderRadius: '5px',
      boxShadow: '0px 1px 6px rgba(32, 33, 36, 0.28)',
      marginBottom: 8,
      paddingBottom: 0,
    },
  },
  instantResultWrap: {
    marginTop: 10,
  },
  content: {
    paddingTop: 30,
    maxWidth: 850,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  breadCrumb: {
    marginBottom: 30,
  },
  divider: {
    margin: '20px 0',
    [theme.breakpoints.down('xs')]: {
      margin: '10px 0',
    },
  },
  coverDivider: {
    [theme.breakpoints.up('sm')]: {
      displey: 'none',
    },
  },
  irMobileClick: {
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
    },
  },
  annotation: {
    fontSize: 14,
    color: theme.palette.grey[800],
    textAlign: 'center',
  },
}))
@withApiClient
export default class NewServicePage extends React.Component {
  constructor(props) {
    super(props)
    this.queryParams = parseQueryParams(props.location.search)
    this.dialogInfo = {}
    this.scrolled = false

    const { data, match: { params: { pref, city, town } } } = this.props
    this.state = {
      breads: data ? this.createBreadCrumbs({service: data.service, location: data.location, pref, city, town}) : [],
      proService: null,
    }
  }

  componentDidMount() {
    const { data, match: { params: { key, pref, city, town } } } = this.props
    this.props.loadAllServices()
    const query = { pref, city, town }
    if (!data) {
      this.props.servicePageV2(key, query)
        .then(() => {
          const { data: { service, location } } = this.props
          this.setState({breads: this.createBreadCrumbs({service, location, pref, city, town})})
        })
    } else {
      // just call API again for logging
      // SSR has no x-smooosy
      this.props.apiClient.get(`/api/services/v2/${key}${qs.stringify(query, {addQueryPrefix: true})}`)
    }
    window.addEventListener('scroll', this.handleScroll)
  }

  componentDidUpdate(prevProps, prevState) {
    const { match: { params: { key, pref, city, town } } } = this.props
    if (prevProps.match.params.key !== key ||
      prevProps.match.params.pref !== pref ||
      prevProps.match.params.city !== city ||
      prevProps.match.params.town !== town
    ) {
      this.props.servicePageV2(key, {pref, city, town})
        .then(() => {
          const { d, date, start, end } = this.queryParams
          const { service, location } = this.props.data
          this.dialogInfo = {
            ...this.dialogInfo,
            ...getDialogInfo({ service, d, date, start, end }),
          }
          this.setState({breads: this.createBreadCrumbs({service, location, pref, city, town})})
        })
    }
    const { proService } = this.state
    if (!prevState.proService && proService) {
      this.props.sendLog(BQEventTypes.match_more.OPEN_SP_DIALOG, {
        serviceId: this.props.data.service._id,
        userId: proService.user._id,
        profileId: proService.profile._id,
        proServiceId: proService._id,
        proService: logDataFromPS(proService),
      })
    }
  }

  handleScroll = () =>  {
    if (this.scrolled) {
      window.removeEventListener('scroll', this.handleScroll)
    }
    if (window.pageYOffset > 500) {
      if (this.props.data) {
        this.scrolled = true
        const { data: { service }, match: { params: { pref, city, town } } } = this.props
        this.props.sendLog(BQEventTypes.match_more.SCROLL_SP, {
          serviceId: service._id,
          locationPath: '/' + [pref, city, town].filter(a => a).join('/'),
        })
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
    this.props.servicePageV2Unload()
  }

  createBreadCrumbs = ({service, location, pref, city, town}) => {
    const breads = [{path: '/', text: 'SMOOOSYトップ'}]
    const category = service.category
    if (category) breads.push({path: `/t/${category.key}`, text: category.name})
    breads.push({path: `/services/${service.key}`, text: service.name})
    const [prefName, cityName, townName] = location.path.split(',')
    if (town) {
      breads.push(
        {path: `/services/${service.key}/${pref}`, text: prefName},
        {path: `/services/${service.key}/${pref}/${city}`, text: cityName},
        {path: `/services/${service.key}/${pref}/${city}/${town}`, text: townName}
      )
    } else if (city) {
      breads.push(
        {path: `/services/${service.key}/${pref}`, text: prefName},
        {path: `/services/${service.key}/${pref}/${city}`, text: cityName}
      )
    } else if (pref) {
      breads.push(
        {path: `/services/${service.key}/${pref}`, text: prefName}
      )
    }
    return breads
  }

  onZipChange = address => this.setState({zip: address})

  onDateChange = ({start, end, date}) => {
    this.setState({start, end, date})
  }

  onSubmitRequest = (request) => {
    this.setState({proService: null})
    this.props.history.push(`/instant-results?serviceId=${this.props.data.service._id}&requestId=${request._id}`, {created: true})
  }

  postRequestCreate = request => {
    const { proService } = this.state
    this.props.sendLog(BQEventTypes.match_more.CONVERSION_SP_DIALOG, {
      serviceId: this.props.data.service._id,
      requestId: request._id,
      userId: proService.user._id,
      profileId: proService.profile._id,
      proServiceId: proService._id,
      proService: logDataFromPS(proService),
    })
  }

  onClickProfile = type => ({shortId, proService}) => {
    const { start, end, date, zip } = this.state
    const eventType = {
      seeProfile: BQEventTypes.match_more.CLICK_SP_SEE_PROFILE,
      profile: BQEventTypes.match_more.CLICK_SP_PROFILE,
    }[type]

    this.props.sendLog(eventType, {
      serviceId: this.props.data.service._id,
      userId: proService.user._id,
      profileId: proService.profile._id,
      proServiceId: proService._id,
      proService: logDataFromPS(proService),
    })

    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    this.props.history.push(`${this.props.location.pathname}?${qs.stringify({...query, shortId, serviceId: this.props.data.service._id, zip, start, end, date })}`)
  }

  closeDialog = () => {
    this.setState({proService: null})
  }

  closeProfileDialog = () => {
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    delete query.shortId
    this.props.history.replace(`${this.props.location.pathname}?${qs.stringify(query)}`)
  }

  render() {
    const { classes, data, location: { search } } = this.props
    const { proService, zip, breads } = this.state

    if (!data) return null

    const { service, proServices, location, reviewInfo } = data

    const title = `${location.name}の${service.name} TOP${proServices.length}`
    // OGP
    const seoTitle = title + '【料金・口コミで比較】'
    const keywords = location.name + ',' + service.tags.join(',')
    const [pref, city, town] = location.keyPath.split(',')
    const areaName = town ? town + `(${pref})` : city && location.code ? pref + city : location.name
    const pageMetaDescription = service.pageMetaDescription ? service.pageMetaDescription.replace(/{{location([^}]*)}}/g, (m, c1) => areaName + c1) : `${areaName}の${service.name}を無料で一括見積もり。あなたのこだわり・要望に合わせて${service.providerName}が最適な提案・見積もりをしてくれます。${service.name}はSMOOOSYで。`
    const currentURL = webOrigin + this.props.location.pathname.replace(/^\/amp\//, '/')

    const shortId = qs.parse(search, {ignoreQueryPrefix: true}).shortId

    return (
      <>
        <Helmet>
          <title>{seoTitle}</title>
          <meta name='keywords' content={keywords} />
        </Helmet>
        <OGPMeta
          title={seoTitle}
          description={pageMetaDescription}
          url={currentURL}
          shareImage={service.image + imageSizes.ogp}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='LocalBusiness'
          rating={reviewInfo}
          category={service.category.key}
          service={service.key}
          addressRegion={pref}
          addressLocality={city}
        />
        <div className={classes.root}>
          <Cover image={service.image}>
            <ZipInputBox onZipChange={this.onZipChange} onDateChange={this.onDateChange} service={service} />
          </Cover>
          <div className={classes.content}>
            <Divider className={classes.divider} />
            <h1 className={classes.title}>{title}</h1>
            <BreadCrumb breads={breads} />
            {service.instantResultAnnotation &&
              <>
                <Divider className={classes.divider} />
                <div className={classes.annotation}>{service.instantResultAnnotation}</div>
              </>
            }
            <Divider className={classes.divider} />
            <div className={classes.instantResultWrap}>
              {proServices.map((ps, idx) =>
                <InstantResult
                  key={ps._id}
                  service={service}
                  proService={ps}
                  className={classes.instantResult}
                  onClick={() => this.setState({proService: ps})}
                  queryParams={this.queryParams}
                  minValue={ps.minValue}
                  isLast={idx === proServices.length - 1}
                  onClickProfile={this.onClickProfile('profile')}
                  onClickSeeProfile={this.onClickProfile('seeProfile')}
                />
              )}
            </div>
          </div>
          <Footer />
        </div>
        <QueryDialog
          noSimilarSelect
          open={!!proService}
          serviceKey={service.key}
          dialogInfo={this.dialogInfo}
          onClose={this.closeDialog}
          initialZip={zip}
          flowType={proService && proService.isMatchMore ? FlowTypes.PPC : FlowTypes.MANUAL}
          specialSent={proService ? proService.profile._id : null}
          onEnd={request => this.onSubmitRequest(request)}
          postRequestCreate={this.postRequestCreate}
        />
        <ProfilePageDialog shortId={shortId} open={!!shortId} onClose={this.closeProfileDialog} />
      </>
    )
  }
}
