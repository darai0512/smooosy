const LOAD = 'crawl/LOAD'

const initialState = {
  total: 0,
  crawls: [],
  crawl: null,
  templates: [],
  template: null,
  status: {},
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        total: action.total || state.total,
        crawls: action.crawls || state.crawls,
        crawl: action.crawl || state.crawl,
        status: action.status || state.status,
        templates: action.templates || state.templates,
        template: action.template || state.template,
      }
    default:
      return state
  }
}

export function loadCrawls(params) {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/crawls', {params})
      .then(res => res.data)
      .then(({crawls, total}) => dispatch({type: LOAD, crawls, total}))
  }
}

export function createCrawl(body) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/crawls', body)
  }
}

export function loadCrawl(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/crawls/${id}`)
      .then(res => res.data)
      .then(crawl => dispatch({type: LOAD, crawl}))
  }
}

export function updateCrawl(values) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/crawls/${values.id}`, values)
      .then(res => res.data)
      .then(crawl => dispatch({type: LOAD, crawl}))
  }
}

export function updateMany(ids, cond) {
  return (dispatch, getState, client) => {
    return client
      .put('/api/admin/crawls', {ids, cond})
  }
}

export function removeCrawl(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/crawls/${id}`)
      .then(res => res.data)
      .then(({crawls, total}) => dispatch({type: LOAD, crawls, total}))
  }
}

export function pauseCrawl() {
  return (dispatch, getState, client) => {
    return client
      .put('/api/admin/crawls/pause')
      .then(res => dispatch({type: LOAD, status: res.data}))
  }
}

export function restartCrawl() {
  return (dispatch, getState, client) => {
    return client
      .put('/api/admin/crawls/restart')
      .then(res => dispatch({type: LOAD, status: res.data}))
  }
}

export function status() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/crawls/status')
      .then(res => dispatch({type: LOAD, status: res.data}))
  }
}

export function reset() {
  return (dispatch, getState, client) => {
    return client
      .put('/api/admin/crawls/reset')
      .then(res => dispatch({type: LOAD, status: res.data}))
  }
}

export function saveAsLead(ids) {
  return (dispatch, getState, client) => {
    if (Array.isArray(ids)) {
      const post = i => {
        const slice = ids.slice(10 * i, 10 * (i + 1))
        if (slice.length === 0) return Promise.resolve()

        return client
        .post('/api/admin/crawls/lead', {ids: slice})
          .then(() => post(i + 1))
      }
      return post(0)
    }
    return client
      .post('/api/admin/crawls/lead', {ids: [ids]})
  }
}

export function loadCrawlTemplates() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/crawlTemplates')
      .then(res => res.data)
      .then(templates => dispatch({type: LOAD, templates}))
  }
}

export function showCrawlTemplate(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/crawlTemplates/${id}`)
      .then(res => res.data)
      .then(template => dispatch({type: LOAD, template}))
  }
}

export function createCrawlTemplate() {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/crawlTemplates')
  }
}

export function updateCrawlTemplate(values) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/crawlTemplates/${values.id}`, values)
      .then(res => res.data)
      .then(template => dispatch({type: LOAD, template}))
  }
}

export function removeCrawlTemplate(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/crawlTemplates/${id}`)
      .then(res => res.data)
      .then(templates => dispatch({type: LOAD, templates}))
  }
}
