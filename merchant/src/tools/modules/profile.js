import qs from 'qs'

const LOAD = 'profiles/LOAD'
const LOAD_CS_EMAIL_TEMPLATES = 'profiles/LOAD_CS_EMAIL_TEMPLATES'

const initialState = {
  profiles: [],
  locationProfiles: [],
}

export default function reducer(state = initialState, action = {}) {
  let index, profiles

  switch (action.type) {
    case LOAD:
      index = state.profiles.map(p => p.id).indexOf((action.profile || {}).id)
      if (index !== -1) {
        profiles = [...state.profiles]
        profiles[index] = action.profile
      }

      return {
        ...state,
        profiles: action.profiles || profiles || state.profiles,
        locationProfiles: action.locationProfiles || state.locationProfiles,
        profile: action.profile !== undefined ? action.profile : state.profile,
      }
    case LOAD_CS_EMAIL_TEMPLATES:
      return {
        ...state,
        csEmailTemplates: action.csEmailTemplates || state.csEmailTemplates,
      }

    default:
      return state
  }
}


export function loadAll(option) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/profiles', option)
      .then(res => res.data)
      .then(profiles => dispatch({type: LOAD, profiles}))
  }
}

export function loadLocationAll(option) {
  const params = option ? `?${qs.stringify(option)}` : ''
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/profiles/location${params}`)
      .then(res => res.data)
      .then(locationProfiles => dispatch({type: LOAD, locationProfiles}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    const p = getState().profile.profile
    if (p && p.id !== id) {
      dispatch({type: LOAD, profile: null})
    }
    return client
      .get(`/api/admin/profiles/${id}`)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function update(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/profiles/${data.id}`, data)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function deactivate(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/profiles/${id}`)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function updateReview(data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/reviews/${data.id}`, data)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function removeReview(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/reviews/${id}`)
      .then(res => res.data)
      .then(profile => dispatch({type: LOAD, profile}))
  }
}

export function loadCsEmailTemplates(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/profiles/${id}/csEmailTemplates`)
      .then(res => res.data)
      .then(csEmailTemplates => dispatch({type: LOAD_CS_EMAIL_TEMPLATES, csEmailTemplates}))
  }
}

export function sendEmail(id, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/profiles/${id}/email`, data)
  }
}