const LOAD = 'meetTemplate/LOAD'

export default function reducer(state = {}, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        templates: action.templates !== undefined ? action.templates : state.templates,
      }
    default:
      return state
  }
}

export function load(serviceId) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/meetTemplates?service=${serviceId}`)
      .then(res => res.data)
      .then(templates => dispatch({type: LOAD, templates}))
  }
}

export function increment(_id) {
  return (dispatch, getState, client) => {
    return client.put(`/api/meetTemplates/${_id}/increment`)
  }
}
