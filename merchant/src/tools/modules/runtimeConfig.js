import qs from 'qs'
const LOADALL = 'runtimeConfig/LOADALL'
const LOAD = 'runtimeConfig/LOAD'

const initData = {
  runtimeConfigs: [],
  runtimeConfig: null,
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case LOADALL:
      return {
        ...state,
        runtimeConfigs: action.runtimeConfigs || state.runtimeConfigs,
      }
    case LOAD:
      return {
        ...state,
        runtimeConfig: action.runtimeConfig || state.runtimeConfig,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/runtimeConfigs')
      .then(res => res.data)
      .then(runtimeConfigs => {
        dispatch({type: LOADALL, runtimeConfigs})
        return runtimeConfigs
      })
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/runtimeConfigs/${id}`)
      .then(res => res.data)
      .then(runtimeConfig => {
        dispatch({type: LOAD, runtimeConfig})
        return runtimeConfig
      })
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/runtimeConfigs', data)
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/runtimeConfigs/${id}`, data)
  }
}

export function remove(ids) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/runtimeConfigs?${qs.stringify({ids})}`)
  }
}
