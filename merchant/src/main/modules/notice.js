const LOAD = 'notice/LOAD'
const READ = 'notice/READ'

const initialState = {
  notices: [],
  unread: 0,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        notices: action.page && action.page > 1 ? [ ...state.notices, ...action.notices ] : action.notices,
        unread: action.unread !== undefined ? action.unread : state.unread,
      }
    case READ:
      if (action.notice && action.notice._id) {
        const index = state.notices.findIndex(n => n._id === action.notice._id)
        if (index !== -1) {
          state.notices[index] = action.notice
        }
      }

      return state
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function load(params) {
  return (dispatch, getState, client) => {
    return client
      .get('/api/notices', {params})
      .then(res => res.data)
      .then(({notices, unread, page}) => dispatch({type: LOAD, notices, unread, page}))
  }
}

export function read(_id) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/notices/${_id}/read`)
      .then(res => res.data)
      .then(notice => dispatch({type: READ, notice}))
  }
}

export function readAll(body) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/notices/read', body)
      .then(res => res.data)
      .then(({notices, unread}) => dispatch({type: LOAD, notices, unread}))
  }
}
