import { SubmissionError } from 'redux-form'
import qs from 'qs'
import { LOAD as LOAD_USER } from './auth'

const LOAD = 'schedule/LOAD'

const initialState = {
  schedules: [],
  schedule: null,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        schedules: action.schedules || state.schedules,
        schedule: action.schedule || state.schedule,
      }
    default:
      return state
  }
}

export function unload() {
  return (dispatch) => {
    dispatch({type: LOAD, schedules: []})
  }
}

export function load(scheduleId) {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, schedule: null})
    return client
      .get(`/api/schedules/${scheduleId}`)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(schedule => dispatch({type: LOAD, schedule}))
  }
}

export function loadAll(userId, data) {
  const params = qs.stringify(data)
  return (dispatch, getState, client) => {
    return client
      .get(`/api/users/${userId}/schedules?${params}`)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(schedules => dispatch({type: LOAD, schedules}))
  }
}

export function loadAllForPro(data) {
  const params = qs.stringify(data)
  return (dispatch, getState, client) => {
    return client
      .get(`/api/schedules?${params}`)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(schedules => dispatch({type: LOAD, schedules}))
  }
}

export function create(array) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/schedules', array)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(schedule => dispatch({type: LOAD, schedule}))
  }
}

export function update(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/schedules/${data._id}`, data)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(schedule => dispatch({type: LOAD, schedule}))
  }
}

export function remove(ids) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/schedules/delete', ids)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
  }
}

export function updateBusinessHour(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/schedules/businessHour', data)
      .then((res) => res.data)
      .then(({schedule}) => {
        const user = getState().auth.user
        user.schedule = schedule
        dispatch({type: LOAD_USER, user})
      })
  }
}
