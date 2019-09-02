const initialState = {
  ReadMore: null,
}

export default function reducer(state = {}) {
  return {
    ...initialState,
    ...state,
  }
}
