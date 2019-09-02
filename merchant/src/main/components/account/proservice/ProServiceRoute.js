import React from 'react'
import { connect } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'

import { load as loadProService } from 'modules/proService'
import { paymentInfo } from 'modules/point'
import ProServiceIntroductionPage from 'components/account/proservice/ProServiceIntroductionPage'
import ProServiceSettingPage from 'components/account/proservice/ProServiceSettingPage'
import ProServiceDescriptionPage from 'components/account/proservice/ProServiceDescriptionPage'
import ProServiceLocationPage from 'components/account/proservice/ProServiceLocationPage'
import ProServiceJobRequirementsPage from 'components/account/proservice/ProServiceJobRequirementsPage'
import ProServicePricePage from 'components/account/proservice/ProServicePricePage'
import ProServiceBusinessHourPage from 'components/account/proservice/ProServiceBusinessHourPage'
import ProServiceBudgetPage from 'components/account/proservice/ProServiceBudgetPage'
import ProServiceCompletePage from 'components/account/proservice/ProServiceSetupCompletePage'
import AboutPromo from 'components/account/proservice/AboutPromo'

@connect(
  null,
  { loadProService, paymentInfo }
)
export default class ProServiceRoute extends React.Component {
  state = {}

  componentDidMount() {
    Promise.all([
      this.props.paymentInfo(),
      this.props.loadProService(this.props.match.params.id),
    ])
      .then(() => {
        this.setState({ loaded: true })
      })
  }

  promoNext = (promo) => () => {
    this.props.history.push(`/setup-services/${this.props.match.params.id}/budgets${promo ? '?promo=1' : ''}`)
  }

  promoPrev = () => {
    this.props.history.push(`/setup-services/${this.props.match.params.id}/prices`)
  }

  render() {
    const { location: { pathname }, match } = this.props

    if (!this.state.loaded) {
      return null
    }
    const isSetup = /setup\-services/.test(pathname)

    return (
      <Switch>
        {isSetup && <Route exact path={match.path + '/introduction'} component={ProServiceIntroductionPage} />}
        <Route exact path={match.path + '/descriptions'} component={ProServiceDescriptionPage} />
        <Route exact path={match.path + '/business-hour'} component={ProServiceBusinessHourPage} />
        <Route exact path={match.path + '/locations'} component={ProServiceLocationPage} />
        <Route exact path={match.path + '/job-requirements'} component={ProServiceJobRequirementsPage} />
        <Route exact path={match.path + '/prices'} component={ProServicePricePage} />
        {isSetup && <Route exact path={match.path + '/promo'} component={props => <AboutPromo {...props} next={this.promoNext(true)} pass={this.promoNext(false)} prev={this.promoPrev} />} />}
        <Route exact path={match.path + '/budgets'} component={ProServiceBudgetPage} />
        {isSetup && <Route exact path={match.path + '/complete'} component={ProServiceCompletePage} />}
        <Route exact path={match.path} component={ProServiceSettingPage} />
        <Redirect to={match.path} />
      </Switch>
    )
  }
}
