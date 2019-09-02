import React from 'react'
import qs from 'qs'
import moment from 'moment'
import { connect } from 'react-redux'
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Avatar, Chip, Button, Divider } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import MoneyIcon from '@material-ui/icons/MonetizationOn'
import FilterIcon from '@material-ui/icons/FilterList'
import TodayIcon from '@material-ui/icons/Today'

import { withApiClient } from 'contexts/apiClient'
import { load as loadUser, sendLog } from 'modules/auth'
import { load as loadService, updateGlobalSearch } from 'modules/service'
import { searchInstantResults, searchInstantResultsWithRequest, unloadRequest } from 'modules/proService'
import { open as openSnack } from 'modules/snack'

import InstantResultList from 'components/InstantResultList'
import QueryDialog from 'components/cards/QueryDialog'
import OneClickDialog from 'components/OneClickDialog'
import Footer from 'components/Footer'
import { SidebarDateField } from 'components/DateField'
import ResponsiveDialog from 'components/ResponsiveDialog'
import ConfirmDialog from 'components/ConfirmDialog'
import AboutMeetDialog from 'components/AboutMeetDialog'
import DuplicateRequestDialog from 'components/DuplicateRequestDialog'
import ProfilePageDialog from 'components/ProfilePageDialog'

import { getDialogInfo, parseQueryParams, createDateAnswer, formatConditions } from 'lib/instant'
import { geocode, latlngToGeoJSON, getAddressFromGeocodeResult, getGPS } from 'lib/geocode'
import { logDataFromPS } from 'lib/proService'
import { FlowTypes, GAEvent, BQEventTypes } from '@smooosy/config'
import { sendGAEvent } from 'components/GAEventTracker'
const { category: {dialogOpen, matchMoreDialogOpen}, pageType } = GAEvent

const openRegex = /instant-results\/profiles\//

@withStyles(theme => ({
  container: {
    display: 'flex',
    background: theme.palette.common.white,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 0,
      display: 'block',
      flexDirection: 'column',
    },
  },
  side: {
    width: 300,
    padding: 20,
    borderColor: theme.palette.grey[300],
    borderStyle: 'solid',
    borderWidth: '0 1px 0 0',
    height: 'auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
      position: 'sticky',
      top: 0,
      background: theme.palette.common.white,
      width: '100%',
      minHeight: 53,
      zIndex: 2,
      padding: 8,
      borderWidth: '0 0 1px 0',
      overflowY: 'initial',
      overflowX: 'auto',
    },
  },
  main: {
    flex: 1,
    padding: 20,
    minHeight: 400,
    marginTop: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '0 0 20px',
      flex: 'initial',
      justifyContent: 'flex-start',
    },
  },
  annotationMobile: {
    padding: 8,
    fontSize: 14,
    color: theme.palette.grey[800],
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  annotationWrap: {
    width: '100%',
    maxWidth: 700,
    marginBottom: 20,
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      marginBottom: 0,
    },
  },
  annotationPC: {
    paddingBottom: 20,
    color: theme.palette.grey[800],
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
}))
@connect(
  state => ({
    request: state.proService.request,
    user: state.auth.user,
  }),
  { loadService, searchInstantResults, searchInstantResultsWithRequest, unloadRequest, loadUser, openSnack, updateGlobalSearch, sendLog }
)
@withApiClient
export default class InstantResultsPage extends React.Component {

  constructor(props) {
    super(props)
    this.queryParams = parseQueryParams(this.props.location.search)
    this.dialogInfo = {}
    this.state = {
      loading: true,
      requestLoading: !!this.queryParams.requestId,
      created: false,
      related: false,
      openProfileDialog: openRegex.test(props.location.pathname),
    }
  }

