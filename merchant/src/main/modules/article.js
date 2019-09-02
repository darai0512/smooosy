const LOAD = 'article/LOAD'

const initialState = {
  wpInfo: {},
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...initialState,
        ...state,
        wpInfo: action.wpInfo || state.wpInfo,
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function loadNewsArticle(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/articles/${id}`)
      .then(res => res.data)
      .then(wpInfo => dispatch({type: LOAD, wpInfo}))
  }
}

export function loadServiceArticle(id, serviceKey, isPickup) {
  const articleType = isPickup ? 'pickups' : 'articles'
  return (dispatch, getState, client) => {
    return client
      .get(`/api/services/${serviceKey}/${articleType}/${id}`)
      .then(res => res.data)
      .then(wpInfo => dispatch({type: LOAD, wpInfo}))
  }
}

export function loadCategoryArticle(id, categoryKey, isPickup) {
  const articleType = isPickup ? 'pickups' : 'articles'
  return (dispatch, getState, client) => {
    return client
      .get(`/api/categories/${categoryKey}/${articleType}/${id}`)
      .then(res => res.data)
      .then(wpInfo => dispatch({type: LOAD, wpInfo}))
  }
}

export function loadProArticle(id, categoryKey) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/categories/${categoryKey}/proarticles/${id}`)
      .then(res => res.data)
      .then(wpInfo => dispatch({type: LOAD, wpInfo}))
  }
}

export function clearArticleCache(id, params) {
  return (dispatch, getState, client) => {
    return client
      .post(`/media/cacheInvalidation/${id}`, params)
      .then(res => res.data)
  }
}

export function unload() {
  return {
    type: LOAD,
    wpInfo: {},
  }
}
