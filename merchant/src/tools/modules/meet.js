const LOAD = 'meets/LOAD'

const initialState = {
  meets: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        meets: action.meets || state.meets,
        meet: action.meet || state.meet,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/meets')
      .then(res => res.data)
      .then(meets => dispatch({type: LOAD, meets}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/meets/${id}`)
      .then(res => res.data)
      .then(meet => dispatch({type: LOAD, meet}))
  }
}

export function update(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/meets/${data.id}`, data)
      .then(res => res.data)
      .then(meet => dispatch({type: LOAD, meet}))
  }
}
