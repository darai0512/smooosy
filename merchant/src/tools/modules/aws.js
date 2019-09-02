const initialState = {
}

export default function aws(state = initialState, action) {
  switch (action.type) {
    default: return state
  }
}

export function cacheInvalidation(values) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/admin/aws/cacheInvalidation', values)
      .then(res => res.data)
  }
}
