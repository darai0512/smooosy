import React from 'react'
import { connect } from 'react-redux'
import { Switch, Route } from 'react-router-dom'

import { loadAll, update } from 'modules/proService'
import { paymentInfo } from 'modules/point'

import ProServiceBulkIntroductionPage from './ProServiceBulkIntroductionPage'
import ProServiceBulkBusinessHourPage from './ProServiceBulkBusinessHourPage'
import ProServiceBulkDescriptionPage from './ProServiceBulkDescriptionPage'
import ProServiceBulkLocationPage from './ProServiceBulkLocationPage'
import ProServiceBulkPricePage from './ProServiceBulkPricePage'
import ProServiceBulkJobRequirementsPage from './ProServiceBulkJobRequirementsPage'
import ProServiceBulkBudgetPage from './ProServiceBulkBudgetPage'
import ProServiceSetupCompletePage from './ProServiceSetupCompletePage'
import AboutPromo from './AboutPromo'

const tree = [
  'introduction',
  'business-hour',
  'locations',
  'job-requirements',
  'prices',
  'promo',
  'budgets',
  'complete',
]
@connect(state => ({
  proServices: state.proService.proServices,
}), { loadAll, update, paymentInfo })
export default class ProServiceBulkRoute extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loaded: !!Object.keys(props.proServices).length,
    }
    this.isSetup = /setup\-services/.test(props.location.pathname)
  }

  componentDidMount() {
    if (!this.state.loaded) {
      Promise.all([this.props.loadAll(), this.props.paymentInfo()])
        .then(() => {
          this.setState({ loaded: true })
        })
    }
  }

  back = () => {
    const { location: { pathname }, match: { params: { type } }, history } = this.props
    if (/setup\-services/.test(pathname)) {
      const index = tree.indexOf(type)
      if (index) {
        history.push(`/setup-services/bulk/${tree[index - 1]}`)
      } else {
        history.push('/account/services')
      }
    } else {
      history.goBack()
    }
  }

  next = (promote) => {
    const { location: { pathname }, match: { params: { type } }, history } = this.props
    if (/setup\-services/.test(pathname)) {
      const index = tree.indexOf(type)
      if (index === tree.length - 1) {
        history.push('/account/services')
      } else {
        history.push(`/setup-services/bulk/${tree[index + 1]}${promote === 1 ? '?promote=1' : ''}`)
      }
    } else {
      history.push('/account/services')
    }
  }

  promote = () => {
    this.next(1)
  }

  render() {
    if (!this.state.loaded) {
      return null
    }
    const path = this.isSetup ? '/setup-services' : '/account/services'

    return (
      <Switch>
        <Route exact path={path + '/bulk/introduction'} component={props => <ProServiceBulkIntroductionPage {...props} back={this.back} isSetup={this.isSetup} />} />
        <Route exact path={path + '/bulk/business-hour'} component={props => <ProServiceBulkBusinessHourPage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
        <Route exact path={path + '/bulk/descriptions'} component={props => <ProServiceBulkDescriptionPage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
        <Route exact path={path + '/bulk/locations'} component={props => <ProServiceBulkLocationPage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
        <Route exact path={path + '/bulk/prices'} component={props => <ProServiceBulkPricePage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
        <Route exact path={path + '/bulk/job-requirements'} component={props => <ProServiceBulkJobRequirementsPage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
        {this.isSetup && <Route exact path={path + '/bulk/promo'} component={props => <AboutPromo {...props} next={this.promote} back={this.back} pass={this.next} />} />}
        <Route exact path={path + '/bulk/budgets'} component={props => <ProServiceBulkBudgetPage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
        <Route exact path={path + '/bulk/complete'} component={props => <ProServiceSetupCompletePage {...props} next={this.next} back={this.back} isSetup={this.isSetup} />} />
      </Switch>
    )
  }
}
