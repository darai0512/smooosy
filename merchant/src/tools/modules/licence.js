const LOAD = 'licence/LOAD'

const initialState = {
  licences: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        licences: action.licences || state.licences,
        licence: action.licence || state.licence,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client.get('/api/licences')
      .then(res => dispatch({type: LOAD, licences: res.data}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client.get(`/api/licences/${id}`)
      .then(res => dispatch({type: LOAD, licence: res.data}))
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/licences/${id}`, data)
      .then(res => dispatch({type: LOAD, licence: res.data}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client.post('/api/admin/licences', data)
  }
}