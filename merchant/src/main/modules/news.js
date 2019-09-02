const LOAD = 'news/LOAD'
const UNLOAD = 'news/UNLOAD'

const initialState = {
  news: null,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        news: action.news || state.news,
      }
    case UNLOAD:
      return {
        ...state,
        news: undefined,
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/news/${id}`)
      .then(res => res.data)
      .then(news => dispatch({type: LOAD, news}))
  }
}

export function unload() {
  return (dispatch) => {
    return Promise.resolve(dispatch({type: UNLOAD}))
  }
}
