const LOAD = 'maillog/LOAD'

const initialState = {
  maillogs: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        maillogs: action.maillogs || state.maillogs,
      }
    default:
      return state
  }
}

export function loadAll({templateName, ago}) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/maillogs?templateName=${templateName}&ago=${ago}`)
      .then(res => res.data)
      .then(maillogs => dispatch({type: LOAD, maillogs}))
  }
}

export function loadAllByRequest({requestId}) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/maillogs/requests/${requestId}`)
      .then(res => res.data)
      .then(maillogs => dispatch({type: LOAD, maillogs}))
  }
}

export function loadAllByPro({proEmail}) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/mailLogs/pros/${proEmail}`)
      .then(res => res.data)
      .then(maillogs => dispatch({type: LOAD, maillogs}))
  }
}