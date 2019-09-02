import { SubmissionError } from 'redux-form'
import qs from 'qs'
import axios from 'axios'
import { sendLog } from './auth'
import { BQEventTypes } from '@smooosy/config'

const LOAD = 'meet/LOAD'
const UNLOAD_MEET = 'meet/UNLOAD_MEET'

const CancelToken = axios.CancelToken
let source = null

export default function reducer(state = {}, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        meets: action.meets !== undefined ? action.meets : state.meets,
        meet: action.meet !== undefined ? action.meet : state.meet,
      }
    case UNLOAD_MEET:
      return {
        ...state,
        meet: undefined,
      }
    default:
      return state
  }
}

export function load(meetId) {
  return (dispatch, getState, client) => {
    if (source && source.cancel) {
      source.cancel()
    }
    source = CancelToken.source()

    const m = getState().meet.meet
    if (m && m._id !== meetId) {
      dispatch({type: LOAD, meet: null})
    }
    return client
      .get(`/api/meets/${meetId}`, {cancelToken: source.token})
      .then(res => res.data)
      .then(meet => {
        if (meet.rs) {
          dispatch(sendLog(BQEventTypes.web.MEET_VIEWED, {
            value: meet.rs.a,
            transaction_id: meet._id,
          }))
          trackConversion(meet)
        }

        return dispatch({type: LOAD, meet})
      })
      .finally(() => {
        source = null
      })
  }
}

function trackConversion(meet) {
  window.adwords_conversion && window.adwords_conversion({
    event_id: 'KM6-CNTNmYwBEM_035oD',
    value: meet.rs.a,
    transaction_id: meet._id,
    currency: 'JPY',
  })
}

export function loadForPro(meetId) {
  return (dispatch, getState, client) => {
    if (source && source.cancel) {
      source.cancel()
    }
    source = CancelToken.source()

    const m = getState().meet.meet
    if (m && m._id !== meetId) {
      dispatch({type: LOAD, meet: null})
    }
    return client
      .get(`/api/pros/meets/${meetId}`, {cancelToken: source.token})
      .then(res => res.data)
      .then(meet => {
        if (meet.rs) {
          dispatch(sendLog(BQEventTypes.web.MEET_VIEWED, {
            value: meet.rs.a,
            transaction_id: meet._id,
          }))
          trackConversion(meet)
        }

        return dispatch({type: LOAD, meet})
      })
      .finally(() => {
        source = null
      })
  }
}

export function unload() {
  return (dispatch) => {
    return Promise.resolve(dispatch({type: UNLOAD_MEET}))
  }
}

export function loadAllForPro(option) {
  const params = option ? `?${qs.stringify(option)}` : ''
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, meets: null})
    return client.get(`/api/pros/meets${params}`)
          .then(res => res.data)
          .then(meets => dispatch({type: LOAD, meets}))
  }
}

export function create(requestId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/requests/${requestId}/meets`, data)
      .catch(err => {
        throw new SubmissionError({
          _error: err && err.data ? err.data.message : 'エラーが発生しました',
          status: err && err.data ? err.data.status : null,
        })
      })
      .then(res => res.data)
      .then(meet => {
        dispatch({type: LOAD})
        return meet
      })
  }
}

export function createByUser(requestId, profileIds) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/requests/${requestId}/meetsByUser`, profileIds)
      .then(res => res.data)
  }
}

export function acceptByPro(meetId) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/meets/${meetId}/accept`)
      .then(res => res.data)
      .then(meet => dispatch({type: LOAD, meet}))
  }
}

export function declineByPro(meetId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/meets/${meetId}/decline`, data)
      .then(res => res.data)
  }
}

export function update(meetId, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/meets/${meetId}`, data)
      .then(() => dispatch({type: LOAD}))
  }
}

export function review(meetId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/meets/${meetId}/review`, data)
      .then(res => res.data)
      .then(() => dispatch({type: LOAD}))
  }
}

export function updateReview(meetId, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/meets/${meetId}/review`, data)
      .then(res => res.data)
      .then(() => dispatch({type: LOAD}))
  }
}

export function accounting(_id, data) {
  return (dispatch, getState, client) => {
    return client.post(`/api/meets/${_id}/accounting`, data)
  }
}
