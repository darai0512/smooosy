const OPEN = 'snack/OPEN'
const CLOSE = 'snack/CLOSE'

const initialState = {
  open: false,
  message: '',
  option: {},
}

export default function snack(state = initialState, action) {
  switch (action.type) {
    case OPEN:
      return {
        ...state,
        open: true,
        message: action.message || '',
        option: {
          duration: action.option && action.option.duration === null ? null : 3000,
          ...action.option,
        },
      }
    case CLOSE:
      return {
        ...state,
        open: false,
      }
    default: return state
  }
}

export function open(message, option) {
  return dispatch => dispatch({type: OPEN, message, option})
}

export function close() {
  return dispatch => dispatch({type: CLOSE})
}
