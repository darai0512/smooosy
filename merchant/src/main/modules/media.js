import qs from 'qs'

const LOAD = 'media/LOAD'
const MEDIA_PARTIAL = 'media/PARTIAL'
const LIST_PARTIAL = 'mediaList/PARTIAL'
const REMOVE = 'media/REMOVE'

const initialState = {
  mediaLists: [],
  media: [],
}

export default function reducer(state = initialState, action = {}) {
  let index, media, mediaLists

  switch (action.type) {
    case LOAD:
      return {
        ...state,
        mediaLists: action.mediaLists || state.mediaLists,
        media: action.media || state.media,
      }
    case MEDIA_PARTIAL:
      index = state.media.map(m => m._id).indexOf(action.media._id)
      if (index === -1) {
        media = [...state.media, action.media]
      } else {
        media = [...state.media]
        media[index] = action.media
      }
      mediaLists = state.mediaLists.map(l => ({
        ...l,
        media: l.media.map(m => m._id === action.media._id ? action.media : m),
      }))

      return {
        ...state,
        media,
        mediaLists,
      }
    case LIST_PARTIAL:
      index = state.mediaLists.map(l => l._id).indexOf(action.mediaList._id)
      if (index === -1) {
        mediaLists = [...state.mediaLists, action.mediaList]
      } else {
        mediaLists = [...state.mediaLists]
        mediaLists[index] = action.mediaList
      }

      return {
        ...state,
        mediaLists,
      }
    case REMOVE:
      index = state.media.map(m => m._id).indexOf(action._id)
      media = [...state.media]
      media.splice(index, 1)

      return {
        ...state,
        media,
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/media')
      .then(res => res.data)
      .then(media => dispatch({type: LOAD, media}))
  }
}

export function update(_id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/media/${_id}`, data)
      .then(res => res.data)
      .then(media => dispatch({type: MEDIA_PARTIAL, media}))
  }
}

export function create(data) {
  const file = data.file
  if (file && ['jpg', 'png', 'gif'].indexOf(data.ext) !== -1) {
    data.type = 'image'
    delete data.file
  } else if (data.video) {
    data.type = 'video'
  } else {
    throw new Error('JPEG, PNG, GIFファイルのみ対応しております')
  }

  return (dispatch, getState, client) => {
    return client
      .post('/api/media', data)
      .then(res => res.data)
      .then(media => {
        if (!file) return Promise.resolve(media)

        return new Promise((resolve, reject) => {
          client
            .put(media.signedUrl, file, {headers: {'Content-Type': data.mime}})
            .then(() => resolve(media))
            .catch(reject)
        })
      })
      .then(media => {
        dispatch({type: MEDIA_PARTIAL, media})
        return media
      })
  }
}

export function remove(_id) {
  return (dispatch, getState, client) => {
    return client
      .delete(`/api/media/${_id}`)
      .then(() => dispatch({type: REMOVE, _id}))
  }
}

export function loadMediaList(option) {
  const params = option ? `?${qs.stringify(option)}` : ''
  return (dispatch, getState, client) => {
    dispatch({type: LOAD, mediaLists: []})
    return client
      .get(`/api/medialists${params}`)
      .catch(() => {
        throw new Error({_error: '取得に失敗しました'})
      })
      .then(res => res.data)
      .then(mediaLists => dispatch({type: LOAD, mediaLists}))
  }
}

export function upsertMediaList(_id, data) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/medialists/${_id}`, data)
      .then(res => res.data)
      .then(mediaList => dispatch({type: LIST_PARTIAL, mediaList}))
  }
}
