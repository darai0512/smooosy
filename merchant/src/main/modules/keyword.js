const LOAD = 'keywords/LOAD'

const initialState = {
  keywords: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        keywords: action.keywords || state.keywords,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/keywords')
      .then(res => res.data)
      .then(keywords => dispatch({type: LOAD, keywords}))
  }
}
