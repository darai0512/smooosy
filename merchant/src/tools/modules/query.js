const LOAD = 'query/LOAD'
const LOAD_TAGS = 'query/LOAD_TAGS'

const initialState = {
  queries: [],
  tags: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        queries: action.queries || [],
      }
    case LOAD_TAGS:
      return {
        ...state,
        tags: action.tags || [],
      }
    default:
      return state
  }
}

export function load(tags) {
  return (dispatch, getState, client) => {
    const params = {}
    if (tags) {
      params.tags = typeof tags === 'string' ? [tags] : tags
    }
    return client
      .get('/api/admin/queries', {params})
      .then(res => dispatch({type: LOAD, queries: res.data}))
  }
}

export function loadTags() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/queries/tags')
      .then(res => dispatch({type: LOAD_TAGS, tags: res.data}))
  }
}

export function update(query) {
  return (dispatch, getState, client) => {
    const files = []
    const options = (query.options || []).map(option => {
      const { file, image, ...rest } = option

      if (image === null) {
        rest.imageUpdatedAt = null
      } else if (file) {
        rest.imageUpdatedAt = new Date()
      }
      files.push(file || null)

      return rest
    })

    const promise = query.id ?
                    client.put(`/api/admin/queries/${query.id}`, {...query, options}) :
                    client.post('/api/admin/queries', {...query, options})

    if (files.filter(e => e).length) {
      return promise
        .then(res => res.data)
        .then(query => {
          const targets = files.map((file, idx) => (file ? {file, id: query.options[idx].id} : null)).filter(e => e)

          return client
            .post('/api/admin/queries/signedUrls', {ids: targets.map(e => e.id)})
            .then(res => res.data)
            .then(data => Promise.all(targets.map(e => client.put(data[e.id], e.file, {headers: {'Content-Type': e.file.type}}))))
            .then(() => query)
        })
    }
    return promise.then(res => res.data)

  }
}

export function remove(query) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/queries/${query.id}`, query)
  }
}
