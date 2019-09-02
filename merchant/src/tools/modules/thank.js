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

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/thanks?ids[]=${id}`)
      .then(res => res.data)
      .then(thanks => dispatch({type: LOAD, thanks, thank: thanks[id]}))
  }
}
