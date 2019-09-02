const LOAD = 'thanks/LOAD'

const initialState = {
  thanks: {},
  received: null,
  total: 0,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        thanks: { ...state.thanks, ...action.thanks },
        received: action.received !== undefined ? action.received : state.received,
        total: action.total !== undefined ? action.total : state.total,
      }
    default:
      return state
  }
}

export function load(userId) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/thanks?ids[]=${userId}`)
      .then(res => res.data)
      .then(thanks => dispatch({type: LOAD, thanks, thank: thanks[userId]}))
  }
}

export function loadReceived(page) {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, received: null})
    return client
      .get(`/api/users/@me/thanks?page=${page}`)
      .then(res => res.data)
      .then(({received, total, list}) => dispatch({type: LOAD, received, total, thanks: list}))
  }
}

export function send(userId) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/users/${userId}/thanks`)
      .then(res => res.data)
      .then(thanks => dispatch({type: LOAD, thanks}))
  }
}
