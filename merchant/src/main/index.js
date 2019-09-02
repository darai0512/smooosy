/*globals process: false */
import React from 'react'
import ReactDOM from 'react-dom'
import { createBrowserHistory } from 'history'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { ConnectedRouter as Router } from 'react-router-redux'
import { routerMiddleware, LOCATION_CHANGE } from 'react-router-redux'
import thunk from 'redux-thunk'
import axios from 'axios'
import { loadableReady } from '@loadable/component'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import theme from 'theme'

import { ApiClientProvider } from 'contexts/apiClient'
import { RollOutProvider } from 'contexts/rollOut'
import reducer from 'modules/reducer'
import { logout, sendLog, sendBackupLogs } from 'modules/auth'
import { loadActiveExperiments } from 'modules/experiment'
import App from 'components/App'
import tags from 'lib/tags'
import { getAllCookies } from 'lib/cookie'
import 'lib/polyfill'
import ReactGA from 'react-ga'

import moment from 'moment'
import { rolloutDates, BQEventTypes } from '@smooosy/config'

/*
// Detect useless rendering. Many logs output. Therefore, partially use is recommend.(Use in need check file)
import { whyDidYouUpdate } from 'why-did-you-update'
if (process.env.TARGET_ENV !== 'production') {
  whyDidYouUpdate(React)
}
*/

const client = axios.create()

ReactGA.initialize(process.env.TARGET_ENV === 'production' ? 'UA-97635974-1' : 'UA-97635974-2', {
  debug: process.env.TARGET_ENV !== 'production',
  titleCase: false,
  gaOptions: { siteSpeedSampleRate: 100, useAmpClientId: true},
})

const history = createBrowserHistory({
  getUserConfirmation(message, callback) {
    const confirm = window.customConfirm || window.confirm
    callback(confirm(message))
  },
})
history.stack = []
const thunkWithClient = thunk.withExtraArgument(client)
// Google Analytics Middleware
const gaMiddleware = ({dispatch, getState}) => {
  return next => action => {
    if (action.type !== LOCATION_CHANGE) return next(action)

    const page = window.location.pathname + window.location.search

    const isLanding = history.stack.length === 0
    let isNewPath = true
    if (!isLanding) {
      const prevPath = history.stack[history.stack.length - 1].split(/[\?#]/)[0]
      isNewPath = prevPath !== window.location.pathname
    }

    history.stack.push(page)

    if (!isNewPath) return next(action)

    const user = getState().auth.user
    const profile = getState().profile.profiles[0]

    if (!isLanding) { // NOT landing
      window.scrollTo(0, 0)
    }

    ReactGA.set({
      page,
      userId: user.id,
      dimension1: user.pro === undefined ? 2 : user.pro ? 1 : 0,
      dimension2: user.id || '',
    })
    ReactGA.pageview(page)

    tags.pageview(page, user, profile)

    dispatch(sendLog(BQEventTypes.web.PAGE_VIEW))

    return next(action)
  }
}

const initialData = window.__STATE__ || {}
delete window.__STATE__
const dataElem = document.getElementById('initial-data')
if (dataElem && dataElem.parentNode) dataElem.parentNode.removeChild(dataElem)

// redux-devtoolの設定
const composeEnhancers = process.env.TARGET_ENV === 'production' ? compose : (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose)
const store = createStore(reducer, initialData, composeEnhancers(applyMiddleware(routerMiddleware(history), thunkWithClient, gaMiddleware)))

client.interceptors.request.use(req => {
  const token = store.getState().auth.user.token

  if (req.url.indexOf('amazonaws.com') !== -1 && req.method === 'put') {
    delete req.headers.Authorization
  } else if (token) {
    // ieのリクエストキャッシュ対策
    document.execCommand && document.execCommand('ClearAuthenticationCache', 'false')
    req.url += (req.url.indexOf('?') == -1 ? '?' : '&') + '_=' + Date.now()
    // 認証トークン
    req.headers.Authorization = `Bearer ${token}`
  }
  if (req.url.indexOf('/') === 0) {
    const userData = store.getState().auth.userData
    // null,undefined削除
    for (let key in userData) {
      if (userData[key] === void 0 || userData[key] === null) delete userData[key]
    }
    const cookie = getAllCookies()
    req.headers['x-smooosy'] = JSON.stringify({
      ...userData,
      cookie: JSON.stringify(cookie),
      current_page: window.location.pathname + window.location.search,
    })
  }
  return req
}, err => Promise.reject(err))

client.interceptors.response.use(res => res, err => {
  if (axios.isCancel(err)) {
    return Promise.reject({code: 999, message: 'cancel'})
  }
  if (err.response && err.response.status && err.response.status === 401) {
    // connectしていないので明示的にdispatchを渡す
    store.dispatch(logout())
  }
  return Promise.reject(err.response || {})
})

const { user, failed } = store.getState().auth
if (process.env.TARGET_ENV === 'production') {
  tags.facebook(failed ? null : user)
  tags.rollbar(failed ? null : user)
  tags.adwords()
  tags.mixpanel()
  tags.yahoo()
}

store.dispatch(loadActiveExperiments())
store.dispatch(sendBackupLogs())
store.dispatch(sendLog(BQEventTypes.web.VISIT))

// タブの表示・非表示
document.addEventListener('visibilitychange', () => {
  store.dispatch(sendLog(document.hidden ? BQEventTypes.web.HIDE : BQEventTypes.web.SHOW))
})

// オンライン時
window.addEventListener('online', () => {
  store.dispatch(sendBackupLogs())
})

function render() {
  const rollouts = {
    enableReviewCampaign: moment().isSameOrBefore(rolloutDates.enableReviewCampaign),
  }

  ReactDOM.render(
    <React.StrictMode>
      <MuiThemeProvider theme={createMuiTheme(theme)}>
        <Provider store={store}>
          <ApiClientProvider value={client}>
            <RollOutProvider value={rollouts}>
              <Router history={history}>
                <App />
              </Router>
            </RollOutProvider>
          </ApiClientProvider>
        </Provider>
      </MuiThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
  )
}
loadableReady(() => render())
