import { SubmissionError } from 'redux-form'

const LOAD = 'auth/LOAD'
const LOAD_USERS = 'auth/LOAD_USERS'

let user = {}
try {
  user = JSON.parse(localStorage.tools || '{}')
} catch (e) {
  user = {}
}

const initialState = user.expire && user.expire > Date.now() ? {
  admin: user.admin,
  token: user.token,
  id: user.id,
  users: [],
} : {
  users: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD: {
      delete action.type
      localStorage.tools = JSON.stringify(action)
      return {
        ...state,
        admin: action.admin || null,
        token: action.token || null,
        id: action.id || null,
      }
    }
    case LOAD_USERS: {
      return {
        ...state,
        users: action.users || [],
      }
    }
    default: {
      return state
    }
  }
}

export function login({email, password}) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/login', {email, password})
      .catch(err => {
        if (err.status === 404) {
          throw new SubmissionError({email: '存在しません'})
        } else {
          throw new SubmissionError({password: 'パスワードが違います'})
        }
      })
      .then(res => res.data)
      .then(user => {
        if (user.admin) {
          dispatch({type: LOAD, admin: user.admin, token: user.token, id: user.id, expire: Date.now() + 86400000})
        } else {
          throw new SubmissionError({password: 'ログイン失敗'})
        }
      })
  }
}

export function fblogin(userData) {
  return (dispatch, getState, client) => {
    userData.doNotSignup = true
    return client
      .post('/api/fblogin', userData)
      .catch(() => {
        dispatch({type: LOAD, failed: true})
        throw new Error('ログインエラー')
      })
      .then(res => res.data)
      .then(user => {
        dispatch({type: LOAD, admin: user.admin, token: user.token, expire: Date.now() + 86400000})
      })
  }
}

export function googlelogin(userData) {
  return (dispatch, getState, client) => {
    userData.doNotSignup = true
    return client
      .post('/api/googlelogin', userData)
      .catch(() => {
        dispatch({type: LOAD, failed: true})
        throw new Error('ログインエラー')
      })
      .then(res => res.data)
      .then(user => {
        dispatch({type: LOAD, admin: user.admin, token: user.token, expire: Date.now() + 86400000})
      })
  }
}

export function logout() {
  return dispatch => dispatch({type: LOAD})
}

export function update(data, file) {
  return (dispatch, getState, client) => {
    if (file) {
      data.imageUpdatedAt = new Date()
    }

    if (!data.id) {
      return client.post('/api/admin/users', data)
    }

    return client
      .put(`/api/admin/users/${data.id}`, data)
      .then(res => res.data)
      .then(user => {
        if (file) {
          return new Promise((resolve, reject) => {
            client.get(`/api/admin/users/${data.id}/getSignedUrl`)
                  .then(res => res.data)
                  .then(data => client.put(data.signedUrl, file, {headers: {'Content-Type': file.type}}))
                  .then(() => resolve(user))
                  .catch(() => reject())
          })
        }
        return user

      })
  }
}

export function loadAdmin() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/users')
      .then(res => res.data)
      .then(users => dispatch({type: LOAD_USERS, users}))
  }
}


export function deactivate(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/users/${id}`)
  }
}

export function pushMessage(id, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/users/${id}/pushMessage`, data)
  }
}