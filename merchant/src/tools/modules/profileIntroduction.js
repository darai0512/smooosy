
const LOAD = 'profileIntroduction/LOAD'
const CREATE = 'profileIntroduction/CREATE'
const UPDATE = 'profileIntroduction/UPDATE'
const REMOVE = 'profileIntroduction/REMOVE'

const initData = {
  profileIntroductions: [],
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        profileIntroductions: action.profileIntroductions || state.profileIntroductions,
      }
    case CREATE:
      return {
        ...state,
        profileIntroductions: [...state.profileIntroductions, action.profileIntroduction],
      }
    case UPDATE:
      return {
        ...state,
        profileIntroductions: state.profileIntroductions.map(pi => action.profileIntroduction.id === pi.id ? action.profileIntroduction : pi),
      }
    case REMOVE:
      return {
        ...state,
        profileIntroductions: state.profileIntroductions.filter(pi => pi.id !== action.profileIntroduction.id),
      }
    default:
      return state
  }
}

export function load(profileId) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/profileIntroductions/${profileId}`)
      .then(res => res.data)
      .then(profileIntroductions => {
        dispatch({type: LOAD, profileIntroductions})
        return profileIntroductions
      })
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/profileIntroductions', data)
      .then(res => res.data)
      .then(profileIntroduction => {
        dispatch({type: CREATE, profileIntroduction})
        return profileIntroduction
      })
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/profileIntroductions/${id}`, data)
      .then(res => res.data)
      .then(profileIntroduction => {
        dispatch({type: UPDATE, profileIntroduction})
        return profileIntroduction
      })
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/profileIntroductions/${id}`)
      .then(res => res.data)
      .then(profileIntroduction => {
        dispatch({type: REMOVE, profileIntroduction})
        return profileIntroduction
      })
  }
}