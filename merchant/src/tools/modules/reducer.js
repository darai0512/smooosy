import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import { reducer as form } from 'redux-form'

import auth from './auth'
import service from './service'
import query from './query'
import proQuestion from './proQuestion'
import proAnswer from './proAnswer'
import profile from './profile'
import request from './request'
import meet from './meet'
import location from './location'
import lead from './lead'
import point from './point'
import media from './media'
import formattedRequest from './formattedRequest'
import searchKeyword from './searchKeyword'
import maillog from './maillog'
import meetTemplate from './meetTemplate'
import searchCondition from './searchCondition'
import blacklist from './blacklist'
import category from './category'
import crawl from './crawl'
import experiment from './experiment'
import runtimeConfig from './runtimeConfig'
import thank from './thank'
import snack from './snack'
import pageLayout from './pageLayout'
import profileIntroduction from './profileIntroduction'
import aws from './aws'
import licence from './licence'
import cstask from './cstask'
import dashboard from './dashboard'
import proService from './proService'
import csLog from './csLog'
import proLabel from './proLabel'

export default combineReducers({
  routing: routerReducer,
  form,
  auth,
  service,
  query,
  proQuestion,
  proAnswer,
  profile,
  request,
  meet,
  location,
  lead,
  point,
  media,
  formattedRequest,
  searchKeyword,
  maillog,
  meetTemplate,
  searchCondition,
  blacklist,
  category,
  crawl,
  experiment,
  runtimeConfig,
  thank,
  snack,
  pageLayout,
  profileIntroduction,
  aws,
  licence,
  cstask,
  dashboard,
  proService,
  csLog,
  proLabel,
})
