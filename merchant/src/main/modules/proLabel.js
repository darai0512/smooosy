import qs from 'qs'

const initialState = {
  labels: [],
}

const LOAD = 'proLabel/LOAD'

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        labels: action.labels,
      }
    default:
      return state
  }
}

export function loadAll(services) {
  if (!Array.isArray(services)) {
    services = [services]
  }
  return (dispatch, getState, client) => {
    return client
    .get(`/api/proLabels?${qs.stringify({services})}`)
    .then(res => dispatch({type: LOAD, labels: res.data.labels}))
  }
}
