import { SubmissionError } from 'redux-form'
const LOAD = 'profiles/LOAD'
const PICKUP = 'profiles/PICKUP'
const MEDIA = 'media/PARTIAL' // メディア更新情報をprofile.mediaにも反映させる
const INSIGHT = 'profiles/INSIGHT'

const initialState = {
  profiles: [],
  profile: null,
  mediaList: null,
  pickup: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        profiles: action.profiles || state.profiles,
        profile: action.profile !== undefined ? action.profile : state.profile,
        mediaList: action.mediaList || state.mediaList,
      }
    case MEDIA:
      if (!state.profile) return state

      return {
        ...state,
        profile: {
          ...state.profile,
          media: state.profile.media.map(m => m._id === action.media._id ? action.media : m),
        },
      }
    case PICKUP:
      return {
        ...state,
        pickup: action.pickup || state.pickup,
      }
    case INSIGHT:
      return {
        ...state,
        insight: action.insight || state.insight,
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/profiles')
      .then(res => res.data)
      .then(profiles => dispatch({type: LOAD, profiles}))
      .catch(() => {
        throw new Error({_error: '取得に失敗しました'})
      })
  }
}

export function load(profileId) {
  return (dispatch, getState, client) => {
    const p = getState().profile.profile
    if (p && p._id !== profileId) {
      dispatch({type: LOAD, profile: null})
    }
    return client
      .get(`/api/profiles/${profileId}`)
      .catch(() => {
        throw new Error({_error: '取得に失敗しました'})
      })
      .then(res => res.data)
      .then(profile => {
        const profiles = getState().profile.profiles.map(p => p._id === profile._id ? profile : p)
        return dispatch({type: LOAD, profile, profiles})
      })
  }
}

export function loadForReview(profileId) {
  return (dispatch, getState, client) => {
    const p = getState().profile.profile
    if (p && p._id !== profileId) {
      dispatch({type: LOAD, profile: null})
    }
    return client
      .get(`/api/profiles/${profileId}/reviews`)
      .then(res => dispatch({type: LOAD, profile: res.data}))
  }
}

export function loadInsight(profileId) {
  return (dispatch, getState, client) => {
    const p = getState().profile.profile
    if (p && p._id !== profileId) {
      dispatch({type: LOAD, insights: null})
    }
    return client
      .get(`/api/profiles/${profileId}/insights`)
      .then(res => res.data)
      .then(insight => dispatch({type: INSIGHT, insight}))
  }
}

export function unload() {
  return (dispatch) => {
    return dispatch({type: LOAD, profile: null})
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/profiles', data)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function update(profileId, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/profiles/${profileId}`, data)
      .catch(err => {
        if (err.data && err.data.errors) throw new SubmissionError(err.data.errors)
      })
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function review(profileId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/profiles/${profileId}/review`, data)
      .then(() => dispatch({type: LOAD}))
  }
}

export function requestReview(profileId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/profiles/${profileId}/email`, data)
  }
}

export function pickup(params) {
  return (dispatch, getState, client) => {
    return client.get('/api/profiles/pickup', {params})
      .then((res) => {
        dispatch({type: LOAD, pickup: res.data})
        return res
      })
  }
}

export function deactivate(profileId) {
  return (dispatch, getState, client) => {
    return client
    .delete(`/api/profiles/${profileId}`)
    .then(res => res.data)
    .then(user => dispatch({type: 'auth/LOAD', user}))
  }
}

export function suspend(ids) {
  return (dispatch, getState, client) => {
    return client
      .put('/api/profiles/suspend', ids)
  }
}

export function resume(profileId, ids) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/profiles/resume/${profileId}`, ids)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function updateReview(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/reviews/${data.id}`, data)
  }
}

export function profilePage(profileId) {
  return (dispatch, getState, client) => {
    const p = getState().profile.profile
    if (p && p._id !== profileId) {
      dispatch({type: LOAD, profile: null})
    }
    return client
      .get(`/api/profiles/${profileId}/page`)
      .catch(() => {
        throw new Error({_error: '取得に失敗しました'})
      })
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}
