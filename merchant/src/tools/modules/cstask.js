const LOAD = 'cstask/LOAD'

const initialState = {
  licences: [],
  deactivates: [],
  identifications: [],
  interviews: [],
  negativeChats: [],
  others: [],
  taskOfProfile: null,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        licences: action.licences || state.licences,
        deactivates: action.deactivates || state.deactivates,
        identifications: action.identifications || state.identifications,
        interviews: action.interviews || state.interviews,
        negativeChats: action.negativeChats || state.negativeChats,
        others: action.others || state.others,
        taskOfProfile: action.taskOfProfile || state.taskOfProfile,
      }
    default:
      return state
  }
}

export function loadAll() {
  return (dispatch, getState, client) => {
    return client.get('/api/admin/cstasks')
      .then(res => res.data)
      .then(tasks => dispatch({type: LOAD, ...tasks}))
  }
}

export function update(id, values) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/cstasks/${id}`, values)
  }
}

export function assign(id, user) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/cstasks/${id}/assign`, {user})
      .then(res => res.data)
      .then(tasks => dispatch({type: LOAD, ...tasks}))
  }
}

export function cancelAssign(id) {
  return (dispatch, getState, client) => {
    return client.put(`/api/admin/cstasks/${id}/cancelAssign`)
      .then(res => res.data)
      .then(tasks => dispatch({type: LOAD, ...tasks}))
  }
}

export function create(data) {
  return (dispatch, getState, client) => {
    return client.post('/api/admin/cstasks', data)
      .then(res => res.data)
      .then(({others}) => dispatch({type: LOAD, others}))
  }
}

export function loadByProfile(id) {
  return (dispatch, getState, client) => {
    return client.get(`/api/admin/profiles/${id}/cstasks`)
      .then(res => res.data)
      .then(taskOfProfile => dispatch({type: LOAD, taskOfProfile}))
  }
}

export function sort(cond) {
  return (dispatch, getState) => {
    const tasks = getState().cstask
    const { target, direction } = cond
    const newTasks = {}
    if (target === 'createdAt') {
      ['licences', 'deactivates', 'identifications', 'interviews', 'others'].forEach(t => {
        newTasks[t] = tasks[t].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        if (direction === -1) {
          newTasks[t] = newTasks[t].reverse()
        }
      })
    }
    dispatch({type: LOAD, ...newTasks})
  }
}
