const LOAD = 'proService/LOAD'
const LOAD_INSTANT_RESULTS = 'instantResults/LOAD'
const UNLOAD_REQUEST = 'instantResults/UNLOAD_REQUEST'
const LOAD_LAST_RESULT = 'instantResults/LOAD_LAST_RESULT'

const initialState = {
  proServices: {},
  proService: null,
  instantResults: null, // instantResults become an Array if loaded
  service: {},
}

export default function reducer(state = initialState, action = {}) {

  switch (action.type) {
    case LOAD_INSTANT_RESULTS:
      return {
        ...initialState,
        ...state,
        instantResults: action.proServices || state.instantResults,
        request: action.request || state.request,
        // result cache
        lastResult: {
          search: action.search,
          results: action.proServices,
        },
      }
    case LOAD:
      return {
        ...initialState,
        ...state,
        proService: action.proService || state.proService,
        proServices: action.proServices || state.proServices,
      }
    case UNLOAD_REQUEST:
      return {
        ...initialState,
        ...state,
        request: null,
      }
    case LOAD_LAST_RESULT: {
      return {
        ...initialState,
        ...state,
        instantResults: state.lastResult.results,
      }
    }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function loadAll(onlyMatchMore) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/pros/services${onlyMatchMore ? '?onlyMatchMore=true' : ''}`)
      .then(res => res.data)
      .then(datas => {
        const proServices = {}
        for (let data of datas) {
          proServices[data.service._id] = data
        }
        return dispatch({type: LOAD, proServices})
      })
  }
}

export function load(serviceId) {
  return (dispatch, getState, client) => {

    // まだ取得していない場合
    return client
      .get(`/api/pros/services/${serviceId}`)
      .then(res => res.data)
      .then(proService => {
        return dispatch({type: LOAD, proService})
      })
  }
}

export function loadByProfile(serviceId, profileId, location, conditions, requestId) {
  return (dispatch, getState, client) => {

    const query = {location}
    if (requestId) query.requestId = requestId

    // まだ取得していない場合
    return client
      .post(`/api/profiles/${profileId}/services/${serviceId}`, {location, conditions, requestId})
      .then(res => res.data)
      .then(proService => {
        return dispatch({type: LOAD, proService})
      })
  }
}

export function update(serviceId, data) {
  return (dispatch, getState, client) => {
    return client.put(`/api/pros/services/${serviceId}`, data)
      .then(res => res.data)
      .then(proService => {
        const proServices = getState().proService.proServices

        proServices[proService.service._id] = proService
        return dispatch({type: LOAD, proService, proServices})
      })
  }
}

export function updateMany(data) {
  return (dispatch, getState, client) => {
    return client.put('/api/pros/services/bulk', data)
      .then(res => {
        const proServices = {}
        for (let data of res.data) {
          proServices[data.service._id] = data
        }
        dispatch({type: LOAD, proServices})
      })
  }
}

export function searchInstantResults(data, search) {
  return (dispatch, getState, client) => {
    // Use cache if there is a result having same ssearch string
    const lastResult = getState().proService.lastResult
    if (lastResult && decodeURI(lastResult.search) === decodeURI(search)) {
      return Promise.resolve(dispatch({type: LOAD_LAST_RESULT}))
    }
    return client.post('/api/instant-results', data)
      .then(res => res.data)
      .then(proServices => dispatch({
        type: LOAD_INSTANT_RESULTS,
        proServices,
        search,
      }))
  }
}

export function searchInstantResultsWithRequest(requestId) {
  return (dispatch, getState, client) => {
    return client.get(`/api/instant-results/${requestId}`)
      .then(res => res.data)
      .then(({proServices, request}) => dispatch({
        type: LOAD_INSTANT_RESULTS,
        proServices,
        request,
      }))
  }
}

export function unloadRequest() {
  return dispatch => {
    return Promise.resolve(dispatch({
      type: UNLOAD_REQUEST,
    }))
  }
}
