import { SubmissionError } from 'redux-form'
import qs from 'qs'

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

export function load(id) {
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, schedule: null})
    return client
      .get(`/api/schedules/${id}`)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(schedule => dispatch({type: LOAD, schedule}))
  }
}

export function loadAll(id, data) {
  const params = qs.stringify(data)
  return (dispatch, getState, client) => {
    return client
      .get(`/api/users/${id}/schedules?${params}`)
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
      .put(`/api/schedules/${data.id}`, data)
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

export function updateBusinessHour(proId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/users/${proId}/businessHour`, data)
  }
}