  componentDidMount() {
    const { serviceId, requestId } = this.queryParams
    if (!serviceId) return

    if (requestId) {
      this.loadWithRequest(requestId)
    } else if (this.props.user._id) {
      this.props.apiClient.get(`/api/requests/latest?serviceId=${serviceId}`)
        .then(res => res.data)
        .then(request => {
          if (request) {
            this.loadWithRequest(request._id)
            this.props.history.replace(`/instant-results?serviceId=${serviceId}&requestId=${request._id}`)
          } else {
            this.reload()
          }
        })
    } else {
      this.reload()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { location: { search: prevSearch } } = prevProps
    const { location: { search } } = this.props
    const prevQuery = parseQueryParams(prevSearch)
    const query = parseQueryParams(search)
    // If url is changed, reload instant results.
    if (!prevQuery.requestId && query.requestId) {
      return
    } else if (prevQuery.requestId && !query.requestId) {
      this.setState({requestLoading: true})
      this.props.unloadRequest().then(() => {
        this.queryParams = query
        this.reload()
      })
    } else if (prevQuery.serviceId !== query.serviceId) {
      this.setState({requestLoading: true})
      this.queryParams = query
      this.reload()
    } else if (prevSearch !== search) {
      this.queryParams = query
      this.reload()
    }
    if (!openRegex.test(prevProps.location.pathname) && openRegex.test(this.props.location.pathname)) {
      this.setState({openProfileDialog: true})
    } else if (openRegex.test(prevProps.location.pathname) && !openRegex.test(this.props.location.pathname)) {
      this.setState({openProfileDialog: false})
    }
    if (!prevState.open && this.state.open) {
      const { chosenProService, service } = this.state
      if (chosenProService) {
        this.props.sendLog(BQEventTypes.match_more.OPEN_IRP_DIALOG, {
          serviceId: service._id,
          userId: chosenProService.user._id,
          profileId: chosenProService.profile._id,
          proServiceId: chosenProService._id,
          proService: logDataFromPS(chosenProService),
        })
      } else {
        this.props.sendLog(BQEventTypes.match_more.OPEN_IRP_DIALOG_NO_RESULT, {
          serviceId: service._id,
          query,
        })
      }
    }
  }

  getAddressFromGPS = () => {
    this.setState({loading: true})
    return getGPS()
    .then(loc => {
      return Promise.all([
        geocode(loc),
        this.loadService(this.queryParams.serviceId),
      ])
    })
    .then(([geocodeResults, service]) => {
      const parts = getAddressFromGeocodeResult(geocodeResults)
      this.queryParams.zip = parts.zipcode
      this.props.updateGlobalSearch({zip: parts.zipcode})
      this.props.history.replace(`/instant-results?serviceId=${service._id}&zip=${parts.zipcode}`)
      return this.searchResult({geocodeResults, service})
    })
    .catch((error) => {
      this.props.openSnack(error.message, {anchor: {vertical: 'top', horizontal: 'center'}})
    })
    .finally(() => this.setState({loading: false}))
  }

  geocodeTwice = (zip) => geocode({address: zip}).then(results => geocode(results[0].geometry.location))

  searchResult = ({geocodeResults, service}) => {
    const { serviceId, d, date, start, end, zip } = this.queryParams
    // convert d to conditions
    const conditions = formatConditions(d)

    const latlng = geocodeResults[0].geometry.location
    const loc = latlngToGeoJSON(latlng)
    const parts = getAddressFromGeocodeResult(geocodeResults)
    const { prefecture, city, town } = parts
    const address = {
      valid: true,
      text: [prefecture, city, town].join(''),
    }

    this.dialogInfo = {
      ...this.dialogInfo,
      ...getDialogInfo({ service, d, date, start, end, address, ...parts }),
    }
    return this.props.searchInstantResults({ serviceId, conditions, location: loc, zip }, this.props.location.search)
  }

  reload = () => {
    const { serviceId, zip } = this.queryParams

    if (!zip) {
      this.loadService(serviceId)
        .finally(() => this.setState({loading: false}))
      return
    }

    // display loading dot
    this.setState({loading: true})
    // geocoding will use browser cache so it does not cost too much
    // do geocode twice because api doesn't return complete data
    // for some places like station
    Promise.all([
      this.geocodeTwice(zip),
      this.loadService(serviceId),
    ])
    .then(([geocodeResults, service]) => this.searchResult({geocodeResults, service}))
    .catch(e => {
      let message = '取得に失敗しました'
      if (e.name === 'GeocodeError') {
        message = '地名・郵便番号が正しくありません'
        this.queryParams.zip = ''
      }
      this.props.openSnack(message, {anchor: {vertical: 'top', horizontal: 'center'}})
    })
    .finally(() => this.setState({loading: false, requestLoading: false}))
  }

  loadService = serviceId => {
    return this.props.loadService(serviceId)
      .then(res => res.service)
      .then(service => {
        this.setState({service})
        return service
      })
  }

  loadWithRequest = requestId => {
    const { serviceId } = this.queryParams
    this.setState({loading: true, requestLoading: true})
    this.loadService(serviceId)
    this.props.searchInstantResultsWithRequest(requestId)
      .then(() => {
        const { request } = this.props
        this.addRequestToParams(request)
        const { created } = this.props.location.state || {}
        if (created) {
          // バウンスダイアログを表示させるために再度 loadUser
          // バウンス検証はタイムラグがあるため、setTimeout で再度検証
          this.props.loadUser()
          setTimeout(() => this.props.loadUser(), 5000)
          this.setState({
            created: true,
            related: request.interview.indexOf('duplicate') !== -1,
          })
          this.props.history.replace(`${this.props.location.pathname}${this.props.location.search}`)
        }
      })
      .then(() => this.setState({loading: false, requestLoading: false}))
      .catch(e => {
        // the request already has 5 meets or closed or expired.
        if (e.status === 409) return this.props.history.replace(`/requests/${requestId}`)

        this.props.history.replace(`/instant-results?serviceId=${serviceId}`)
        this.setState({loading: false, requestLoading: false})
      })
  }

  addRequestToParams = request => {
    this.queryParams.zip = request.address
    this.props.updateGlobalSearch({zip: this.queryParams.zip})
    for (const desc of request.description) {
      if (desc.type === 'calendar' && desc.answers[0] && !this.queryParams.date) {
        this.queryParams.date = moment(desc.answers[0].date).format('YYYY-MM-DD')
        this.queryParams.start = desc.answers[0].start
        this.queryParams.end = desc.answers[0].end
        continue
      } else if (desc.type === 'number') {
        this.queryParams.d[desc.query] = desc.answers.map(a => ({ _id: a.option, number: a.number }))
      }

      const checked = desc.answers.filter(d => d.checked)
      if (checked.length === 0) continue
      if (desc.type === 'singular') {
        this.queryParams.d[desc.query] = checked[0].option
      } else if (desc.type === 'multiple') {
        this.queryParams.d[desc.query] = checked.map(a => a.option)
      }
    }
  }

  changeFilter = ({key, value, dateTime = {}, keepUrl}) => {
    if (this.props.request) {
      return this.setState({openNewRequestDialog: true, changeFilterArguments: {key, value, dateTime}})
    }
    if (dateTime.date) {
      this.queryParams.date = moment(dateTime.date).format('YYYY-MM-DD')
      this.queryParams.start = dateTime.start
      this.queryParams.end = dateTime.end
    }
    if (key && value) this.queryParams.d[key] = value
    if (key && Array.isArray(value) && value.length === 0) delete this.queryParams.d[key]
    if (!this.queryParams.d.start) delete this.queryParams.d.start
    if (!this.queryParams.d.end) delete this.queryParams.d.end
    if (!keepUrl) {
      // Change url to trigger reloading when you change each conditions
      this.props.history.replace(`/instant-results?${qs.stringify(this.queryParams)}`)
    }
  }

  searchWithoutRequest = () => {
    this.setState({openNewRequestDialog: false})
    this.props.unloadRequest().then(() => {
      delete this.queryParams.requestId
      this.changeFilter(this.state.changeFilterArguments)
      this.setState({changeFilterArguments: null})
    })
  }

  cancelNewRequest = () => {
    // reset filter conditions
    this.queryParams.zip = this.props.request.address
    this.setState({openNewRequestDialog: false, requestLoading: true})
    setTimeout(() => this.setState({requestLoading: false}), 0)
  }

  search = () => {
    // Change url to trigger reloading when you change each conditions
    this.props.history.replace(`/instant-results?${qs.stringify(this.queryParams)}`)
  }

  openDialog = proService => {
    const { service } = this.state

    if (!proService) {

      sendGAEvent(
        dialogOpen,
        pageType.InstantResultPage,
        service.key,
      )

      // open dialog with manual flow
      this.setState({open: true})
      return
    }

    // if user has already requested this pro, open that request
    if (proService.existingMeet) {
      this.props.history.push(`/requests/${this.props.request._id}/responses/${proService.existingMeet._id}`)
      return
    }

    if (this.props.request) {
      // open OneClickDialog
      this.setState({
        chosenProService: proService,
      })
      this.props.sendLog(BQEventTypes.match_more.OPEN_ONE_CLICK_IRP_DIALOG, {
        serviceId: service._id,
        userId: proService.user._id,
        profileId: proService.profile._id,
        proServiceId: proService._id,
        proService: logDataFromPS(proService),
      })
      return
    }


    sendGAEvent(
      proService.isMatchMore ? matchMoreDialogOpen : dialogOpen,
      pageType.InstantResultPage,
      service.key,
    )

    this.setState({
      open: true,
      chosenProService: proService,
      flowType: proService.isMatchMore ? FlowTypes.PPC : FlowTypes.MANUAL,
    })
    // this.props.history.push(`/p/${proService.profile._id}?${qs.stringify(this.queryParams)}`)
  }

  closeDialog = () => {
    this.setState({
      open: false,
      chosenProService: null,
      flowType: null,
    })
  }

  onSubmitOneClickDialog = ({request}) => {
    const { chosenProService, service } = this.state
    this.props.sendLog(BQEventTypes.match_more.CONVERSION_ONE_CLICK_IRP_DIALOG, {
      serviceId: service._id,
      requestId: request._id,
      userId: chosenProService.user._id,
      profileId: chosenProService.profile._id,
      proServiceId: chosenProService._id,
      proService: logDataFromPS(chosenProService),
    })
    return this.onSubmitRequest({request})
  }

  onSubmitRequest = ({request, created}) => {
    const { service } = this.state
    window.scrollTo(0, 0)
    this.setState({
      open: false,
      chosenProService: false,
    })
    if (created) {
      this.props.history.push(`/instant-results?serviceId=${service._id}&requestId=${request._id}`, {created: true})
    }
    this.loadWithRequest(request._id)
  }

  postRequestCreate = (request) => {
    const { chosenProService, service } = this.state
    if (chosenProService) {
      this.props.sendLog(BQEventTypes.match_more.CONVERSION_IRP_DIALOG, {
        serviceId: service._id,
        requestId: request._id,
        userId: chosenProService.user._id,
        profileId: chosenProService.profile._id,
        proServiceId: chosenProService._id,
        proService: logDataFromPS(chosenProService),
      })
    } else {
      this.props.sendLog(BQEventTypes.match_more.CONVERSION_IRP_DIALOG_NO_RESULT, {
        serviceId: service._id,
        requestId: request._id,
      })
    }
  }

  onClickProfile = type => ({shortId, proService}) => {
    const { service } = this.state
    const eventType = {
      seeProfile: BQEventTypes.match_more.CLICK_IRP_SEE_PROFILE,
      profile: BQEventTypes.match_more.CLICK_IRP_PROFILE,
    }[type]

    this.props.sendLog(eventType, {
      serviceId: service._id,
      userId: proService.user._id,
      profileId: proService.profile._id,
      proServiceId: proService._id,
      proService: logDataFromPS(proService),
    })
    this.props.history.push(`/instant-results/profiles/${shortId}${this.props.location.search}`)
  }

  render() {
    const { request, classes } = this.props
    const { service, loading, requestLoading, openContacted, open, chosenProService, flowType, openProfileDialog } = this.state

    if (!service) return null

    return (
      <>
        <div className={classes.container}>
          {requestLoading ?
            <div className={classes.side} />
          :
            <>
              <FilterForm
                rootClass={classes.side}
                queries={service.queries}
                initialValues={this.queryParams}
                onChange={this.changeFilter}
                search={this.search}
              />
              {service.instantResultAnnotation && <div className={classes.annotationMobile}>{service.instantResultAnnotation}</div>}
            </>
          }
          <div className={classes.main}>
            {service.instantResultAnnotation &&
              <div className={classes.annotationWrap}>
                <div className={classes.annotationPC}>{service.instantResultAnnotation}</div>
                <Divider style={{width: '100%'}} />
              </div>
            }
            <InstantResultList
              service={service}
              queryParams={this.queryParams}
              loading={loading}
              getAddressFromGPS={this.getAddressFromGPS}
              openContacted={openContacted}
              openDialog={this.openDialog}
              setOpenContacted={() => {
                this.setState({openContacted: !openContacted})
              }}
              onClickProfile={this.onClickProfile('profile')}
              onClickSeeProfile={this.onClickProfile('seeProfile')}
            />
          </div>
        </div>
        <Footer />
        <QueryDialog
          noSimilarSelect
          open={!!open}
          serviceKey={service.key}
          dialogInfo={this.dialogInfo}
          onClose={this.closeDialog}
          initialZip={this.queryParams.zip}
          flowType={flowType}
          specialSent={chosenProService ? chosenProService.profile._id : null}
          onEnd={request => this.onSubmitRequest({request, created: true})}
          postRequestCreate={this.postRequestCreate}
        />
        {request &&
          <OneClickDialog
            proService={chosenProService}
            service={service}
            request={request}
            onClose={() => this.setState({chosenProService: null})}
            onSubmit={() => this.onSubmitOneClickDialog({request})}
          />
        }
        <ConfirmDialog
          open={this.state.openNewRequestDialog}
          onSubmit={() => this.searchWithoutRequest()}
          onClose={this.cancelNewRequest}
          title='新しい依頼を作成しますか？'
          label='別に依頼する'
        >
          いま進行中の依頼と異なる条件にすると、別の新しい依頼を作成することになります。
        </ConfirmDialog>
        {request && <DuplicateRequestDialog request={request} open={this.state.related} onClose={() => this.setState({related: false})} />}
        {request && <AboutMeetDialog request={request} open={!this.state.related && !!this.state.created} onClose={() => this.setState({created: false})} />}
        <ProfilePageDialog shortId={this.props.match.params.id} open={openProfileDialog} onClose={() => this.props.history.goBack()}/>
      </>
    )
  }
}

@withStyles(theme => ({
  title: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 20,
    padding: '10px 0',
  },
  icon: {
    marginRight: 5,
  },
  chip: {
    margin: 2,
    fontWeight: 'bold',
  },
  dialogContent: {
    padding: 20,
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  dialogActions: {
    padding: 20,
  },
  button: {
    height: 50,
  },
  hideInDesktop: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  hideInMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  mobileSpace: {
    [theme.breakpoints.down('xs')]: {
      minWidth: 10,
    },
  },
}))
class FilterForm extends React.Component {
  constructor(props) {
    super(props)

    const queriesForBasePrice = []
    const queriesForPrice = []
    const queriesForFilter = []
    let queryForCalender = null
    for (let query of props.queries) {
      if (query.usedForPro && query.type === 'calendar') {
        queryForCalender = query
        continue
      } else if (query.priceFactorType === 'base') {
        queriesForBasePrice.push(query)
        continue
      } else if (query.priceFactorType) {
        queriesForPrice.push(query)
        continue
      } else if (query.usedForPro) {
        queriesForFilter.push(query)
        continue
      }
    }
    queriesForPrice.unshift(...queriesForBasePrice)

    this.state = {
      queryForCalender,
      queriesForPrice,
      queriesForFilter,
    }
  }

