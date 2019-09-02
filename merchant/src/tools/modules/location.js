const LOAD = 'locations/LOAD'

const initialState = {
  locations: [],
  location: null,
  childLocations: [],
  nearLocations: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        locations: action.locations || state.locations,
        location: action.location || state.location,
        childLocations: action.childLocations || state.childLocations,
        nearLocations: action.nearLocations || state.nearLocations,
      }
    default:
      return state
  }
}

export function loadAll({keyPath}) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/locations${keyPath ? '?keyPath=' + encodeURIComponent(keyPath) : ''}`)
      .then(res => res.data)
      .then(locations => dispatch({type: LOAD, locations}))
  }
}

export function load(id, isLocationGroup = false) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/locations/${id}?isLocationGroup=${isLocationGroup}`)
      .then(res => res.data)
      .then(data => dispatch({type: LOAD, ...data}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/locations', data)
      .then(res => res.data)
      .then(location => dispatch({type: LOAD, location}))
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/locations/${id}`, data)
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/locations/${id}`)
      .then(res => res.data)
      .then(location => dispatch({type: LOAD, location}))
  }
}


export function getNearLocations({id, lat, lng, distance, isLocationGroup = false}) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/locations/getNearLocations/${id}?lat=${lat}&lng=${lng}&distance=${distance}&isLocationGroup=${isLocationGroup}`)
      .then(res => res.data)
      .then(data => dispatch({type: LOAD, ...data}))
  }
}
