const LOAD = 'searchConditions/LOAD'

const initialState = {
  conditions: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        conditions: action.conditions || state.conditions,
      }
    default:
      return state
  }
}

export function loadAll(type) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/searchConditions?type=${type}`)
      .then(res => res.data)
      .then(conditions => dispatch({type: LOAD, conditions}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/searchConditions', data)
      .then(res => res.data)
      .then(conditions => dispatch({type: LOAD, conditions}))
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/searchConditions/${id}`)
      .then(res => res.data)
      .then(conditions => dispatch({type: LOAD, conditions}))
  }
}

export function unload() {
  return dispatch => dispatch({type: LOAD, conditions: []})
}