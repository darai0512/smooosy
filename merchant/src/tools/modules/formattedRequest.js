import qs from 'qs'

const LOAD = 'formattedRequests/LOAD'

const initialState = {
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        formattedRequests: action.formattedRequests || state.formattedRequests,
        formattedRequest: action.formattedRequest || state.formattedRequest,
      }
    default:
      return state
  }
}

export function loadAll(option) {
  const params = option ? `?${qs.stringify(option)}` : ''
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/formattedRequests${params}`)
      .then(res => res.data)
      .then(formattedRequests => dispatch({type: LOAD, formattedRequests}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/formattedRequests/${id}`)
      .then(res => res.data)
      .then(formattedRequest => dispatch({type: LOAD, formattedRequest}))
  }
}

export function update(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/formattedRequests/${data.id}`, data)
      .then(res => res.data)
      .then(formattedRequest => dispatch({type: LOAD, formattedRequest}))
  }
}

export function copyPrioritizedRequests(service) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/formattedRequests/copy', {service})
  }
}

export function copy(id) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/formattedRequests/${id}/copy`)
      .then(res => res.data)
      .then(formattedRequest => dispatch({type: LOAD, formattedRequest}))
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/formattedRequests/${id}`)
  }
}
