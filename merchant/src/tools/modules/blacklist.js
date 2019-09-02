const INDEX = 'blackList/INDEX'
const CREATE = 'blacklist/CREATE'
const UPDATE = 'blacklist/UPDATE'
const REMOVE = 'blacklist/REMOVE'

const initData = {
  blacklists: [],
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case INDEX:
      return {
        blacklists: action.blacklists || state.blacklists,
      }
    case CREATE:
      {
        const blacklists = [...state.blacklists]
        if (action.blacklist) {
          blacklists.push(action.blacklist)
        }
        return {blacklists}
      }
    case UPDATE:
      {
        let blacklists = [...state.blacklists]
        if (action.blacklist) {
          blacklists = blacklists.map(b => {
            if (b.id === action.blacklist.id) {
              return action.blacklist
            }
            return b
          })
        }
        return {blacklists}
      }
    case REMOVE:
      {
        let blacklists = [...state.blacklists]
        if (action.blacklist) {
          blacklists = blacklists.filter(b => b.id !== action.blacklist.id)
        }
        return {blacklists}
      }
    default:
      return state
  }
}

export function load() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/blacklists')
      .then(res => res.data)
      .then(blacklists => {
        dispatch({type: INDEX, blacklists})
        return blacklists
      })
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/blacklists', data)
      .then(res => res.data)
      .then(blacklist => {
        dispatch({type: CREATE, blacklist})
        return blacklist
      })
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/blacklists/${id}`, data)
      .then(res => res.data)
      .then(blacklist => {
        dispatch({type: UPDATE, blacklist})
        return blacklist
      })
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/blacklists/${id}`)
      .then(res => res.data)
      .then(blacklist => {
        dispatch({type: REMOVE, blacklist})
        return blacklist
      })
  }
}