  onChangeMobile = values => {
    this.props.onChange({
      ...values,
      keepUrl: true,
    })
  }

  search = () => {
    this.setState({
      openCalendar: false,
      openPriceDialog: false,
      openFilterDialog: false,
    })
    this.props.search()
  }

  render() {
    const { initialValues: { d, date, start, end }, rootClass, classes } = this.props
    const { queryForCalender, queriesForPrice, queriesForFilter } = this.state

    const dateTime = createDateAnswer({date, start, end})
    const priceAnswers = queriesForPrice.filter(q => d[q._id])
    const filterAnswers = queriesForFilter.filter(q => d[q._id])

    return (
      <div className={rootClass}>
        {queryForCalender &&
          <>
            <div className={classes.hideInMobile}>
              <SidebarDateField query={queryForCalender} dateTime={dateTime} onChange={this.props.onChange} />
            </div>
            <Chip
              classes={{root: classes.chip + ' ' + classes.hideInDesktop}}
              avatar={<Avatar><TodayIcon /></Avatar>}
              color={date ? 'primary' : 'default'}
              label={date ? moment(date).format('YYYY/MM/DD') : '日付を入力'}
              onClick={() => this.setState({openCalendar: true})}
            />
            <ResponsiveDialog
              open={!!this.state.openCalendar}
              onClose={() => this.setState({openCalendar: false})}
            >
              <div className={classes.dialogContent}>
                <SidebarDateField query={queryForCalender} dateTime={dateTime} onChange={this.onChangeMobile} />
              </div>
              <div className={classes.dialogActions}>
                <Button fullWidth className={classes.button} variant='contained' color='primary' onClick={this.search}>
                  プロを再検索
                </Button>
              </div>
            </ResponsiveDialog>
          </>
        }
        {queriesForPrice.length > 0 &&
          <>
            <div className={classes.hideInMobile}>
              <h4 className={classes.title}>
                <MoneyIcon className={classes.icon} />
                価格計算
              </h4>
              {queriesForPrice.map(q =>
                q.type === 'number' ?
                  <SelectNumberField key={q._id} query={q} defaultValues={d[q._id]} onChange={this.props.onChange} />
                :
                  <SelectField key={q._id} query={q} defaultValue={d[q._id]} onChange={this.props.onChange} />
              )}
            </div>
            <Chip
              classes={{root: classes.chip + ' ' + classes.hideInDesktop}}
              avatar={<Avatar><MoneyIcon /></Avatar>}
              color={priceAnswers.length ? 'primary' : 'default'}
              label={`価格計算 ･ ${priceAnswers.length}`}
              onClick={() => this.setState({openPriceDialog: true})}
            />
            <ResponsiveDialog
              open={!!this.state.openPriceDialog}
              onClose={() => this.setState({openPriceDialog: false})}
              title='価格計算'
            >
              <div className={classes.dialogContent}>
                {queriesForPrice.map(q =>
                  q.type === 'number' ?
                    <SelectNumberField key={q._id} query={q} defaultValues={d[q._id]} onChange={this.onChangeMobile} />
                  :
                    <SelectField key={q._id} query={q} defaultValue={d[q._id]} onChange={this.onChangeMobile} />
                )}
              </div>
              <div className={classes.dialogActions}>
                <Button fullWidth className={classes.button} variant='contained' color='primary' onClick={this.search}>
                  再計算した価格を見る
                </Button>
              </div>
            </ResponsiveDialog>
          </>
        }
        {queriesForFilter.length > 0 &&
          <>
            <div className={classes.hideInMobile}>
              <h4 className={classes.title}>
                <FilterIcon className={classes.icon} />
                絞り込み
              </h4>
              {queriesForFilter.map(q =>
                q.type === 'number' ?
                  <SelectNumberField key={q._id} query={q} defaultValues={d[q._id]} onChange={this.props.onChange}/>
                :
                  <SelectField key={q._id} query={q} defaultValue={d[q._id]} onChange={this.props.onChange} />
              )}
            </div>
            <Chip
              avatar={<Avatar><FilterIcon /></Avatar>}
              classes={{root: classes.chip + ' ' + classes.hideInDesktop}}
              color={filterAnswers.length ? 'primary' : 'default'}
              label={`絞り込み ･ ${filterAnswers.length}`}
              onClick={() => this.setState({openFilterDialog: true})}
            />
            <ResponsiveDialog
              open={!!this.state.openFilterDialog}
              onClose={() => this.setState({openFilterDialog: false})}
              title='絞り込み'
            >
              <div className={classes.dialogContent}>
                {queriesForFilter.map(q =>
                  q.type === 'number' ?
                    <SelectNumberField key={q._id} query={q} defaultValues={d[q._id]} onChange={this.onChangeMobile} />
                  :
                    <SelectField key={q._id} query={q} defaultValue={d[q._id]} onChange={this.onChangeMobile} />
                )}
              </div>
              <div className={classes.dialogActions}>
                <Button fullWidth className={classes.button} variant='contained' color='primary' onClick={this.search}>
                  プロを絞り込み
                </Button>
              </div>
            </ResponsiveDialog>
          </>
        }
        <div className={classes.mobileSpace} />
      </div>
    )
  }
}

class SelectField extends React.PureComponent {
  constructor(props) {
    super(props)
    const defaultValue = props.query.type === 'multiple' ? [] : false
    this.state = {
      value: props.defaultValue || defaultValue,
    }
  }

