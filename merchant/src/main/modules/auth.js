import { SubmissionError } from 'redux-form'
import ReactGA from 'react-ga'
import uuidv4 from 'uuid/v4'
import qs from 'qs'

import storage from '../../lib/storage'
import tags from '../../lib/tags'
import { getBytes, setAmpLandingPage } from '../../lib/util'
import { BQEventTypes } from '@smooosy/config'

const bqKey = 'bqData'
const bqBackupKey = 'bqbackup'
const userType = { USER: 0, PRO: 1, NOT_LOGIN: 2 }

export const LOAD = 'auth/LOAD'
const LOGOUT = 'auth/LOGOUT'
const BQ_ERROR = 'auth/BQ_ERROR'
const BQ_BACKUP = 'auth/BQ_BACKUP'
const DEACTIVATABLE = 'auth/DEACTIVATABLE'

let user = {}
try {
  user = JSON.parse(localStorage.user || '{}')
} catch (e) {
  user = {}
}

const userData = OLD_initialize(storage.get(bqKey), user)
storage.save(bqKey, userData)

const initialState = {
  user,
  isLineFriend: false,
  refers: [],
  failed: !user.token,
  deactivatable: null,
  // for bigquery
  userData,
  backup: storage.get(bqBackupKey) || [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      if (action.user) {
        try {
          localStorage.user = JSON.stringify(action.user)
        } catch (e) {
          // empty
        }
      }
      return {
        ...state,
        user: action.user || state.user,
        isLineFriend: action.isLineFriend !== undefined ? action.isLineFriend : state.isLineFriend,
        refers: action.refers || state.refers,
        failed: action.failed || false,
        userData: {
          ...state.userData,
          user_id: (action.user || state.user)._id,
          user_type: (action.user || state.user).pro ? userType.PRO : userType.USER,
        },
      }
    case LOGOUT:
      delete localStorage.user
      return {
        ...state,
        user: {},
        failed: true,
        userData: {
          ...state.userData,
          user_id: null,
          user_type: userType.NOT_LOGIN,
        },
      }
    case BQ_ERROR:
      state.backup.push(action.log)
      storage.save(bqBackupKey, state.backup)

      return {
        ...state,
        backup: state.backup,
      }
    case BQ_BACKUP:
      storage.save(bqBackupKey, action.backup)
      return {
        ...state,
        backup: action.backup,
      }
    case DEACTIVATABLE:
      return {
        ...state,
        deactivatable: action.deactivatable !== undefined ? action.deactivatable : state.deactivatable,
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function load() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/users/@me')
      .then(res => res.data)
      .then(user => dispatch({ type: LOAD, user }))
  }
}

export function login({email, password, token, googleToken, facebookToken}) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/login', {email, password, token, googleToken, facebookToken})
      .then(res => dispatch({type: LOAD, user: res.data}))
      .catch(err => {
        if (err.status === 410) {
          throw new SubmissionError({password: 'このアカウントは退会済みです'})
        } else {
          throw new SubmissionError({password: 'パスワードが違います'})
        }
      })
  }
}

export function signup(userData) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/signup', userData)
      .catch(err => {
        if (err.status === 410) {
          throw new SubmissionError({email: 'このアカウントは退会済みです'})
        } else if (err.status === 409) {
          throw new SubmissionError({email: 'このアドレスはすでに利用されています'})
        } else if (err.status === 400) {
          throw new SubmissionError(err.data.errors)
        } else {
          throw new SubmissionError({_error: '登録に失敗しました'})
        }
      })
      .then(res => res.data)
      .then(user => {
        trackConversion(user)
        return dispatch({type: LOAD, user})
      })
  }
}

function trackConversion(user) {
  ReactGA.set({ userId: user._id, dimension1: user.pro === undefined ? 2 : user.pro ? 1 : 0, dimension2: user._id || '' })
  ReactGA.modalview(`/signup/email/${user._id}`)

  if (user.pro && user.profiles[0]) {
    window.mixpanel && window.mixpanel.track('pro: signup', {profile: user.profiles[0]})
    window.fbq && window.fbq('track', 'CompleteRegistration')
    window.adwords_conversion && window.adwords_conversion({
      event_id: 'GrNCCKz1t5EBEK-RjPEC',
      type: 'pro',
    })
    window.yahoo_conversion && window.yahoo_conversion({label: '_yyjCPm_opEBELjaofEC', type: 'pro'})
    window.yahoo_ydn_conversion && window.yahoo_ydn_conversion('FM1UOIRS5JZNBJBI27B527924')
  }
}

