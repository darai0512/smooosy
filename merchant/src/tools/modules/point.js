const initialState = {
  point: null,
}

const LOAD = 'point/LOAD'

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        point: action.point || state.point,
      }
    default:
      return state
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/users/${id}/points`)
      .then(res => res.data)
      .then(point => dispatch({type: LOAD, point}))
  }
}

export function add(id, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/users/${id}/points`, data)
      .then(res => res.data)
      .then(point => dispatch({type: LOAD, point}))
  }
}

export function refundStarterPoint(id) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/users/${id}/refundStarterPoint`)
      .then(res => res.data)
      .then(point => dispatch({type: LOAD, point}))
  }
}
