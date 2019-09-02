import { SubmissionError } from 'redux-form'

const LOAD = 'requests/LOAD'
const RECENT = 'requests/RECENT'

const initialState = {
  recent: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        requests: action.requests !== undefined ? action.requests : state.requests,
        request: action.request !== undefined ? action.request : state.request,
        requestsForPro: action.requestsForPro !== undefined ? action.requestsForPro : state.requestsForPro,
        requestForPro: action.requestForPro !== undefined ? action.requestForPro : state.requestForPro,
      }
    case RECENT:
      return {
        ...state,
        recent: action.recent || state.recent,
      }
    default:
      return state
  }
}

export function load(requestId) {
  return (dispatch, getState, client) => {
    const r = getState().request.request
    if (r && r._id !== requestId) {
      dispatch({type: LOAD, request: null})
    }
    return client
      .get(`/api/requests/${requestId}`)
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}

export function loadForPro(requestId) {
  return (dispatch, getState, client) => {
    const r = getState().request.request
    if (r && r._id !== requestId) {
      dispatch({type: LOAD, request: null})
    }
    return client
      .get(`/api/pros/requests/${requestId}`)
      .then(res => res.data)
      .then(requestForPro => dispatch({type: LOAD, requestForPro}))
  }
}

export function unloadForPro() {
  return dispatch => dispatch({type: LOAD, requestForPro: null})
}

export function loadAll() {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, requests: null})
    return client
      .get('/api/requests')
      .then(res => res.data)
      .then(requests => dispatch({type: LOAD, requests}))
  }
}

export function loadAllForProInsight() {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, requests: null})
    return client
      .get('/api/pros/requestsInsight')
      .then(res => res.data)
      .then(requestsForPro => dispatch({type: LOAD, requestsForPro}))
  }
}

export function loadAllForPro() {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, requests: null})
    return client
      .get('/api/pros/requests')
      .then(res => res.data)
      .then(requestsForPro => dispatch({type: LOAD, requestsForPro}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/requests', data)
      .then(res => res.data)
      .then(request => {
        trackConversion(request)
        return dispatch({type: LOAD, request})
      })
      .catch(() => {
        dispatch({type: LOAD, failed: true})
        throw new SubmissionError({_error: '作成に失敗しました'})
      })
  }
}

export function matchByUser(requestId, profileIds) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/requests/${requestId}/matchByUser`, profileIds)
      .then(res => res.data)
  }
}

function trackConversion(request) {
  window.mixpanel && window.mixpanel.track('user: request created', {request: request._id})
  window.Intercom && window.Intercom('trackEvent', 'request', {request: request._id})
  window.adwords_conversion && window.adwords_conversion({
    event_id: 'xnjyCLfa0YcBEM_035oD',
  })
  window.fbq && window.fbq('track', 'Purchase', {
    content_type: 'createRequest',
    content_ids: request._id,
  })
  window.yahoo_conversion && window.yahoo_conversion({label: 'UWmuCI2784sBEKiP0fUC'})
  window.yahoo_ydn_conversion && window.yahoo_ydn_conversion('C86AFKC5TWMK9RBKMIN527963')
}

// for user
export function update(requestId, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/requests/${requestId}`, data)
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}

export function remove(requestId) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/requests/${requestId}`)
      .then(() => dispatch({type: LOAD}))
  }
}

export function pass(requestId, body) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/requests/${requestId}/pass`, body)
      .then(res => res.data)
  }
}

export function loadRecent(serviceId) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/requests/recent?service=${serviceId}`)
      .then(res => res.data)
      .then(recent => dispatch({type: RECENT, recent}))
  }
}
