import React from 'react'
import { connect } from 'react-redux'
import { ConnectedRouter as Router } from 'react-router-redux'
import { Route, Redirect, Switch } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'

import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

import loadable from '@loadable/component'

import Layout from 'tools/components/Layout'
import NotFound from 'tools/components/NotFound'
import LoginPage from 'tools/components/LoginPage'

const TopPage = loadable(() => import('tools/components/TopPage'))
const StatsProList = loadable(() => import('tools/components/stats/ProList'))
const StatsProDetail = loadable(() => import('tools/components/stats/ProDetail'))
const StatsProCsEmailPage = loadable(() => import('tools/components/stats/ProCsEmailPage'))
const StatsRequestList = loadable(() => import('tools/components/stats/RequestList'))
const StatsRequestDetail = loadable(() => import('tools/components/stats/RequestDetail'))

const ServiceList = loadable(() => import('tools/components/ServiceList'))
const ServiceDetail = loadable(() => import('tools/components/ServiceDetail'))
const CategoryDetail = loadable(() => import('tools/components/CategoryDetail'))

const QueryDashboard = loadable(() => import('tools/components/dashboard/QueryDashboard'))
const ProQuestionDashboard = loadable(() => import('tools/components/dashboard/ProQuestionDashboard'))

const ProQuestionDetail = loadable(() => import('tools/components/ProQuestionDetail'))

const MeetTemplates = loadable(() => import('tools/components/MeetTemplates'))
const MeetTemplatesDetail = loadable(() => import('tools/components/MeetTemplatesDetail'))
const FormattedRequestList = loadable(() => import('tools/components/FormattedRequestList'))
const FormattedRequestDetail = loadable(() => import('tools/components/FormattedRequestDetail'))

const LocationList = loadable(() => import('tools/components/locations/LocationList'))
const LocationDetail = loadable(() => import('tools/components/locations/LocationDetail'))
const KeywordList = loadable(() => import('tools/components/KeywordList'))
const LeadDialog = loadable(() => import('tools/components/LeadDialog'))
const LeadPage = loadable(() => import('tools/components/LeadPage'))
const LeadSendPage = loadable(() => import('tools/components/LeadSendPage'))
const LicenceList = loadable(() => import('tools/components/LicenceList'))
const LicenceEdit = loadable(() => import('tools/components/LicenceEdit'))
const SearchKeywordCategory = loadable(() => import('tools/components/SearchKeywordCategory'))
const SearchKeywordList = loadable(() => import('tools/components/SearchKeywordList'))
const SearchKeywordDetail = loadable(() => import('tools/components/SearchKeywordDetail'))
const Scraping = loadable(() => import('tools/components/Scraping'))
const CrawlPage = loadable(() => import('tools/components/CrawlPage'))
const CrawlDetail = loadable(() => import('tools/components/CrawlDetail'))
const CrawlTemplateDetail = loadable(() => import('tools/components/CrawlTemplateDetail'))
const CSTaskPage = loadable(() => import('tools/components/CSTaskPage'))
const ExperimentList = loadable(() => import('tools/components/ExperimentList'))
const ExperimentDetail = loadable(() => import('tools/components/ExperimentDetail'))
const RuntimeConfigList = loadable(() => import('tools/components/RuntimeConfigList'))
const RuntimeConfigDetail = loadable(() => import('tools/components/RuntimeConfigDetail'))
const ProLabelPage = loadable(() => import('tools/components/ProLabelPage'))

const AdminPage = loadable(() => import('tools/components/AdminPage'))

if (module.hot) {
  require('tools/components/TopPage')
  require('tools/components/stats/ProList')
  require('tools/components/stats/ProDetail')
  require('tools/components/stats/ProCsEmailPage')
  require('tools/components/stats/RequestList')
  require('tools/components/stats/RequestDetail')

  require('tools/components/ServiceList')
  require('tools/components/ServiceDetail')
  require('tools/components/CategoryDetail')

  require('tools/components/dashboard/QueryDashboard')
  require('tools/components/dashboard/ProQuestionDashboard')

  require('tools/components/ProQuestionDetail')

  require('tools/components/FormattedRequestList')
  require('tools/components/FormattedRequestDetail')

  require('tools/components/locations/LocationList')
  require('tools/components/locations/LocationDetail')
  require('tools/components/KeywordList')
  require('tools/components/LeadDialog')
  require('tools/components/LeadPage')
  require('tools/components/LeadSendPage')
  require('tools/components/LicenceEdit')
  require('tools/components/Scraping')
  require('tools/components/CrawlPage')
  require('tools/components/CrawlDetail')
  require('tools/components/CrawlTemplateDetail')
  require('tools/components/CSTaskPage')
  require('tools/components/ExperimentList')
  require('tools/components/ExperimentDetail')
  require('tools/components/RuntimeConfigList')
  require('tools/components/RuntimeConfigDetail')
  require('tools/components/AdminPage')
}

const App = ({history}) => (
  <Router history={history}>
    <Switch>
      <Route exact path='/login' component={LoginPage} />
      <PrivateRoute component={AppRoute} />
    </Switch>
  </Router>
)
export default hot(App)

