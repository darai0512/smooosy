const LOAD = 'chat/LOAD'
const ERROR = 'chat/ERROR'

const initialState = {
  chats: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        chats: action.chats || [],
      }
    case ERROR:
      return {
        ...state,
        error: action.error,
      }
    default:
      return state
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client.post('/api/chats', data)
  }
}
