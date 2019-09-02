const LOAD = 'proQuestion/LOAD'
const LOAD_TAGS = 'proQuestion/LOAD_TAGS'

const initialState = {
  proQuestions: [],
  proQuestion: null,
  tags: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        proQuestions: action.proQuestions || state.proQuestions,
        proQuestion: action.proQuestion || state.proQuestion,
      }
    case LOAD_TAGS:
      return {
        ...state,
        tags: action.tags || [],
      }
    default:
      return state
  }
}

export function loadAll(tags) {
  return (dispatch, getState, client) => {
    const params = {}
    if (tags) {
      params.tags = typeof tags === 'string' ? [tags] : tags
    }
    return client
      .get('/api/admin/proQuestions', {params})
      .then(res => dispatch({type: LOAD, proQuestions: res.data}))
  }
}

export function load(id) {
  return (dispatch, getState, client) => {
    return client
      .get(`/api/admin/proQuestions/${id}`)
      .then(res => dispatch({type: LOAD, proQuestion: res.data}))
  }
}


export function update(proQuestion) {
  return (dispatch, getState, client) => {

    const promise = proQuestion.id ?
                    client.put(`/api/admin/proQuestions/${proQuestion.id}`, proQuestion) :
                    client.post('/api/admin/proQuestions', proQuestion)

    return promise.then(res => res.data)
  }
}

export function remove(proQuestion) {
  return (dispatch, getState, client) => {
    return client.delete(`/api/admin/proQuestions/${proQuestion.id}`, proQuestion)
  }
}
