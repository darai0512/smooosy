import qs from 'qs'

const LOAD = 'leads/LOAD'

const initialState = {
  info: {},
  leads: [],
  errorLeads: [],
  lead: null,
  stack: 0,
  scrapingLogs: [],
  townpage: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        info: action.info || state.info,
        leads: action.leads || state.leads,
        errorLeads: action.errorLeads || state.errorLeads,
        lead: action.lead !== undefined ? action.lead : state.lead,
        stack: action.stack || state.stack,
        scrapingLogs: action.scrapingLogs || state.scrapingLogs,
        townpage: action.townpage || state.townpage,
      }
    default:
      return state
  }
}

export function loadAll(option) {
  const params = option ? `?${qs.stringify(option)}` : ''
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/leads${params}`)
      .then(res => res.data)
      .then(leads => dispatch({type: LOAD, leads}))
  }
}

export function loadAllErrors(type) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/leads/${type}`)
      .then(res => res.data)
      .then(errorLeads => {
        if (type === 'garbled') {
          dispatch({type: LOAD, leads: errorLeads, errorLeads: []})
        } else {
          dispatch({type: LOAD, errorLeads, leads: [].concat(...errorLeads.map(l => l.leads))})
        }
      })
  }
}

export function unloadAll() {
  return dispatch => dispatch({type: LOAD, leads: []})
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/leads/${id}`)
      .then(res => dispatch({type: LOAD, lead: res.data}))
  }
}

export function unload() {
  return dispatch => dispatch({type: LOAD, lead: null})
}

export function getInfo() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/leads/info')
      .then(res => res.data)
      .then(info => dispatch({type: LOAD, info}))
  }
}

export function create(data) {
  let sumInsert = 0
  return (dispatch, getState, client) => {
    const post = i => {
      const slice = data.slice(1000 * i, 1000 * (i + 1))
      if (slice.length === 0) return Promise.resolve({insertCount: sumInsert})

      return client
        .post('/api/admin/leads', {data: slice})
        .then(res => sumInsert += res.data.insertCount)
        .then(() => {
          return post(i + 1)
        })
    }
    return post(0)
  }
}

export function update(newLeads) {
  return (dispatch, getState, client) => {
    return client
      .put('/api/admin/leads', newLeads)
      .then(() => {
        const leads = getState().lead.leads
        // leadを再度取得するのは件数が多いと重いためreducerで内容をアップデートする
        if (leads.length) {
          const errorLeads = getState().lead.errorLeads
          for (let lead of newLeads) {
            const old = leads.find(d => d._id === lead._id)
            Object.keys(lead).forEach(key => old[key] = lead[key])
            // 重複・文字化けの検索結果もアップデートする
            for (let error of errorLeads) {
              const oldError = error.leads.find(d => d._id === lead._id)
              if (oldError) Object.keys(lead).forEach(key => oldError[key] = lead[key])
              error.leads = error.leads.filter(l => !l.notDuplicate)
            }
          }
          let lead
          // 1件アップデートの時だけleadも更新
          if (newLeads.length === 1) lead = newLeads[0]
          dispatch({type: LOAD, lead, leads, errorLeads: errorLeads.filter(l => l.leads.length > 1)})
        }
      })
  }
}

export function remove(id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/admin/leads/${id}`)
      .then(() => {
        const leads = getState().lead.leads
        const errorLeads = getState().lead.errorLeads
        for (let error of errorLeads) {
          error.leads = error.leads.filter(l => l._id !== id)
        }
        dispatch({
          type: LOAD,
          leads: leads.filter(l => l._id !== id),
          errorLeads: errorLeads.filter(l => l.leads.length > 1),
        })
      })
  }
}

export function send(requestId, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/admin/leads/send/${requestId}`, data)
  }
}

export function scraping(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/leads/scraping', data)
      .then(res => res.data)
      .then(stack => dispatch({ type: LOAD, stack }))
  }
}

export function scrapingStatus() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/leads/scraping/status')
      .then(res => res.data)
      .then(stack => dispatch({ type: LOAD, stack }))
  }
}

export function loadAllScrapingLog() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/leads/scraping/log')
      .then(res => res.data)
      .then(scrapingLogs => dispatch({ type: LOAD, scrapingLogs }))
  }
}

export function loadTownpageInfo() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/leads/scraping/townpage')
      .then(res => res.data)
      .then(townpage => dispatch({ type: LOAD, townpage }))
  }
}

export function inquiry(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/leads/inquiry', data)
      .then(res => res.data)
      .then(inquiry => dispatch({type: LOAD, inquiry}))
  }
}