class SNSLoginError extends Error {
  constructor({code, email, message}) {
    super(message)
    this.code = code
    this.email = email
  }
}

export function fblogin(userData) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/fblogin', userData)
      .catch(err => {
        dispatch({type: LOAD, failed: true})
        if (err.status === 410) {
          throw new SNSLoginError({code: err.status, message: 'このアカウントは退会済みです'})
        } else if (err.status === 409) {
          throw new SNSLoginError({code: err.status, email: err.data.email, message: 'このFacebookのメールアドレスはすでに登録されています。ログイン後「アカウント設定 > 基本設定」からFacebookを連携させることができます。'})
        } else {
          throw new SNSLoginError({code: err.status, message: 'ログインエラー'})
        }
      })
      .then(res => res.data)
      .then(user => {
        if (user.create) ReactGA.modalview(`/signup/facebook/${user._id}`)
        return dispatch({type: LOAD, user})
      })
  }
}


export function googlelogin(userData) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/googlelogin', userData)
      .catch(err => {
        dispatch({type: LOAD, failed: true})
        if (err.status === 410) {
          throw new SNSLoginError({code: err.status, message: 'このアカウントは退会済みです'})
        } else if (err.status === 409) {
          throw new SNSLoginError({code: err.status, email: err.data.email, message: 'このGoogleのメールアドレスはすでに登録されています。ログイン後「アカウント設定 > 基本設定」からGoogleを連携させることができます。'})
        } else {
          throw new SNSLoginError({code: err.status, message: 'ログインエラー'})
        }
      })
      .then(res => res.data)
      .then(user => {
        if (user.create) ReactGA.modalview(`/signup/google/${user._id}`)
        return dispatch({type: LOAD, user})
      })
  }
}

export function linelogin({lineCode, page, doNotSignup}) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/linelogin', {lineCode, page, doNotSignup})
      .catch(err => {
        dispatch({type: LOAD, failed: true})
        if (err.status === 410) {
          throw new SNSLoginError({code: err.status, message: 'このアカウントは退会済みです'})
        } else if (err.status === 409) {
          if (err.data && err.data.code === 903) {
            throw new SNSLoginError({code: err.status, message: 'このLINEアカウントは連携されていません。ログイン後「アカウント設定 > 基本設定」からLINEを連携させることができます。'})
          }
          throw new SNSLoginError({code: err.status, email: err.data.email, message: 'このLINEのメールアドレスはすでに登録されています。ログイン後「アカウント設定 > 基本設定」からLINEを連携させることができます。'})
        } else {
          throw new SNSLoginError({code: err.status, message: 'ログインエラー'})
        }
      })
      .then(res => res.data)
      .then(user => {
        if (user.create) ReactGA.modalview(`/signup/line/${user._id}`)
        return dispatch({type: LOAD, user})
      })
  }
}

export function reset(email) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/reset', {email})
      .catch(() => {
        dispatch({type: LOAD, failed: true})
        throw new SubmissionError({_error: 'リセットに失敗しました'})
      })
  }
}

export function update(userData, file) {
  return (dispatch, getState, client) => {
    if (file) {
      userData.imageUpdatedAt = new Date()
    }

    return client
      .put('/api/users/@me', userData)
      .then(res => res.data)
      .then(user => {
        if (file) {
          return new Promise((resolve, reject) => {
            client.get('/api/users/@me/getSignedUrl')
                  .then(res => res.data)
                  .then(data => client.put(data.signedUrl, file, {headers: {'Content-Type': file.type}}))
                  .then(() => resolve(user))
                  .catch(() => reject())
          })
        }
        return user

      })
      .catch(err => {
        if (err.status === 409 && err.data.code === 901) {
          throw new SubmissionError({email: 'このアドレスはすでに利用されています'})
        } else if (err.status === 400) {
          throw new SubmissionError({password: 'パスワードが違います'})
        } else {
          alert(err.status === 409 ? 'このアカウントはすでに連携されています。' : '更新に失敗しました')
        }
      })
      .then(user => dispatch({type: LOAD, user}))
  }
}

