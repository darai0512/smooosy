const LOADALL = 'experiment/LOADALL'

const initData = {
  experiments: {},
}

export default function reducer(state = initData, action = {}) {
  switch (action.type) {
    case LOADALL:
      {
        return {
          ...state,
          experiments: action.experiments || state.experiments,
        }
      }
    default:
      return state
  }
}

export function loadActiveExperiments() {
  return async (dispatch, getState, client) => {
    client
      .get('/api/experiments/active')
      .then(res => res.data)
      .then(exps => {
        const experiments = {}
        for (let exp of exps) {
          experiments[exp.name] = exp.bucket
        }
        return dispatch({type: LOADALL, experiments})
      })
  }
}
