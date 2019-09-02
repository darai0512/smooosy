const LOADALL = 'experiment/LOADALL'
const LOAD = 'experiment/LOAD'

const initData = {
  experiments: [],
  experiment: null,
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case LOADALL:
      return {
        ...state,
        experiments: action.experiments || state.experiments,
      }
    case LOAD:
      return {
        ...state,
        experiment: action.experiment || state.experiment,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/admin/experiments')
      .then(res => res.data)
      .then(experiments => {
        dispatch({type: LOADALL, experiments})
        return experiments
      })
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/experiments/${id}`)
      .then(res => res.data)
      .then(experiment => {
        dispatch({type: LOAD, experiment})
        return experiment
      })
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/experiments', data)
      .then(res => res.data)
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/experiments/${id}`, data)
      .then(res => res.data)
  }
}

export function remove(ids) {
  return (dispatch, getState, client) => {
    return client.delete('/api/admin/experiments', {data: ids})
  }
}
