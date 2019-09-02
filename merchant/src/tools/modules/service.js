import axios from 'axios'

const LOAD = 'service/LOAD'
const UPDATE = 'service/UPDATE'

const initialState = {
  allServices: [],
  services: [],
  media: [],
  priceEstimate: {},
}

const CancelToken = axios.CancelToken
let source = null

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        allServices: action.allServices || state.allServices,
        services: action.services || state.services,
        media: action.media || state.media,
        priceEstimate: action.priceEstimate || state.priceEstimate,
        spInfo: action.spInfo || state.spInfo,
      }
    case UPDATE: {
      const service = action.service
      const allServices = state.allServices
      const idx = allServices.findIndex(s => s._id === service._id)
      allServices[idx] = {
        ...allServices[idx],
        ...service,
      }
      return {
        ...state,
        allServices,
      }
    }
    default:
      return state
  }
}

export function load(tags) {
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

// queriesをpopulateするので重い
export function loadAll(type = 'query') {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/services?type=${type}`)
      .then(res => res.data)
      .then(allServices => dispatch({type: LOAD, allServices}))
  }
}

export function update(service) {
  return (dispatch, getState, client) => {
    // except queries
    delete service.queries

    const file = service.file

    if (file) {
      service.imageUpdatedAt = new Date()
    }

    const promise = service.id ?
                    client.put(`/api/admin/services/${service.id}`, service) :
                    client.post('/api/admin/services', service)
    return promise
      .then(res => res.data)
      .then(data => {
        if (file) {
          return client
            .get(`/api/admin/services/${data.id}/getSignedUrl`)
            .then(res => res.data)
            .then(data => client.put(data.signedUrl, file, {headers: {'Content-Type': file.type}}))
        }
        dispatch({type: UPDATE, service: data})
        return data
      })
  }
}

export function updateQueries(service) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/services/${service.id}`, {
        queries: service
          .queries
          .map(query => query.id)
          .filter((e, idx, arr) => arr.indexOf(e) === idx),
      })
      .then(res => res.data)
  }
}

export function updateProQuestions(service) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/services/${service.id}`, {
        proQuestions: service
          .proQuestions
          .map(proQuestion => proQuestion.id)
          .filter((e, idx, arr) => arr.indexOf(e) === idx),
      })
      .then(res => res.data)
  }
}

export function remove(serviceId, migrateTo) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/services/delete/${serviceId}`, {migrateTo})
      .then(() => {
        const services = getState().service.allServices
        dispatch({
          type: LOAD,
          allServices: services.filter(s => s.id !== serviceId),
          service: null,
        })
      })
  }
}

export function relatedMedia(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/services/${id}/relatedMedia`)
      .then(res => res.data)
      .then(media => dispatch({type: LOAD, media}))
  }
}

export function loadPriceEstimate(key, questions) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/services/${key}/priceEstimate?questions=${JSON.stringify(questions)}`)
      .then(res => res.data)
      .then(priceEstimate => dispatch({type: LOAD, priceEstimate}))
  }
}


export function spFetch({key, pref, city, town}) {
  return (dispatch, getState, client) => {
    source = CancelToken.source()
    return client
      .get(`/api/services/${key}/page`, { params: { pref, city, town }, cancelToken: source.token })
      .then(res => res.data)
      .then(spInfo => {
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

export function copyQuery(serviceId) {
  return (dispatch, getState, client) => {
    return client.post(`/api/admin/services/${serviceId}/copyQuery`)
  }
}