import axios from 'axios'
import qs from 'qs'

const LOAD = 'service/LOAD'
const LOAD_ESTIMATE = 'service/LOAD_ESTIMATE'
const LOAD_GLOBAL = 'service/LOAD_GLOBAL'
const LOAD_SP_V2 = 'service/LOAD_SP_V2'
const LOAD_FOR_SP = 'service/LOAD_FOR_SP'

const initialState = {
  service: null,
  serviceMapWithQueries: {}, // QueryDialog用のデータ
  services: [],
  allServices: [],
  spInfo: {},
  sppInfo: {},
  globalSearch: { service: null, zip: '' },
  // used in service page routing (ServicePageContainer)
  spService: null,
}

const CancelToken = axios.CancelToken
let source = null

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...initialState,
        ...state,
        service: action.service || state.service,
        serviceMapWithQueries: action.serviceMapWithQueries || state.serviceMapWithQueries,
        services: action.services || state.services,
        allServices: action.allServices || state.allServices,
        spInfo: action.spInfo || state.spInfo,
        sppInfo: action.sppInfo || state.sppInfo,
      }
    case LOAD_ESTIMATE:
      state.sppInfo.priceEstimate = action.priceEstimate
      return {
        ...initialState,
        ...state,
        sppInfo: state.sppInfo,
      }
    case LOAD_GLOBAL:
      return {
        ...initialState,
        ...state,
        globalSearch: {
          ...state.globalSearch,
          ...action.globalSearch,
        },
      }
    case LOAD_SP_V2:
      return {
        ...state,
        servicePageV2: action.servicePageV2,
      }
    case LOAD_FOR_SP:
      return {
        ...state,
        spService: action.service,
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

async function fetchServiceWithQueries({getState, client, key}) {
  // すでに取得済みの場合
  const serviceMapWithQueries = getState().service.serviceMapWithQueries
  if (key in serviceMapWithQueries) {
    return Promise.resolve(serviceMapWithQueries)
  }

  // まだ取得していない場合
  const service = await client.get(`/api/services/${key}`).then(res => res.data)
  serviceMapWithQueries[service._id] = service
  serviceMapWithQueries[service.key] = service
  return serviceMapWithQueries
}

export function prefetchWithQueries(key) {
  return (dispatch, getState, client) => {
    return fetchServiceWithQueries({getState, client, key})
      .then(serviceMapWithQueries => {
        // do not dispatch service
        return dispatch({type: LOAD, serviceMapWithQueries})
      })
  }
}

export function load(key) {
  return (dispatch, getState, client) => {
    return fetchServiceWithQueries({getState, client, key})
      .then(serviceMapWithQueries => {
        const service = serviceMapWithQueries[key]
        return dispatch({type: LOAD, service, serviceMapWithQueries})
      })
  }
}

export function loadForSP(key) {
  return (dispatch, getState, client) => {
    return fetchServiceWithQueries({getState, client, key})
      .then(serviceMapWithQueries => {
        const service = serviceMapWithQueries[key]
        dispatch({type: LOAD, serviceMapWithQueries})
        dispatch({type: LOAD_FOR_SP, service})
      })
  }
}

export function unloadForSP() {
  return dispatch => dispatch({type: LOAD_FOR_SP, service: null})
}

export function loadAll(tags) {
  return async (dispatch, getState, client) => {
    let allServices = getState().service.allServices
    const action = {type: LOAD}
    if (allServices.length === 0) {
      allServices = await client.get('/api/services').then(res => res.data)
      action.allServices = allServices
    }

    if (tags) {
      tags = typeof tags === 'string' ? [tags] : tags
      const services = allServices.filter(s => {
        for (let tag of tags) {
          if (s.tags.indexOf(tag) !== -1) {
            return true
          }
        }
        return false
      })
      action.services = services
    } else {
      action.services = allServices
    }

    return Promise.resolve(dispatch(action))
  }
}

export function spFetch({key, pref, city, town}) {
  return (dispatch, getState, client) => {
    source = CancelToken.source()
    return client
      .get(`/api/services/${key}/page`, { params: { pref, city, town }, cancelToken: source.token })
      .then(res => res.data)
      .then(spInfo => {
        dispatch({type: LOAD_GLOBAL, globalSearch: { service: spInfo.service }})
        return dispatch({type: LOAD, spInfo})
      })
      .finally(() => {
        source = null
      })
  }
}

export function spUnload() {
  // ロード中の場合、キャンセル
  if (source && source.cancel) {
    source.cancel()
  }

  return {
    type: LOAD,
    spInfo: {},
  }
}

export function sppFetch(key) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/services/${key}/price`)
      .then(res => res.data)
      .then(sppInfo => dispatch({type: LOAD, sppInfo}))
  }
}

export function loadEstimate({id = '', key = '', questions}) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/services/priceEstimate?questions=${JSON.stringify(questions)}&id=${id}&key=${key}`)
      .then(res => res.data)
      .then(priceEstimate => dispatch({type: LOAD_ESTIMATE, priceEstimate}))
  }
}

export function sppUnload() {
  return {
    type: LOAD,
    sppInfo: {},
  }
}

export function updateGlobalSearch(globalSearch) {
  return {
    type: LOAD_GLOBAL,
    globalSearch,
  }
}

export function servicePageV2(key, query) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/services/v2/${key}${qs.stringify(query, {addQueryPrefix: true})}`)
      .then(res => res.data)
      .then(servicePageV2 => dispatch({type: LOAD_SP_V2, servicePageV2}))
  }
}

export function servicePageV2Unload() {
  return dispatch => dispatch({type: LOAD_SP_V2})
}
