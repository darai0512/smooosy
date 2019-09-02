const UPDATE = 'proAnswer/UPDATE'

const initData = {
  proAnswers: [],
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case UPDATE:
      return {
        ...state,
        proAnswers: action.proAnswers || state.proAnswers,
      }
    default:
      return state
  }
}

export function update(datas) {
  return (dispatch, getState, client) => {
    return client
      .put('/api/proAnswers', datas)
      .then(res => res.data)
      .then(proAnswers => {
        dispatch({type: UPDATE, proAnswers})
        return proAnswers
      })
  }
}