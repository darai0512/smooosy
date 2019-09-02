const SHOW = 'proService/SHOW'

const initialState = {
  proService: null,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SHOW:
      return {
        ...state,
        proService: action.proService,
      }
    default:
      return state
  }
}

export function load(user, service) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/users/${user}/services/${service}`)
      .then(res => res.data)
      .then(proService => dispatch({type: SHOW, proService}))
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/proServices/${id}`, data)
      .then(res => dispatch({type: SHOW, proService: res.data}))
  }
}