const AppRoute = connect(
  state => ({
    admin: state.auth.admin,
  })
)(
  (props) => {
    return (
      <Layout {...props}>
        <Switch>
          <Route path='/stats/pros' component={StatsProRoute} />
          {props.admin > 1 && <Route path='/stats/requests' component={StatsRequestRoute} />}
          {props.admin > 2 && <Route exact path='/queries' component={QueryDashboard} />}
          {props.admin > 2 && <Route exact path='/proQuestions' component={ProQuestionDashboard} />}
          {props.admin > 2 && <Route exact path='/proQuestions/:id' component={ProQuestionDetail} />}
          {props.admin > 1 && <Route exact path='/services' component={ServiceList} />}
          {props.admin > 1 && <Route exact path='/services/:id' component={ServiceDetail} />}
          {props.admin > 1 && <Route exact path='/services/:id/:tab' component={ServiceDetail} />}
          {props.admin > 2 && <Route exact path='/categories/:key' component={CategoryDetail} />}
          {props.admin > 2 && <Route exact path='/meetTemplates' component={MeetTemplates} />}
          {props.admin > 2 && <Route exact path='/meetTemplates/:id' component={MeetTemplatesDetail} />}
          {props.admin > 1 && <Route exact path='/formattedRequests' component={FormattedRequestList} />}
          {props.admin > 1 && <Route exact path='/formattedRequests/:id' component={FormattedRequestDetail} />}
          {props.admin > 2 && <Route exact path='/locations' component={LocationList} />}
          {props.admin > 2 && <Route exact path='/locations/:id' component={LocationDetail} />}
          {props.admin > 2 && <Route exact path='/locations/:id/new' component={LocationDetail} />}
          {props.admin > 2 && <Route exact path='/locationGroups/:id' component={LocationDetail} />}
          {props.admin > 2 && <Route exact path='/locationGroups/:id/new' component={LocationDetail} />}
          {props.admin > 9 && <Route exact path='/licences' component={LicenceList} />}
          {props.admin > 9 && <Route exact path='/licences/:id' component={LicenceEdit} />}
          {props.admin > 1 && <Route exact path='/leads' component={LeadPage} />}
          {props.admin > 1 && <Route exact path='/leads/send/:id' component={LeadSendPage} />}
          {props.admin > 1 && <Route exact path='/leads/:id' component={LeadDialog} />}
          {props.admin > 1 && <Route exact path='/keywords' component={KeywordList} />}
          {props.admin > 1 && <Route exact path='/scraping' component={Scraping} />}
          {props.admin > 1 && <Route exact path='/crawls' component={CrawlPage} />}
          {props.admin > 1 && <Route exact path='/crawls/:id' component={CrawlDetail} />}
          {props.admin > 1 && <Route exact path='/crawlTemplates/:id' component={CrawlTemplateDetail} />}
          {props.admin > 1 && <Route exact path='/csTask' component={CSTaskPage} />}
          {process.env.TARGET_ENV !== 'production' && props.admin > 1 && <Route exact path='/searchKeywordCategory' component={SearchKeywordCategory} />}
          {process.env.TARGET_ENV !== 'production' && props.admin > 1 && <Route exact path='/searchKeyword/:key' component={SearchKeywordList} />}
          {process.env.TARGET_ENV !== 'production' && props.admin > 1 && <Route exact path='/searchKeyword/:key/:id' component={SearchKeywordDetail} />}
          {props.admin > 9 && <Route exact path='/experiments' component={ExperimentList} />}
          {props.admin > 9 && <Route exact path='/experiments/:id' component={ExperimentDetail} />}
          {props.admin > 9 && <Route exact path='/runtimeConfigs' component={RuntimeConfigList} />}
          {props.admin > 9 && <Route exact path='/runtimeConfigs/:id' component={RuntimeConfigDetail} />}
          {props.admin > 2 && <Route exact path='/proLabel' component={ProLabelPage} />}
          {props.admin > 9 && <Route exact path='/admin' component={AdminPage} />}
          <Route exact path='/' component={TopPage} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    )

  }
)

const StatsProRoute = (props) => (
  <StatsProList {...props}>
    <Switch>
      <Route path={`${props.match.path}/:id/csEmails`} component={StatsProCsEmailPage} />
      <Route path={`${props.match.path}/:id`} component={StatsProDetail} />
    </Switch>
  </StatsProList>
)

const StatsRequestRoute = (props) => (
  <StatsRequestList {...props}>
    <Switch>
      <Route path={`${props.match.path}/:id`} component={StatsRequestDetail} />
    </Switch>
  </StatsRequestList>
)

const PrivateRoute = connect(
  state => ({
    admin: state.auth.admin,
  })
)(
  ({ admin, component, render, ...rest }) => {
    return (
      <Route {...rest} render={props => (
          !admin ?
          <Redirect to={{pathname: '/login', state: { from: props.location }}}/> :
          component ?
          React.createElement(component, props) :
          render ?
          render(props) :
          null
        )} />
    )
  }
)
