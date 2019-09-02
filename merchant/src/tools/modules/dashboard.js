const LOAD = 'dashboard/LOAD'

const initialState = {
  focusCard: null,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        focusCard: action.focusCard !== undefined ? action.focusCard : state.focusCard,
        dense: action.dense !== undefined ? action.dense : state.dense,
      }
    default:
      return state
  }
}

export function onFocusChange(focusCard = null) {
  return { type: LOAD, focusCard }
}

export function toggleDense(dense) {
  return { type: LOAD, dense }
}
