const LOADALL = 'searchKeyword/LOADALL'
const LOAD = 'searchKeyword/LOAD'
const DOWNLOAD = 'searchKeyword/DOWNLOAD'
const OUTPUT = 'searchKeyword/OUTPUT'
const RANKING = 'searchKeyword/RANKING'
const LOADCATEGORIES = 'searchKeyword/LOADCATEGORIES'
const CATEGORYVOLUME = 'searchKeyword/CATEGORYVOLUME'

const initialState = {
  searchKeywords: [],
  searchKeyword: null,
  download: null,
  output: null,
  ranking: null,
  categories: [],
  categoryVolume: null,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOADALL:
      return {
        ...state,
        searchKeywords: action.searchKeywords,
      }
    case LOAD:
      return {
        ...initialState,
        searchKeyword: action.searchKeyword,
      }
    case DOWNLOAD:
      return {
        ...state,
        download: action.download,
      }
    case OUTPUT:
      return {
        ...state,
        output: action.output,
      }
    case RANKING:
      return {
        ...state,
        ranking: action.ranking,
      }
    case LOADCATEGORIES:
      return {
        ...state,
        categories: action.categories,
      }
    case CATEGORYVOLUME:
      return {
        ...state,
        categoryVolume: action.categoryVolume,
      }
    default:
      return state
  }
}

export function loadAll(key) {
  return (dispatch, getState, client) => {
    const base = '/api/admin/searchKeywords'
    const url = key ? base + `?key=${key}` : base
    return client
      .get(url)
      .then(res => res.data)
      .then(searchKeywords => dispatch({type: LOADALL, searchKeywords}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/searchKeywords/${id}`)
      .then(res => res.data)
      .then(searchKeyword => dispatch({type: LOAD, searchKeyword}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client.post('/api/admin/searchKeywords', data)
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/searchKeywords/${id}`)
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/searchKeywords/${id}`, data)
  }
}

export function download() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/searchKeywordsDownload')
      .then(res => res.data)
      .then(download => dispatch({type: DOWNLOAD, download}))
  }
}

export function output() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/searchKeywordsExport')
      .then(res => res.data)
      .then(output => dispatch({type: OUTPUT, output}))
  }
}

export function ranking(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/searchKeywordsRanking/${id}`)
      .then(res => res.data)
      .then(ranking => dispatch({type: OUTPUT, ranking}))
  }
}

export function loadCategories() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/searchKeywordsCategories')
      .then(res => res.data)
      .then(categories => dispatch({type: LOADCATEGORIES, categories}))
  }
}

export function categoryVolume(key) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/searchKeywordsCategoryVolume/${key}`)
      .then(res => res.data)
      .then(categoryVolume => dispatch({type: CATEGORYVOLUME, categoryVolume}))
  }
}
