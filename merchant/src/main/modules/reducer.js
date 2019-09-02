import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import { reducer as form } from 'redux-form'

import amp from './amp'
import auth from './auth'
import point from './point'
import profile from './profile'
import service from './service'
import request from './request'
import meet from './meet'
import chat from './chat'
import media from './media'
import schedule from './schedule'
import faq from './faq'
import notice from './notice'
import formattedRequest from './formattedRequest'
import keyword from './keyword'
import meetTemplate from './meetTemplate'
import category from './category'
import proQuestion from './proQuestion'
import proAnswer from './proAnswer'
import experiment from './experiment'
import thank from './thank'
import snack from './snack'
import licence from './licence'
import article from './article'
import news from './news'
import proService from './proService'
import runtimeConfig from './runtimeConfig'
import proLabel from './proLabel'

const appReducer = combineReducers({
  routing: routerReducer,
  form,
  service,
  request,
  meet,
  chat,
  profile,
  media,
  point,
  schedule,
  faq,
  notice,
  auth,
  formattedRequest,
  keyword,
  meetTemplate,
  category,
  proQuestion,
  proAnswer,
  experiment,
  thank,
  snack,
  licence,
  article,
  news,
  proService,
  runtimeConfig,
  proLabel,
  amp,
})

const rootReducer = (state, action) => {
  if (action.type === 'auth/LOGOUT') {
    return appReducer({
      routing: state.routing,
      category: state.category,
      service: state.service,
      experiment: state.experiment,
    }, action)
  }
  return appReducer(state, action)
}

export default rootReducer
