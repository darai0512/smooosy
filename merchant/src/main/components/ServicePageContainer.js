import React from 'react'
import { connect } from 'react-redux'
import loadable from '@loadable/component'

import { loadForSP as loadSPService, unloadForSP as unloadSPService } from 'modules/service'

const NewServicePage  = loadable(() => import(/* webpackChunkName: "newservice" */ 'components/newServicePage/NewServicePage'))
const ServicePage     = loadable(() => import(/* webpackChunkName: "service" */ 'components/ServicePage'))

@connect(state => ({
  service: state.service.spService,
}), { loadSPService, unloadSPService })
export default class ServicePageContainer extends React.Component {
  componentDidMount() {
    const key = this.props.match.params.key
    this.props.loadSPService(key)
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.key !== prevProps.match.params.key) {
      this.props.loadSPService(this.props.match.params.key)
    }
  }

  componentWillUnmount() {
    this.props.unloadSPService()
  }

  render() {
    const { service, ...rest } = this.props
    if (!service) return null
    const ServicePageComponent = service.matchMoreEnabled ? NewServicePage : ServicePage

    return (
      <ServicePageComponent {...rest} />
    )
  }
}