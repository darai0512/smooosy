const LOADALL = 'category/LOADALL'
const LOAD = 'category/LOAD'

const initData = {
  categories: [],
  category: null,
  media: [],
}

export default function reducer(state = initData, action = {}) {
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
        media: action.media || state.media,
      }
    default:
      return state
  }
}

export function loadAll() {
  return async (dispatch, getState, client) => {
    let categories = getState().category.categories
    const action = {type: LOADALL}
    if (categories.length === 0) {
      categories = await client.get('/api/categories').then(res => res.data)
      action.categories = categories
    }

    return Promise.resolve()
      .then(() => {
        dispatch(action)
        return categories
      })
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

export function create(category) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/categories', category)
      .then(res => res.data)
      .then(category => {
        dispatch({type: LOAD, category})
        return category
      })
  }
}

export function update(category) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/categories/${category.id}`, category)
  }
}

export function relatedMedia(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/categories/${id}/relatedMedia`)
      .then(res => res.data)
      .then(media => dispatch({type: LOAD, media}))
  }
}