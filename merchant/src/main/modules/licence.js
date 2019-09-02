const LOAD = 'licence/LOAD'

const initialState = {
  licences: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        licences: action.licences || state.licences,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/licences')
      .then(res => dispatch({type: LOAD, licences: res.data}))
  }
}
