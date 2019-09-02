const LOAD = 'requests/LOAD'

const initialState = {
  requests: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        request: action.request !== undefined ? action.request : state.request,
        requests: action.requests || state.requests,
      }
    default:
      return state
  }
}

export function loadAll(conditions = []) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/requests', conditions)
      .then(res => res.data)
      .then(requests => dispatch({type: LOAD, requests}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, request: null})
    return client
      .get(`/api/admin/requests/${id}`)
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}

export function update(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/requests/${data.id}`, data)
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}

export function resend(id) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/requests/${id}/resend`)
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}

export function matchPro({request, profile}) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/requests/${request}/match`, {profile})
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}

export function excludePro({request, profile}) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/requests/${request}/exclude`, {profile})
      .then(res => res.data)
      .then(request => dispatch({type: LOAD, request}))
  }
}