  onChange = e => {
    const { query } = this.props
    const { value } = e.target
    this.setState({ value })
    this.props.onChange({key: query._id, value})
  }

  renderValue = selected => {
    const { query } = this.props

    return selected
      .map(s => query.options.find(o => o._id === s))
      .filter(v => v)
      .map(v => v.text)
      .join(', ')
  }

  render() {
    const { query } = this.props
    const { value } = this.state
    const multiple = query.type === 'multiple'

    return (
      <FormControl style={{width: '100%', marginBottom: 10}}>
        <InputLabel htmlFor={query._id}>{query.summary}</InputLabel>
        <Select
          style={{width: '100%'}}
          inputProps={{_id: query._id}}
          multiple={multiple}
          value={value || ''}
          onChange={this.onChange}
          renderValue={multiple ? this.renderValue : undefined}
        >
          {query.options.map(o =>
            <MenuItem disableRipple key={o._id} value={o._id}>
              {multiple ?
                <>
                  <Checkbox checked={value.includes(o._id)} />
                  <ListItemText primary={o.text} />
                </>
              :
                o.text
              }</MenuItem>
          )}
        </Select>
      </FormControl>
    )
  }
}


class SelectNumberField extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      values: props.defaultValues,
    }
  }

  onChange = (idx, number) => {
    const { query } = this.props
    query.options[idx].number = number
    const values = query.options.filter(o => o.number && o.number !== o.defaultNumber).map(o => ({_id: o._id, number: o.number}))
    this.setState({ values })
    this.props.onChange({key: query._id, value: values})
  }

  render() {
    const { query } = this.props
    const { values } = this.state

    return (
      <div style={{width: '100%', marginBottom: 10}}>
        <label style={{fontWeight: 'bold'}} htmlFor={query._id}>{query.summary}</label>
        {query.options.map((option, idx) => {
          const targetOption = (values && values.find(o => o._id === option._id))
          if (targetOption) {
            query.options[idx].number = parseInt(targetOption.number)
          }
          return (
            <div key={option._id} style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
              <div title={option.text} style={{flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{option.text}</div>
              <Select
                native
                style={{width: 80}}
                value={targetOption ? parseInt(targetOption.number) : option.defaultNumber}
                onChange={(e) => this.onChange(idx, e.target.value)}
              >
                {[...Array(option.max + 1 - option.min)].map((_, idx) =>
                  <option key={`${option._id}_${idx}`} value={option.min + idx}>
                    {option.min + idx}{option.unit}
                  </option>
                )}
              </Select>
            </div>
          )
        })}
      </div>
    )
  }

}
