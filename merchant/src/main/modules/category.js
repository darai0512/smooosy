const LOADALL = 'category/LOADALL'
const LOAD = 'category/LOAD'
const LOADCATEGORYPAGE = 'category/LOADCATEGORYPAGE'
const LOADPROCATEGORYPAGE = 'category/LOADPROCATEGORYPAGE'
const INSIGHT = 'category/INSIGHT'

const initialState = {
  categories: [],
  category: null,
  services: null,
  request: null,
  cpInfo: {},
}

export default function reducer(state = initialState, action = {}) {
  state = { ...initialState, ...state }
  switch (action.type) {
    case LOADALL:
      return {
        ...state,
        categories: action.categories || state.categories,
      }
    case LOAD:
      return {
        ...state,
        category: action.category || state.category,
      }
    case LOADCATEGORYPAGE:
      return {
        ...state,
        cpInfo: action.cpInfo || state.cpInfo,
      }
    case LOADPROCATEGORYPAGE:
      return {
        ...state,
        caetgory: action.category || state.category,
        services: action.services || state.services,
        request: action.request || state.request,
      }
    case INSIGHT:
      return {
        ...state,
        insight: action.insight || state.insight,
      }
    default:
      return state
  }
}

export function loadAll() {
  return async (dispatch, getState, client) => {
    let categories = getState().category.categories
    if (categories.length === 0) {
      categories = await client.get('/api/categories').then(res => res.data)
    }
    dispatch({type: LOADALL, categories})
    return categories
  }
}

export function load(key) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/categories/${key}`)
      .then(res => res.data)
      .then(category => {
        dispatch({type: LOAD, category})
        return category
      })
  }
}


export function cpFetch(categoryKey, pref, city, town) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/categories/${categoryKey}/categoryPage`, { params: { pref, city, town } })
      .then(res => res.data)
      .then(cpInfo => {
        dispatch({type: LOADCATEGORYPAGE, cpInfo})
        return cpInfo
      })
  }
}

export function cpUnload() {
  return {
    type: LOADCATEGORYPAGE,
    cpInfo: {},
  }
}


export function proCategoryPage(categoryKey) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/categories/${categoryKey}/proCategoryPage`)
      .then(res => res.data)
      .then(({category, services, request}) => {
        dispatch({type: LOADPROCATEGORYPAGE, category, services, request})
        return {category, services, request}
      })
  }
}

export function loadInsight(name) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/categories/${encodeURIComponent(name)}/insights`)
      .then(res => res.data)
      .then(insight => {
        dispatch({type: INSIGHT, insight})
        return insight
      })
  }
}
