const LOAD = 'pageLayout/LOAD'

const initialState = {
  pageLayout: {},
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        pageLayout: action.pageLayout || state.pageLayout,
      }
    default:
      return state
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/pageLayouts/${id}`)
      .then(res => res.data)
      .then(pageLayout => dispatch({type: LOAD, pageLayout}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/pageLayouts', data)
      .then(res => res.data)
      .then(pageLayout => dispatch({type: LOAD, pageLayout}))
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/pageLayouts/${id}`, data)
      .then(res => res.data)
      .then(pageLayout => dispatch({type: LOAD, pageLayout}))
  }
}