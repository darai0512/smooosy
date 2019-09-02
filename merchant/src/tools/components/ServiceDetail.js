import React from 'react'
import { connect } from 'react-redux'
import { Avatar, Tabs, Tab } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ImageAddAPhoto from '@material-ui/icons/AddAPhoto'

import { withApiClient } from 'contexts/apiClient'
import { load, loadAll, update as updateService } from 'tools/modules/service'
import Loading from 'components/Loading'
import { ServiceBasicForm, ServiceSeoForm } from 'tools/components/ServiceForm'
import SpInformationForm from 'tools/components/SpInformationForm'
import SpLayoutSelect from 'tools/components/SpLayoutSelect'
import ServicePriceEstimate from 'tools/components/ServicePriceEstimate'
import ServiceMatchMoreForm from 'tools/components/ServiceMatchMoreForm'
import MatchingForm from 'tools/components/MatchingForm'
import { imageSizes, fileMime } from '@smooosy/config'


@withApiClient
@withStyles(theme => ({
  mask: {
    position: 'absolute',
    top: 12,
    left: 12,
    color: theme.palette.common.white,
    background: 'rgba(0, 0, 0, .5)',
    cursor: 'pointer',
  },
}), {withTheme: true})
@connect(
  state => ({
    services: state.service.allServices,
    admin: state.auth.admin,
  }),
  { load, loadAll, updateService }
)
export default class ServiceDetail extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      service: null,
      tab: props.match.params.tab || 'top',
      timeToFirstMeet: null,
      estimatedMeetCount: null,
    }
  }

  componentDidMount () {
    this.load()
    this.props.loadAll('')
    this.getMeetEstimation()
  }

  changeTab = tab => {
    this.setState({tab})
    const path = tab === 'top' ? '' : `/${tab}`
    this.props.history.push(`/services/${this.props.match.params.id}${path}`)
  }

  handleSubmitService = (values) => {
    const { updateService } = this.props
    return updateService(values)
      .then(() => this.load())
  }

  isAdmin = () => this.props.admin > 9
  isNew = () => this.isAdmin() && this.props.match.params.id === 'new'

  load = () => {
    if (this.isNew()) {
      const service = {
        key: '',
        pickupMedia: [],
        tags: [],
        similarServices: [],
        recommendServices: [],
      }
      this.setState({service})
      return service
    }

    return this.props.apiClient
      .get(`/api/admin/services/${this.props.match.params.id}`)
      .then(res => res.data)
      .then(service => {
        this.setState({service})
        return service
      })
  }

  getMeetEstimation = () => {
    this.props.apiClient.get(`/api/admin/services/${this.props.match.params.id}/meetEstimation`)
      .then(res => {
        this.setState({
          timeToFirstMeet: res.data.timeToFirstMeet,
          estimatedMeetCount: res.data.estimatedMeetCount,
        })
      })
  }

  render () {
    const { services, theme, classes } = this.props
    const { service, tab, timeToFirstMeet, estimatedMeetCount } = this.state
    const { common, grey, blue } = theme.palette

    if (!service || services.length === 0) return <Loading />

    if (this.isNew()) {
      return (
        <div style={{padding: 16, background: common.white}}>
          <h3>新しいサービスを追加</h3>
          <ServiceBasicForm isNew initialValues={service} load={this.load} service={service} />
        </div>
      )
    }

    if (service.deleted) return <h2>削除済みサービスです</h2>

    return (
      <div style={{padding: 16, background: common.white}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{position: 'relative', width: 64, height: 64, marginRight: 16, background: `url(${service.image}${imageSizes.c160}) center/cover`}}>
            {this.isAdmin() &&
              <Avatar className={classes.mask} onClick={() => this.uploadButton && this.uploadButton.click()}><ImageAddAPhoto /></Avatar>
            }
          </div>
          <input
            ref={(e) => this.uploadButton = e}
            type='file'
            style={{display: 'none'}}
            accept={fileMime.types.image.jpeg}
            onChange={(event) => this.handleSubmitService({id: service.id, file: event.target.files[0]})}
          />
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <div style={{fontSize: 18}}>{service.name}</div>
            <div style={{fontSize: 13}}>
              {(service.tags || []).map((tag, idx) =>
                <span style={{color: blue.B200, marginRight: 8}} key={`tag_${service.id}_${idx}`}>{tag}</span>
              )}
            </div>
            <div style={{fontSize: 14}}>平均待ち時間：{timeToFirstMeet ? `${timeToFirstMeet.from}〜${timeToFirstMeet.to}` : 'N/A'}</div>
            <div style={{fontSize: 14}}>想定応募数：{estimatedMeetCount ? `${estimatedMeetCount.from}〜${estimatedMeetCount.to}` : 'N/A'}</div>
          </div>
        </div>
        <Tabs
          variant='scrollable'
          scrollButtons='off'
          value={tab}
          onChange={(e, tab) => this.changeTab(tab)}
          style={{borderBottom: `1px solid ${grey[300]}`}}
        >
          <Tab value='top' label='基本情報' />
          <Tab value='seo' label='SEO設定' />
          <Tab value='sp' label='SPコンテンツ' />
          <Tab value='layout' label='SPレイアウト' />
          <Tab value='matching' label='マッチング' />
          <Tab value='price' label='価格推定' />
          <Tab value='booking' label='ご指名方式設定' />
        </Tabs>
        {tab === 'top' ?
          <ServiceBasicForm initialValues={service} load={this.load} service={service} />
        : tab === 'seo' ?
          <ServiceSeoForm initialValues={service} load={this.load} service={service} />
        : tab === 'sp' ?
          <SpInformationForm initialValues={service} load={this.load} service={service} />
        : tab === 'layout' ?
          <SpLayoutSelect initialValues={service} load={this.load} service={service} />
        : tab === 'matching' ?
          <MatchingForm initialValues={service} load={this.load} service={service} />
        : tab === 'price' ?
          <ServicePriceEstimate service={service} load={this.load} />
        : tab === 'booking' ?
          <ServiceMatchMoreForm initialValues={service} load={this.load} service={service} />
        : null}
      </div>
    )
  }
}
