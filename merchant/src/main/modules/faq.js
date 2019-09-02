const LOAD = 'faqs/LOAD'

const initialState = {
  faqs: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        faqs: action.faqs || state.faqs,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/faqs')
      .then(res => res.data)
      .then(faqs => dispatch({type: LOAD, faqs}))
  }
}
