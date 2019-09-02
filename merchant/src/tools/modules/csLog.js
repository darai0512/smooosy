import qs from 'qs'

const LOAD = 'csLog/LOAD'
const CREATE = 'csLog/CREATE'
const REMOVE = 'csLog/REMOVE'

const initialState = {
  csLogs: [],
}
const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case LOAD: {
      return {
        ...state,
        csLogs: action.csLogs,
      }
    }
    case CREATE: {
      const current = state.csLogs
      current.unshift(action.csLog)
      return {
        ...state,
        csLogs: current,
      }
    }
    case REMOVE: {
      return {
        csLogs: state.csLogs.filter(p => p._id !== action._id),
      }
    }
    default: return state
  }
}
export default reducer

export const load = (refs) => {
  return (dispatch, getState, client) => {
    return client.get(`/api/admin/csLogs?${qs.stringify(refs)}`)
      .then(res => dispatch({type: LOAD, csLogs: res.data}))
  }
}

export const create = (data) => {
  return (dispatch, getState, client) => {
    return client.post('/api/admin/csLogs', data)
      .then(res => dispatch({type: CREATE, csLog: res.data}))
  }
}

export const remove = (_id) => {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/csLogs/${_id}`)
      .then(() => dispatch({type: REMOVE, _id}))
  }
}