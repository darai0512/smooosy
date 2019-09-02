const LOADALL = 'runtimeConfig/LOADALL'

const initData = {
  runtimeConfigs: [],
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case LOADALL:
      {
        return {
          ...state,
          runtimeConfigs: action.runtimeConfigs || state.runtimeConfigs,
        }
      }
    default:
      return state
  }
}

export function loadActiveRuntimeConfigs() {
  return async (dispatch, getState, client) => {
    client
      .get('/api/runtimeConfigs/active')
      .then(res => res.data)
      .then(runtimeConfigs => {
        return dispatch({type: LOADALL, runtimeConfigs})
      })
  }
}
