const LOAD = 'meetTemplate/LOAD'

export default function reducer(state = [], action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        template: action.template || state.template,
        templates: action.templates || state.templates,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/meetTemplate')
      .then(res => res.data)
      .then(templates => dispatch({type: LOAD, templates}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/meetTemplate/${id}`)
      .then(res => res.data)
      .then(template => dispatch({type: LOAD, template}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client.post('/api/admin/meetTemplate', data)
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/meetTemplate/${id}`, data)
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/meetTemplate/${id}`)
  }
}

