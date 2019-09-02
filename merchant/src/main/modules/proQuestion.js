const SHOW = 'proQuestion/SHOW'

const initData = {
  proQuestions: [],
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case SHOW:
      return {
        ...state,
        proQuestions: action.proQuestions || state.proQuestions,
      }
    default:
      return state
  }
}

export function show(profileId) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/proQuestions/showForPro/${profileId}`)
      .then(res => res.data)
      .then(proQuestions => {
        dispatch({type: SHOW, proQuestions})
        return proQuestions
      })
  }
}