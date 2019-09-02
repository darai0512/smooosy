const initialState = {
  point: null,
  payjpCustomer: null,
  defaultCard: null,
  campaigns: [],
  starterPack: null,
}
import { LOAD as LOAD_USER } from './auth'
const LOAD = 'point/LOAD'

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      {
        const payjpCustomer = action.payjpCustomer || state.payjpCustomer
        const defaultCard = payjpCustomer && payjpCustomer.default_card ? payjpCustomer.cards.data.find(c => c.id === payjpCustomer.default_card) : null

        return {
          ...state,
          point: action.point || state.point,
          payjpCustomer: action.payjpCustomer || state.payjpCustomer,
          conveniInfo: action.conveniInfo || state.conveniInfo,
          campaigns: action.campaigns || state.campaigns,
          defaultCard,
          starterPack: action.starterPack || state.starterPack,
        }
      }
    default:
      return {
        ...initialState,
        ...state,
      }
  }
}


export function starterPack() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/points/starterPack')
      .then(res => res.data)
      .then((starterPack) => dispatch({type: LOAD, starterPack}))
  }
}


export function addCard(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/points/addCard', data)
      .then(res => res.data)
      .then(({payjpCustomer}) => {
        const user = getState().auth.user
        user.hasActiveCard = true
        dispatch({type: LOAD_USER, user})
        return dispatch({type: LOAD, payjpCustomer})
      })
  }
}

export function charge(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/points/charge', data)
      .then(res => res.data)
      .then(ret => {
        const {point, price, type, _id} = ret.transactions[0]
        window.mixpanel && window.mixpanel.people.track_charge(price)
        window.Intercom && window.Intercom('trackEvent', 'charge', {point, price, type})
        window.adwords_conversion && window.adwords_conversion({
          event_id: 'E3vWCJ7Bv5EBEK-RjPEC',
          type: 'pro',
          value: price,
          currency: 'JPY',
          transaction_id: _id,
        })
        const user = getState().auth.user
        user.hasActiveCard = true
        dispatch({type: LOAD_USER, user})
        return dispatch({type: LOAD, point: ret})
      })
  }
}

export function chargeNetbank(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/points/chargeNetbank', data)
      .then(res => res.data)
  }
}

export function chargeConveni(data) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/points/chargeConveni', data)
      .then(res => res.data)
      .then(conveniInfo => dispatch({type: LOAD, conveniInfo}))
  }
}

export function removeCard(card) {
  return (dispatch, getState, client) => {
    return client
      .post('/api/points/removeCard', {card})
      .then(res => res.data)
      .then(payjpCustomer => {
        const user = getState().auth.user
        user.hasActiveCard = false
        dispatch({type: LOAD_USER, user})
        return dispatch({type: LOAD, payjpCustomer})
      })
  }
}

export function paymentInfo() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/points/info')
      .then(res => res.data)
      .then(({payjpCustomer, conveniInfo}) => dispatch({type: LOAD, payjpCustomer, conveniInfo}))
  }
}

export function load() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/points/@me')
      .then(res => res.data)
      .then(point => dispatch({type: LOAD, point}))
  }
}

export function loadCampaigns() {
  return (dispatch, getState, client) => {
    return client
      .get('/api/points/campaigns')
      .then(res => res.data)
      .then(campaigns => dispatch({type: LOAD, campaigns}))
  }
}

export function applyCampaign(key) {
  return (dispatch, getState, client) => {
    return client
      .post(`/api/points/campaigns/${key}`)
      .then(res => res.data)
      .then(campaigns => dispatch({type: LOAD, campaigns}))
  }
}