export function checkLineFriend() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/users/@me/checkLineFriend')
      .then(res => res.data)
      .then(isLineFriend => dispatch({type: LOAD, isLineFriend}))
  }
}

export function referUsers() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/users/@me/refers')
      .then(res => res.data)
      .then(refers => dispatch({type: LOAD, refers}))
  }
}

export function identification(image) {
  return (dispatch, getState, client) => {
    const params = {
      identification: {
        status: 'pending',
        image: image,
      },
    }

    return client
      .put('/api/users/@me', params)
      .then(res => res.data)
      .then(user => {
        dispatch({type: LOAD, user})
      })
  }
}

export function logout() {
  return (dispatch) => {
    tags.intercomReboot()
    return Promise.resolve(dispatch({type: LOGOUT}))
  }
}

export function deactivate() {
  return (dispatch, getState, client) => {
    return client
      .delete('/api/users/@me')
      .then(() => {
        window.mixpanel && window.mixpanel.people.set({ deactivate: true })
        return dispatch({type: LOGOUT})
      })
  }
}

export function checkDeactivatable() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/users/@me/checkDeactivatable')
      .then(res => dispatch({type: DEACTIVATABLE, deactivatable: res.data}))
  }
}

// bigquery

export function sendLog(event_type, event) {
  return (dispatch, getState, client) => {
    let table_name
    for (const [key, value] of Object.entries(BQEventTypes)) {
      if (Object.values(value).includes(event_type)) {
        table_name = key
        break
      }
    }
    const log = {
      table_name,
      event_type,
      event: JSON.stringify(event),
    }
    return client
      .post('/api/bq/insert', log)
      .catch(e => {
        const userData = JSON.parse(e.config.headers['x-smooosy'] || '{}')
        log.timestamp = new Date() // 送れなかった場合は端末時間で保存する
        const backup = { ...log, ...userData }
        dispatch({ type: BQ_ERROR, log: backup })
      })
  }
}

export function sendBackupLogs() {
  return async (dispatch, getState, client) => {
    let backup = getState().auth.backup
    if (backup.length === 0) return

    // backupを100kb以内の配列に分割する
    // [ [{...}, {...}], [{...}, {...}], ... ]
    let logs = []
    const logLists = []
    for (let val of backup) {
      logs.push(val)
      // 100kbを超えていたら分割する
      if (getBytes(JSON.stringify(logs)) > 100 * 1024) {
        logLists.push(logs)
        logs = []
      }
    }
    logLists.push(logs)

    // 一旦backupは空にする
    backup = []
    for (let logs of logLists) {
      try {
        logs = logs.map(l => {
          l.table_name = 'web'
          return l
        })
        await client.post('/api/bq/insert', logs)
      } catch (e) {
        // 失敗した場合再度backupに戻す
        backup.push(...logs)
      }
    }

    dispatch({ type: BQ_BACKUP, backup })
  }
}

// userDataの初期化
function initialize(userData, user) {
  userData = userData || {}

  const queryString = qs.parse(window.location.search.slice(1))

  if (!userData.instance_id) {
    // 初回訪問
    userData = {
      instance_id: uuidv4(),
    }
  }

  const url = window.location.pathname + window.location.search

  let landingPage, referrer

  // AMPからの遷移
  if (queryString.ampId) {
    const canonical = decodeURIComponent(queryString.canonicalPath || '')
    landingPage = setAmpLandingPage(document.referrer, canonical, url)
  } else {
    landingPage = url
    referrer = document.referrer
  }

  return {
    ...userData,
    // ユーザーID
    user_id: user._id,
    // ユーザータイプ
    user_type: user._id ? (user.pro ? userType.PRO : userType.USER) : userType.NOT_LOGIN,
    // リファラー
    reffer: referrer,
    // 現在ページ
    current_page: url,
    // ランディングページ
    landing_page: landingPage,
    amp_id: queryString.ampId,
  }
}

// 後方互換バージョン
function OLD_initialize(userData, user) {
  // old data
  storage.remove('bq_backup')
  if (!userData) {
    userData = storage.get('bq') ? JSON.parse(storage.get('bq')) : {}
  }
  delete userData.last_visit_day
  return initialize(userData, user)
}
