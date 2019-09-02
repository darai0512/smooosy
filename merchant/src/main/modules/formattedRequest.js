import qs from 'qs'

const LOAD = 'formattedRequests/LOAD'

const initialState = {
  info: {},
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        info: action.info || state.info,
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
      .get(`/api/formattedRequests${params}`)
      .then(res => res.data)
      .then(info => dispatch({type: LOAD, info}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/formattedRequests/${id}`)
      .then(res => res.data)
      .then(formattedRequest => dispatch({type: LOAD, formattedRequest}))
  }
}
