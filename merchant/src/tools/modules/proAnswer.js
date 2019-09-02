const UPDATE = 'proAnswer/UPDATE'

const initData = {
  proAnswer: null,
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case UPDATE:
      return {
        ...state,
        proAnswer: action.proAnswer || state.proAnswer,
      }
    default:
      return state
  }
}

export function update(id, data) {
  return (dispatch, getState, client) => {
    return client
      .put(`/api/admin/proAnswers/${id}`, data)
      .then(res => res.data)
      .then(proAnswer => {
        dispatch({type: UPDATE, proAnswer})
        return proAnswer
      })
  }
}