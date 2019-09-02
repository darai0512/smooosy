const initialState = {
  labels: [],
}

const LOAD = 'proLabel/LOAD'
const CREATE = 'proLabel/CREATE'
const UPDATE = 'proLabel/UPDATE'
const REMOVE = 'proLabel/REMOVE'

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD: {
      return {
        ...state,
        labels: action.labels,
      }
    }
    case CREATE: {
      return {
        ...state,
        labels: [].concat(action.label, state.labels),
      }
    }
    case REMOVE: {
      const idx = state.labels.findIndex(l => l._id === action.id)
      return {
        ...state,
        labels: [].concat(state.labels.slice(0, idx), state.labels.slice(idx + 1)),
      }
    }
    case UPDATE: {
      const idx = state.labels.findIndex(l => l._id === action.id)
      return {
        ...state,
        labels: [].concat(state.labels.slice(0, idx), action.label, state.labels.slice(idx + 1)),
      }
    }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/proLabels')
      .then(res => dispatch({type: LOAD, labels: res.data.labels}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
    .get(`/api/admin/proLabels/${id}`)
    .then(res => dispatch({type: LOAD, labels: res.data.labels}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/proLabels', data)
      .then(res => dispatch({type: CREATE, label: res.data.label}))
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/proLabels/${id}`, data)
      .then(res => dispatch({type: UPDATE, label: res.data.label, id}))
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/proLabels/${id}`)
      .then(() => dispatch({type: REMOVE, id}))
  }
}
