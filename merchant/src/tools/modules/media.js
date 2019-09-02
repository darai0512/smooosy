const LOAD = 'media/LOAD'
const MEDIA_PARTIAL = 'media/PARTIAL'

const initialState = {
  media: [],
  mediaLists: [],
}

export default function reducer(state = initialState, action = {}) {
  let index, media

  switch (action.type) {
    case LOAD:
      return {
        ...state,
        media: action.media || state.media,
        mediaLists: action.mediaLists || state.mediaLists,
      }
    case MEDIA_PARTIAL:
      index = state.media.map(m => m.id).indexOf(action.media.id)
      if (index === -1) {
        media = [...state.media, action.media]
      } else {
        media = [...state.media]
        media[index] = action.media
      }

      return {
        ...state,
        media,
      }
    default:
      return state
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/media/${id}`, data)
      .then(res => res.data)
      .then(media => dispatch({type: MEDIA_PARTIAL, media}))
  }
}

export function create(id, data) {
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
      .post(`/api/admin/users/${id}/media`, data)
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

export function loadMediaLists(profile) {
  return (dispatch, getState, client) => {
    return client
      .get('/api/medialists', {params: { profile }})
      .then(res => res.data)
      .then(mediaLists => dispatch({type: LOAD, mediaLists}))
  }
}

