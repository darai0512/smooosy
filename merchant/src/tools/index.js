import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { createHashHistory } from 'history'
import { Provider } from 'react-redux'
import { routerMiddleware } from 'react-router-redux'

import thunk from 'redux-thunk'
import axios from 'axios'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { red, blue } from '@material-ui/core/colors'

import { ApiClientProvider } from 'contexts/apiClient'
import reducer from 'tools/modules/reducer'
import { logout } from 'tools/modules/auth'
import App from 'tools/components/App'

const client = axios.create()

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#8FC320',
      contrastText: '#ffffff',
    },
    red: red,
    blue: {
      ...blue,
      B200: '#1180CC',
      B400: '#004D99',
    },
  },
  'breakpoints': {
    'keys': [
      'xs',
      'sm',
      'md',
    ],
    'values': {
      'xs': 360,
      'sm': 768,
      'md': 992,
    },
  },
  overrides: {
    MuiDialog: {
      paper: {
        overflowY: 'auto',
        width: '90vw',
      },
    },
    MuiCircularProgress: {
      colorSecondary: {
        color: '#fff',
      },
    },
    MuiTab: {
      root: {
        textTransform: 'none',
      },
    },
    MuiDialogTitle: {
      root: {
        padding: '24px 48px 20px 24px',
      },
    },
    MuiBadge: {
      badge: {
        top: -4,
        right: -4,
        height: 22,
        minWidth: 22,
        borderRadius: 11,
        transform: null,
      },
      colorPrimary: {
        backgroundColor: red[500],
      },
    },
    MuiListItem: {
      root: {
        paddingTop: 12,
        paddingBottom: 12,
      },
    },
    MuiButton: {
      root: {
        padding: '8px 16px', // same as v1
        minHeight: '36px', // same as v1
        textTransform: 'none',
      },
      text: {
        padding: null, // same as v1
      },
      outlined: {
        padding: '8px 16px', // same as v1
      },
      sizeSmall: {
        padding: '7px 8px',
      },
    },
    MuiIconButton: {
      root: {
        padding: 0, // same as v1
        width: 48, // same as v1
        height: 48, // same as v1
      },
    },
    MuiSwitch: {
      switchBase: {
        width: 'auto',
        height: 'auto',
      },
    },
  },
})

// redux-devtoolの設定
const composeEnhancers = process.env.TARGET_ENV === 'production' ? compose : (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose)
const history = createHashHistory()
const thunkWithClient = thunk.withExtraArgument(client)
const store = createStore(reducer, composeEnhancers(applyMiddleware(routerMiddleware(history), thunkWithClient)))

client.interceptors.request.use(req => {
  let token = store.getState().auth.token
  if (req.url.indexOf('amazonaws.com') !== -1 && req.method === 'put') {
    delete req.headers.Authorization
  } else if (token) {
    // ieのリクエストキャッシュ対策
    document.execCommand && document.execCommand('ClearAuthenticationCache', 'false')
    req.url += (req.url.indexOf('?') == -1 ? '?' : '&') + '_=' + Date.now()
    // 認証トークン
    req.headers.Authorization = `Bearer ${token}`
  }
  return req
}, err => Promise.reject(err))

client.interceptors.response.use(res => res, err => {
  if (axios.isCancel(err)) {
    return Promise.reject({status: 999, statusText: 'Canceled'})
  }
  const response = err.response || {}
  const status = response.status || 400
  if (status === 401) {
    // connectしていないので明示的にdispatchを渡す
    logout()(store.dispatch)
  }
  const statusText = response.statusText || 'Error'
  let data = response.data || {}
  if (typeof data === 'string') {
    data = {statusText: data}
  }
  return Promise.reject({status, statusText, ...data})
})

function render() {
  ReactDOM.render(
    <MuiThemeProvider theme={theme}>
      <Provider store={store}>
        <ApiClientProvider value={client}>
          <App history={history} />
        </ApiClientProvider>
      </Provider>
    </MuiThemeProvider>,
    document.getElementById('root')
  )
}
render()
