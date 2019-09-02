import 'source-map-support/register' // support stack trace on ts file
export {}
require('./lib/datadog')
// datadog should be top of the file

require('dotenv').config()
const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelop = ['development', '', undefined, null].includes(process.env.NODE_ENV)

const config = require('config')
const log4js = require('log4js')
log4js.configure(config.get('log4js'))

const logger = require('./lib/logger')

const sendgrid = require('./lib/sendgrid')
const sgMail = require('@sendgrid/mail')
const sgClient = require('@sendgrid/client')
const { slack } = require('./lib/util')
const Rollbar = require('rollbar')
const { getUserData } = require('./lib/userData')

const initMetrics = require('./lib/serverInit/metrics')
const { rootMetrics } = initMetrics({ isTest, isDevelop })

import * as path from 'path'

const rollbar = new Rollbar({
  accessToken: config.get('rollbar.server_token'),
  captureUncaught: isProd,
  captureUnhandledRejections: isProd,
})

process.on('uncaughtException', err => {
  console.error(err)
  const message = `API Uncaught Exception: ${err.name || 'Unknown'}\n\n${err.message}\n${err.stack}`
  slack({message, room: 'ops'})
})

process.on('unhandledRejection', (err: any) => {
  console.error(err)
  const message = `API Unhandled Rejection: ${err.name || 'Unknown'}\n\n${err.message}\n${err.stack}`
  slack({message, room: 'ops'})
})

/**
 * mongoose settings
 */

// load models after connection established
const models = require('./models')

/**
 * redis settings
 */
require('./lib/redis')

/**
 * express settings
 */
const express = require('express')
const app = express()

import mongooseConnect from './lib/mongo'
// gracefull start
mongooseConnect.then(async mongoose => {
  const server = app.listen(process.env.PORT || config.get('port') instanceof Promise ? await config.get('port') : config.get('port'), () => {
    logger.info('starting server', { port: server.address().port })
    rootMetrics.increment('server.start')
    process.send && process.send('ready') // notify pm2 app is ready
  })

  // graceful restart
  process.on('SIGINT', () => {
    rootMetrics.increment('server.stop')
    console.info('SIGINT signal received.')
    // Stops the server from accepting new connections and finishes existing connections.
    server.close(function(err) {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      // close your database connection and exit with success (0 code)
      // for example with mongoose
      mongoose.connection.close(function () {
        console.log('Mongoose connection disconnected')
        process.exit(0)
      })
    })
  })
})


// access real client ip over proxy with `req.ip`
app.set('trust proxy', true)

app.use(express.static(config.get('staticPath')))
app.use('/tools', express.static(config.get('staticPath') + '/tools'))

if (isDevelop) {
  // webpack
  const webpackConfig = require(path.resolve('webpack.config.js'))
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware')
  const webpack = require('webpack')
  const compiler = webpack(webpackConfig)
  app.use(
    webpackDevMiddleware(compiler, {
      logLevel: 'error',
      publicPath: webpackConfig.output.publicPath,
      watchOptions: {
        aggregateTimeout: 300,
        ignored: [/node_modules/, /dist\//],
      },
      writeToDisk(filePath) {
        return /(dist\/node\/|loadable-stats)/.test(filePath)
      },
    })
  )
  app.use(
    webpackHotMiddleware(compiler)
  )
}

/**
 * logger settings
 */
if (!isTest) {
  const consoleLogger = log4js.getLogger('console')
  console.debug = consoleLogger.info.bind(consoleLogger)
  console.log = consoleLogger.info.bind(consoleLogger)
  console.warn = consoleLogger.warn.bind(consoleLogger)
  console.error = consoleLogger.error.bind(consoleLogger)

  const logger = log4js.getLogger()
  const expressLogger = log4js.connectLogger(logger, {level: 'auto'})
  app.use(expressLogger)
}
if (isProd) {
  rollbar.log('Server restart')
  app.use(rollbar.errorHandler())
}

/**
 * express connect
 */
app.use(require('cors')())

/**
 * authorization
 */
const passport = require('passport')
const BearerStrategy = require('passport-http-bearer')
passport.use(new BearerStrategy(function(token, done) {
  models.User.findOne({token, deactivate: {$ne: true}}, function(err, user) {
    if (err) return done(err)
    if (!user) return done(null, false)
    return done(null, user)
  })
}))
const AnonymousStrategy = require('passport-anonymous')
passport.use(new AnonymousStrategy())
const authenticate = passport.authenticate('bearer', {session: false})
const partialAuth = passport.authenticate(['bearer', 'anonymous'], {session: false})

const checkAdmin = (req, res, next) => {
  if (req.user && req.user.admin) {
    next(null)
  } else {
    next(new Error('Forbidden'))
  }
}

/**
 * datadog setting
 */
if (isProd) {
  const datadog = require('connect-datadog')({
    response_code: true,
    tags: ['app:smooosy-api'],
  })
  app.use(datadog)
}



app.use((req, res, next) => {
  // This section can be extended by creating a scoped metrics client
  // from the root and adding route-specific endpoints
  req.metrics = rootMetrics
  next()
})

/**
 * sendgrid settings
 */

sendgrid.set(new sendgrid.MailClient({
  mailClient: sgMail,
  apiClient: sgClient,
  apiKey: config.get('sendgrid.apiKey'),
  templates: config.get('sendgrid.templateIdToSendGridUuid'),
  metrics: rootMetrics,
}))

/**
 * wrapper for async/await error handling
 */
function wrap(handler) {
  return async function(req, res, next) {
    try {
      req.userData = getUserData(req)
      await handler(req, res, next)
    } catch (err) {
      console.error('Internal Server Error')
      console.error(err)
      if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(404).json({message: 'not found'})
      }

      if (!res.headersSent) {
        res.status(500).json({message: 'Internal Server Error'})
      }

      if (isProd) {
        rollbar.error(err, req)
      }
      const message = `API ERROR: ${err.name || 'Unknown'}\n${req.method} ${req.originalUrl}\nbody: ${JSON.stringify(req.body)}\nuser: ${req.user ? req.user.id : ''}\nreferrer: ${req.get('Referrer')}\n${err.message}\n${err.stack}`
      await slack({message, room: 'ops'})
    }
  }
}

async function emptyResponse(req, res, next) {
  res.json(null)
  next()
}

/**
 * express routes
 */
import {
  top, users, schedules, points, services, queries, proQuestions, proAnswers, requests, maps, meets, chats,
  profiles, media, googles, lines, locations, leads, faqs, licences,
  formattedRequests, inboundLink, bigquery, categories, notices, thanks,
  keywords, searchKeywords, jobs, memos, maillogs, meetTemplates, feedbacks, experiments, runtimeConfigs,
  searchConditions, callCenter, blackLists, widgets, crawls, crawlTemplates, elasticsearch, csEmailTemplates,
  articles, news, pageLayouts, profileIntroductions, aws, cstasks, proServices, questionnaires, csLogs,
  proLabels,
} from './routes'

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json({limit: '1mb'}))

app.post('/api/sendgridWebhook', wrap(users.sendgridWebhook))
app.post('/api/signup', wrap(users.signup))
app.post('/api/login', wrap(users.login))
app.post('/api/fblogin', wrap(users.fblogin))
app.post('/api/googlelogin', wrap(users.googlelogin))
app.post('/api/linelogin', wrap(users.linelogin))
app.get('/api/linecallback', wrap(users.linecallback))
app.post('/api/reset', wrap(users.reset))
app.get('/api/checkEmail', wrap(users.checkEmail))
app.get('/api/thanks', partialAuth, wrap(thanks.show))
app.post('/api/instant-results', partialAuth, wrap(proServices.search))
app.get('/api/instant-results/:id', authenticate, wrap(proServices.searchWithRequest))
app.use(
  '/api/users',
  authenticate,
  express
    .Router()
    .get('/@me', wrap(users.show))
    .put('/@me', wrap(users.update))
    .delete('/@me', wrap(users.deactivate))
    .get('/@me/refers', wrap(users.refers))
    .put('/idImage', wrap(users.removeIdImage))
    .get('/@me/getSignedUrl', wrap(users.signedUrl))
    .get('/@me/thanks', wrap(thanks.index))
    .post('/:id/thanks', wrap(thanks.create))
    .get('/:id/schedules', wrap(schedules.index))
    .get('/@me/lineState', wrap(users.getLineState))
    .delete('/@me/line', wrap(users.removeLine))
    .get('/@me/checkDeactivatable', wrap(users.isDeactivatable))
    .get('/@me/checkLineFriend', wrap(lines.checkFriend))
)

app.use(
  '/api/points/',
  authenticate,
  express.Router()
    .post('/charge', wrap(points.charge))
    .post('/chargeNetbank', wrap(points.chargeNetbank))
    .post('/chargeConveni', wrap(points.chargeConveni))
    .post('/addCard', wrap(points.addCard))
    .post('/removeCard', wrap(points.removeCard))
    .get('/starterPack', wrap(points.getStarterPack))
    .get('/@me', wrap(points.show))
    .get('/info', wrap(points.info))
    .get('/history', wrap(points.history))
    .get('/campaigns', wrap(points.campaigns))
    .post('/campaigns/:key', wrap(points.applyCampaign))
    .get('/receipt_:year(\\d{4})_:month(\\d{2}).pdf', wrap(points.receipt))
    // TODO: FEキャッシュの関係でアクセスされる可能性があるので一週間後消す(2019/8/23)
    .get('/creditCampaign', wrap(points.creditCampaign))
)

app.post('/api/epsilon/conveni', wrap(points.webhookEpsilonConveni))
app.post('/api/epsilon/paid', wrap(points.webhookEpsilonPaid))

// イプシロンからリダイレクト
app.use(
  '/e-payment',
  express.Router()
    .get('/back', wrap(points.redirectBack))
    .get('/paid', wrap(points.redirectPaid))
    .get('/error', wrap(points.redirectError))
)

app.use(
  '/api/services',
  express.Router()
    .get('/', wrap(services.index))
    .get('/averagePrice', wrap(services.averagePrice))
    .get('/priceEstimate', wrap(services.priceEstimateFromQuestions))
    .get('/v2/:key', wrap(services.servicePageV2))
    .get('/:id', wrap(services.show))
    .get('/:key/page', wrap(services.servicePage))
    .get('/:key/price', wrap(services.servicePricePage))
    .get('/:key/articles', wrap(articles.serviceArticleList))
    .get('/:key/articles/:id', wrap(articles.serviceArticlePage))
    .get('/:key/pickups/:id', wrap(articles.serviceArticlePage))
)

// TODO: 旧api、あとで消す
app.get('/api/tags/:category/page', wrap(categories.oldServiceTagPage))

app.use(
  '/api/categories',
  express.Router()
    .get('/', wrap(categories.index))
    .get('/:category', wrap(categories.show))
    .get('/:category/categoryPage', wrap(categories.categoryPage))
    .get('/:category/proCategoryPage', wrap(categories.proCategoryPage))
    .get('/:name/insights', wrap(categories.showForInsight))
    .get('/:key/articles', wrap(articles.categoryArticleList))
    .get('/:key/articles/:id', wrap(articles.categoryArticlePage))
    .get('/:key/pickups/:id', wrap(articles.categoryArticlePage))
    .get('/:key/proarticles/:id', wrap(articles.proArticlePage))
)

app.use(
  '/api/feedbacks',
  authenticate,
  express.Router()
    .post('/', wrap(feedbacks.create))
)

app.use(
  '/api/requests',
  express.Router()
    .get('/', authenticate, wrap(requests.index))
    .post('/', authenticate, wrap(requests.create))
    .get('/getSignedUrl', wrap(requests.signedUrl))
    .get('/recent', wrap(requests.recent))
    .get('/latest', authenticate, wrap(requests.latest))
    .get('/:id', authenticate, wrap(requests.show))
    .put('/:id', authenticate, wrap(requests.update))
    .get('/:id/new', wrap(requests.showForLead))
    .put('/:id/overwrite', authenticate, wrap(requests.overwrite))
    .put('/:id/pass', authenticate, wrap(requests.pass))
    .post('/:id/matchByUser', authenticate, wrap(requests.matchByUser))
    .post('/:requestId/meets', authenticate, wrap(meets.create))
    .post('/:requestId/meetsByUser', authenticate, wrap(meets.createByUser))
)

app.use(
  '/api/maps',
  express.Router()
    .get('/:id/:width/:height', wrap(maps.show))
)

app.use(
  '/api/meets',
  authenticate,
  express.Router()
    .get('/:id', wrap(meets.show))
    .put('/:id', wrap(meets.update))
    .post('/:id/review', wrap(meets.review))
    .put('/:id/review', wrap(meets.updateReview))
    .post('/:id/accounting', wrap(meets.upsertAccounting))
    .get('/:id/invoice', wrap(meets.invoice))
    .post('/:id/accept', wrap(meets.acceptByPro))
    .post('/:id/decline', wrap(meets.declineByPro))
)

app.use(
  '/api/chats',
  express.Router()
    .post('/', authenticate, wrap(chats.create))
    .get('/file/getSignedUrl', authenticate, wrap(chats.signedUrl))
    .get('/:id/read.gif', wrap(chats.read))
    .delete('/:id', authenticate, wrap(chats.remove))
)

app.use(
  '/api/schedules',
  authenticate,
  express.Router()
    .get('/', wrap(schedules.indexForPro))
    .post('/', wrap(schedules.create))
    .post('/businessHour', wrap(schedules.updateBusinessHour))
    .post('/delete', wrap(schedules.remove))
    .get('/:id', wrap(schedules.show))
    .put('/:id', wrap(schedules.update))
)

app.use(
  '/api/formattedRequests',
  express.Router()
    .get('/:key/examples', wrap(formattedRequests.examples))
    .get('/', wrap(formattedRequests.index))
    .get('/:id', wrap(formattedRequests.show))
)

app.get('/api/keywords', wrap(keywords.index))

// apis for pro
app.use(
  '/api/pros',
  authenticate,
  express.Router()
    .get('/requests', wrap(requests.indexForPro))
    .get('/requests/:id', wrap(requests.showForPro))
    .get('/meets', wrap(meets.indexForPro))
    .get('/meets/:id', wrap(meets.showForPro))
    .get('/services', wrap(proServices.indexForPro))
    .get('/services/:serviceId', wrap(proServices.showForPro))
    .put('/services/all/:type', wrap(proServices.updateAllForPro))
    .put('/services/bulk', wrap(proServices.updateManyForPro))
    .put('/services/:serviceId', wrap(proServices.updateForPro))
)

// TODO: remove later
app.use('/api/wordpress/:id/:key', (req, res) => {
  return res.redirect(301, `/api/services/${req.params.key}/articles/${req.params.id}`)
})
app.use('/api/articles',
  express.Router()
    .get('/', wrap(articles.articleTop))
    .get('/pro', wrap(articles.proArticleTop))
    .get('/authors/:id', wrap(articles.articleAuthorPage))
    .get('/:id/:key', (req, res) => {
      return res.redirect(301, `/api/services/${req.params.key}/articles/${req.params.id}`)
    })
)

app.use(
  '/api/licences',
  express.Router()
    .get('/', wrap(licences.index))
    .delete('/image', authenticate, wrap(licences.removeImage))
    .get('/getSignedUrl', authenticate, wrap(licences.signedUrl))
    .get('/:id', wrap(licences.show))
)

app.use(
  '/api/profiles',
  express.Router()
    .get('/', authenticate, wrap(profiles.index))
    .post('/', authenticate, wrap(profiles.create))
    .put('/suspend', authenticate, wrap(profiles.suspend))
    .get('/pickup', wrap(profiles.pickup))
    .get('/near', wrap(profiles.near))
    .put('/resume/:id', authenticate, wrap(profiles.resume))
    .get('/:id', partialAuth, wrap(profiles.show))
    .put('/:id', authenticate, wrap(profiles.update))
    .delete('/:id', authenticate, wrap(profiles.deactivate))
    .get('/:id/page', wrap(profiles.profilePage))
    .post('/:id/review', wrap(profiles.review))
    .get('/:id/reviewTemplate', authenticate, wrap(profiles.reviewEmailTemplate))
    .post('/:id/email', authenticate, wrap(profiles.requestReview))
    .get('/:profileId/reviews', authenticate, wrap(profiles.showForReview))
    .get('/:id/insights', authenticate, wrap(profiles.showForInsight))
    .post('/:profileId/services/:serviceId', partialAuth, wrap(proServices.show))
)

app.use(
  '/api/reviews',
  authenticate,
  express.Router()
    .put('/:id', wrap(profiles.replyReview))
)

app.use(
  '/api/news',
  express.Router()
    .get('/', wrap(news.index))
    .get('/:id', wrap(news.show))
)

app.use(
  '/api/media',
  authenticate,
  express.Router()
    .get('/', wrap(media.index))
    .post('/', wrap(media.create))
    .put('/:id', wrap(media.update))
    .delete('/:id', wrap(media.remove))
)

app.use(
  '/api/medialists',
  express.Router()
    .get('/', wrap(media.indexMediaList))
    .post('/:id', authenticate, wrap(media.upsertMediaList))
)

app.use(
  '/widgets',
  express.Router()
    .get('/', wrap(widgets.index))
    .get('/script.js', wrap(widgets.script))
    .get('/media', wrap(widgets.media))
)

// XXX TODO: oauthはconnectで処理したい
app.use(
  '/api/googles',
  express.Router()
    .get('/scraping2Lead', wrap(googles.scraping2Lead))
    .get('/mongo2sheets', wrap(googles.mongo2sheets))
    .get('/sheets2mongo', wrap(googles.sheets2mongo))
    .get('/sheets2leadDescription', wrap(googles.sheets2leadDescription))
)

app.post('/api/lines/webhook', wrap(lines.webhook))
app.get('/api/lines/track', wrap(lines.track))

app.use('/api/faqs', wrap(faqs.index))

app.use(
  '/api/inboundLink',
  express.Router()
    .get('/show', wrap(inboundLink.show))
    .get('/click', wrap(inboundLink.click))
)

app.use(
  '/api/bq',
  express.Router()
    .post('/insert', partialAuth, wrap(bigquery.insert))
    .post('/amp/insert', wrap(bigquery.ampInsert))
)

app.use(
  '/api/questionnaires',
  authenticate,
  express.Router()
    .post('/', wrap(questionnaires.insert))
)

app.use(
  '/api/notices',
  authenticate,
  express.Router()
    .get('/', wrap(notices.index))
    .post('/read', wrap(notices.readAll))
    .post('/:id/read', wrap(notices.read))
)

app.use(
  '/api/meetTemplates',
  authenticate,
  express.Router()
    .get('/', wrap(meetTemplates.index))
    .put('/:id/increment', wrap(meetTemplates.increment))
)

app.use(
  '/api/jobs',
  (req, res, next) => {
    const token = 'jobToken'
    if (req.header('Authorization') !== `Bearer ${token}`) {
      return res.status(401).json(null)
    }
    next()
  },
  express.Router()
  .post('/checkMediaDeadImage', emptyResponse, wrap(jobs.checkMediaDeadImage))
  .post('/signedUpProFollowup', emptyResponse, wrap(jobs.signedUpProFollowup))
  .post('/sendRequestToLocalPro', emptyResponse, wrap(jobs.sendRequestToLocalPro))
  .post('/sendManyPass', emptyResponse, wrap(jobs.sendManyPass))
  .post('/sendNoMeet', emptyResponse, wrap(jobs.sendNoMeet))
  .post('/remindMeets', emptyResponse, wrap(jobs.remindMeets))
  .post('/remindMeetEnd', emptyResponse, wrap(jobs.remindMeetEnd))
  .post('/dailyRemind', emptyResponse, wrap(jobs.dailyRemind))
  .post('/bookingRemind', emptyResponse, wrap(jobs.bookingRemind))
  .post('/updateFinishedJobs', emptyResponse, wrap(jobs.updateFinishedJobs))
  .post('/remindProfile', emptyResponse, wrap(jobs.remindProfile))
  .post('/refundPoints', emptyResponse, wrap(jobs.refundPoints))
  .post('/retryPushMessage', emptyResponse, wrap(jobs.retryPushMessage))
  .post('/locationServiceDaemon', emptyResponse, wrap(jobs.locationServiceDaemon))
  .post('/locationServiceDaemonV2', wrap(jobs.locationServiceDaemonV2))
  .post('/proStats', emptyResponse, wrap(jobs.proStats))
  .post('/checkExpirePoints', emptyResponse, wrap(jobs.checkExpirePoints))
  .post('/checkNoticeExpire', emptyResponse, wrap(jobs.checkNoticeExpire))
  .post('/checkLeadEmail', emptyResponse, wrap(jobs.checkLeadEmail))
  .post('/searchConsoleCheck', emptyResponse, wrap(jobs.searchConsoleCheck))
  .post('/reportInsights', emptyResponse, wrap(jobs.reportInsights))
  .post('/meetEstimation', emptyResponse, wrap(jobs.setMeetEstimation))
  .post('/pointBack', emptyResponse, wrap(jobs.pointBack))
)


// apis for call center
app.use(
  '/api/callCenter',
  express.Router()
    .post('/assign', wrap(callCenter.assignHandler))
    .post('/tracking', wrap(callCenter.trackingHandler))
    .post('/twiml/call', wrap(callCenter.callTwimlHandler))
    .post('/twiml/transfer', wrap(callCenter.transferTwimlHandler))
    .post('/twiml/transferQueue', wrap(callCenter.transferQueueTwimlHandler))
    .post('/twiml/transferConference', wrap(callCenter.transferConferenceTwimlHandler))
)
app.use(
  '/api/callCenter',
  authenticate,
  checkAdmin,
  express.Router()
    .get('/token', wrap(callCenter.tokenGenerator))
    .post('/workers', wrap(callCenter.createWorker))
    .delete('/workers/:id', wrap(callCenter.removeWorker))
    .post('/hold', wrap(callCenter.holdHandler))
)

app.use(
  '/api/proQuestions',
  authenticate,
  express.Router()
    .get('/showForPro/:profileId', wrap(proQuestions.showForPro))
)

app.use(
  '/api/proAnswers',
  authenticate,
  express.Router()
    .put('/', wrap(proAnswers.update))
)

app.use(
  '/api/experiments',
  express.Router()
    .get('/active', wrap(experiments.getActiveExperimentsForUser))
)

app.use(
  '/api/runtimeConfigs',
  partialAuth,
  express.Router()
    .get('/active', wrap(runtimeConfigs.getActiveRuntimeConfigsForUser))
)

app.use(
  '/api/proLabels',
  express.Router()
    .get('/', wrap(proLabels.index))
)

// apis for admin
app.use(
  '/api/admin',
  authenticate,
  checkAdmin,
  express.Router()
    // services
    .get('/services', wrap(services.indexForAdmin))
    .post('/services', wrap(services.createForAdmin))
    .get('/services/:id', wrap(services.showForAdmin))
    .put('/services/delete/:id', wrap(services.remove))
    .put('/services/:id', wrap(services.update))
    .get('/services/pageInformation/getSignedUrl', wrap(services.pageInformationSignedUrl))
    .get('/services/:id/getSignedUrl', wrap(services.signedUrl))
    .get('/services/:id/relatedMedia', wrap(services.relatedMedia))
    .get('/services/:id/contentDraft', wrap(services.contentDraftLoad))
    .put('/services/:id/contentDraft', wrap(services.contentDraftSave))
    .get('/services/:id/meetEstimation', wrap(services.meetEstimation))
    .post('/services/:id/copyQuery', wrap(services.copyQuery))
    // categories
    .post('/categories', wrap(categories.createForAdmin))
    .put('/categories/:id', wrap(categories.updateForAdmin))
    .get('/categories/:id/relatedMedia', wrap(categories.relatedMedia))
    .get('/categories/pageInformation/getSignedUrl', wrap(categories.pageInformationSignedUrl))
    .get('/categories/:id/contentDraft', wrap(categories.contentDraftLoad))
    .put('/categories/:id/contentDraft', wrap(categories.contentDraftSave))
    // queries
    .get('/queries', wrap(queries.index))
    .post('/queries', wrap(queries.create))
    .get('/queries/tags', wrap(queries.getTags))
    .get('/queries/:id', wrap(queries.show))
    .put('/queries/:id', wrap(queries.update))
    .delete('/queries/:id', wrap(queries.remove))
    .get('/queries/:queryId/history', wrap(queries.showQueryHistory))
    .post('/queries/signedUrls', wrap(queries.signedUrls))
    // proQuestions
    .get('/proQuestions', wrap(proQuestions.indexForAdmin))
    .post('/proQuestions', wrap(proQuestions.createForAdmin))
    .get('/proQuestions/:id', wrap(proQuestions.showForAdmin))
    .put('/proQuestions/:id', wrap(proQuestions.updateForAdmin))
    .delete('/proQuestions/:id', wrap(proQuestions.removeForAdmin))
    // proAnswers
    .put('/proAnswers/:id', wrap(proAnswers.updateForAdmin))
    // users
    .get('/users', wrap(users.indexForAdmin))
    .post('/users', wrap(users.createForAdmin))
    .get('/users/search', wrap(users.searchForAdmin))
    .get('/users/:id', wrap(users.showForAdmin))
    .put('/users/:id', wrap(users.updateForAdmin))
    .get('/users/:id/getSignedUrl', wrap(users.signedUrlForAdmin))
    .get('/users/:id/points', wrap(points.showForAdmin))
    .post('/users/:id/points', wrap(points.addForAdmin))
    .post('/users/:id/refundStarterPoint', wrap(points.refundStarterPointForAdmin))
    .post('/users/:id/media', wrap(media.createForAdmin))
    .post('/users/stats', wrap(users.statsForAdmin))
    .delete('/users/:id', wrap(users.deactivateForAdmin))
    .get('/users/:userId/services/:serviceId', wrap(proServices.showForAdmin)) // proService
    .post('/users/:id/pushMessage', wrap(users.pushMessageForAdmin))
    .post('/users/:id/businessHour', wrap(schedules.updateBusinessHourForAdmin))
    // proServices
    .put('/proServices/:id', wrap(proServices.updateForAdmin))
    // media
    .put('/media/:id', wrap(media.updateForAdmin))
    // profiles
    .post('/profiles', wrap(profiles.indexForAdmin))
    .get('/profiles/location', wrap(profiles.locationIndexForAdmin))
    .post('/profiles/exportSendGrid', wrap(profiles.exportSendGrid))
    .get('/profiles/:id', wrap(profiles.showForAdmin))
    .get('/profiles/:id/receive', wrap(profiles.showReceiveForAdmin))
    .get('/profiles/:id/cstasks', wrap(cstasks.showByProfile))
    .put('/profiles/:id', wrap(profiles.updateForAdmin))
    .get('/profiles/:id/csEmailTemplates', wrap(profiles.listCsEmailTemplatesForAdmin))
    .post('/profiles/:id/email', wrap(profiles.sendEmailForAdmin))
    .delete('/profiles/:id', wrap(profiles.deactivateForAdmin))
    .put('/reviews/:id', wrap(profiles.updateReviewForAdmin))
    .delete('/reviews/:id', wrap(profiles.deleteReviewForAdmin))
    // searchConditions
    .get('/searchConditions', wrap(searchConditions.index))
    .post('/searchConditions', wrap(searchConditions.create))
    .delete('/searchConditions/:id', wrap(searchConditions.remove))
    // requests
    .post('/requests', wrap(requests.indexForAdmin))
    .get('/requests/:id', wrap(requests.showForAdmin))
    .put('/requests/:id', wrap(requests.updateForAdmin))
    .put('/requests/:id/resend', wrap(requests.resendForAdmin))
    .post('/requests/:id/match', wrap(requests.matchProForAdmin))
    .post('/requests/:id/exclude', wrap(requests.excludeProForAdmin))
    // formattedRequests
    .get('/formattedRequests', wrap(formattedRequests.indexForAdmin))
    .post('/formattedRequests/copy', wrap(formattedRequests.copyFromRequests))
    .get('/formattedRequests/:id', wrap(formattedRequests.showForAdmin))
    .put('/formattedRequests/:id', wrap(formattedRequests.updateForAdmin))
    .delete('/formattedRequests/:id', wrap(formattedRequests.removeForAdmin))
    .post('/formattedRequests/:id/copy', wrap(formattedRequests.copyForAdmin))
    // meets
    .get('/meets/:id', wrap(meets.showForAdmin))
    .put('/meets/:id', wrap(meets.updateForAdmin))
    .post('/meets/:id/release', wrap(meets.release))
    // locations
    .get('/locations', wrap(locations.index))
    .post('/locations', wrap(locations.create))
    .get('/locations/:id', wrap(locations.show))
    .put('/locations/:id', wrap(locations.update))
    .delete('/locations/:id', wrap(locations.remove))
    .get('/locations/getNearLocations/:id', wrap(locations.getNearLocations))
    // leads
    .post('/leads', wrap(leads.create))
    .get('/leads/info', wrap(leads.info))
    .get('/leads/garbled', wrap(leads.indexGarbledName))
    .get('/leads/duplicate/:type', wrap(leads.indexDuplicates))
    .get('/leads/:id', wrap(leads.show))
    .get('/leads', wrap(leads.index))
    .put('/leads', wrap(leads.update))
    .delete('/leads/:id', wrap(leads.remove))
    .post('/leads/send/:id', wrap(leads.send))
    .get('/leads/scraping/status', wrap(leads.scrapingStatus))
    .get('/leads/scraping/log', wrap(leads.indexScrapingLog))
    .get('/leads/scraping/townpage', wrap(leads.indexTownpageInfo))
    .post('/leads/scraping', wrap(leads.scrapingItownpage))
    .post('/leads/inquiry', wrap(leads.inquiry))
    .put('/leads/:id/formEmail', wrap(leads.formEmail))

    // keyword
    .get('/keywords', wrap(keywords.indexForAdmin))
    .post('/keywords', wrap(keywords.create))
    .delete('/keywords', wrap(keywords.remove))
    .put('/keywords/:id', wrap(keywords.update))
    // searchKeywords
    .get('/searchKeywords', wrap(searchKeywords.indexForAdmin))
    .get('/searchKeywords/:id', wrap(searchKeywords.showForAdmin))
    .post('/searchKeywords', wrap(searchKeywords.create))
    .delete('/searchKeywords/:id', wrap(searchKeywords.remove))
    .put('/searchKeywords/:id', wrap(searchKeywords.update))
    .get('/searchKeywordsDownload', wrap(searchKeywords.download))
    .post('/searchKeywordsUpload', wrap(searchKeywords.upload))
    .get('/searchKeywordsExport', wrap(searchKeywords.output))
    .get('/searchKeywordsRanking/:id', wrap(searchKeywords.ranking))
    .get('/searchKeywordsCategories', wrap(searchKeywords.categories))
    .get('/searchKeywordsCategoryVolume/:key', wrap(searchKeywords.categoryVolume))
    // memos
    .get('/memos', wrap(memos.indexForAdmin))
    .post('/memos', wrap(memos.createForAdmin))
    .delete('/memos/:id', wrap(memos.removeForAdmin))
    // maillogs
    .get('/mailLog/:id', wrap(maillogs.showMailLogForAdmin))
    .get('/maillogs', wrap(maillogs.indexForAdmin))
    .get('/maillogs/requests/:id', wrap(maillogs.indexByRequestForAdmin))
    .get('/maillogs/pros/:address', wrap(maillogs.indexByProForAdmin))
    // meetTemplates
    .get('/meetTemplate', wrap(meetTemplates.indexForAdmin))
    .get('/meetTemplate/:id', wrap(meetTemplates.showForAdmin))
    .post('/meetTemplate', wrap(meetTemplates.addForAdmin))
    .put('/meetTemplate/:id', wrap(meetTemplates.updateForAdmin))
    .delete('/meetTemplate/:id', wrap(meetTemplates.removeForAdmin))
    // feedbacks
    .get('/feedbacks', wrap(feedbacks.indexForAdmin))
    .post('/feedbacks', wrap(feedbacks.createForAdmin))
    .put('/feedbacks/:id', wrap(feedbacks.updateForAdmin))
    // blackLists
    .get('/blacklists', wrap(blackLists.index))
    .post('/blacklists', wrap(blackLists.create))
    .put('/blacklists/:id', wrap(blackLists.update))
    .delete('/blacklists/:id', wrap(blackLists.remove))
    // crawls
    .get('/crawls', wrap(crawls.index))
    .post('/crawls', wrap(crawls.create))
    .put('/crawls', wrap(crawls.updateMany))
    .post('/crawls/execute', wrap(crawls.execute))
    .put('/crawls/pause', wrap(crawls.pause))
    .put('/crawls/restart', wrap(crawls.restart))
    .get('/crawls/status', wrap(crawls.status))
    .put('/crawls/reset', wrap(crawls.reset))
    .post('/crawls/lead', wrap(crawls.saveAsLead))
    .get('/crawls/:id', wrap(crawls.show))
    .put('/crawls/:id', wrap(crawls.update))
    .delete('/crawls/:id', wrap(crawls.remove))
    // crawlTemplates
    .get('/crawlTemplates', wrap(crawlTemplates.index))
    .post('/crawlTemplates', wrap(crawlTemplates.create))
    .get('/crawlTemplates/:id', wrap(crawlTemplates.show))
    .put('/crawlTemplates/:id', wrap(crawlTemplates.update))
    .delete('/crawlTemplates/:id', wrap(crawlTemplates.remove))
    // experiments
    .get('/experiments', wrap(experiments.indexForAdmin))
    .get('/experiments/:id', wrap(experiments.showForAdmin))
    .post('/experiments', wrap(experiments.createForAdmin))
    .put('/experiments/:id', wrap(experiments.updateForAdmin))
    .delete('/experiments', wrap(experiments.removeForAdmin))
    // elasticsearch
    .get('/search/users', wrap(elasticsearch.users))
    .post('/search/rebuild', wrap(elasticsearch.rebuild))
    // pageLayouts
    .get('/pageLayouts/:id', wrap(pageLayouts.showForAdmin))
    .post('/pageLayouts', wrap(pageLayouts.createForAdmin))
    .put('/pageLayouts/:id', wrap(pageLayouts.updateForAdmin))
    .delete('/pageLayouts/:id', wrap(pageLayouts.removeForAdmin))
    // profileIntroductions
    .get('/profileIntroductions/getSignedUrl', wrap(profileIntroductions.signedUrlForAdmin))
    .get('/profileIntroductions/:profileId', wrap(profileIntroductions.showForAdmin))
    .post('/profileIntroductions', wrap(profileIntroductions.createForAdmin))
    .put('/profileIntroductions/:id', wrap(profileIntroductions.updateForAdmin))
    .delete('/profileIntroductions/:id', wrap(profileIntroductions.removeForAdmin))
    // aws
    .post('/aws/cacheInvalidation', wrap(aws.cacheInvalidation))
    // csEmailTemplates
    .post('/csEmailTemplates/cacheInvalidation/:id', wrap(csEmailTemplates.cacheInvalidation))
    // licences
    .post('/licences', wrap(licences.createForAdmin))
    .put('/licences/:id', wrap(licences.updateForAdmin))
    // cstasks
    .get('/cstasks', wrap(cstasks.index))
    .post('/cstasks', wrap(cstasks.create))
    .put('/cstasks/:id', wrap(cstasks.update))
    .put('/cstasks/:id/assign', wrap(cstasks.assign))
    .put('/cstasks/:id/cancelAssign', wrap(cstasks.cancelAssign))
    // runtimeConfigs
    .get('/runtimeConfigs', wrap(runtimeConfigs.indexForAdmin))
    .get('/runtimeConfigs/:id', wrap(runtimeConfigs.showForAdmin))
    .post('/runtimeConfigs', wrap(runtimeConfigs.createForAdmin))
    .put('/runtimeConfigs/:id', wrap(runtimeConfigs.updateForAdmin))
    .delete('/runtimeConfigs', wrap(runtimeConfigs.removeForAdmin))
    // proLabels
    .get('/proLabels', wrap(proLabels.indexForAdmin))
    .get('/proLabels/:id', wrap(proLabels.showForAdmin))
    .post('/proLabels', wrap(proLabels.create))
    .put('/proLabels/:id', wrap(proLabels.update))
    .delete('/proLabels/:id', wrap(proLabels.remove))
    // csLogs
    .get('/csLogs', wrap(csLogs.index))
    .post('/csLogs', wrap(csLogs.create))
    .delete('/csLogs/:id', wrap(csLogs.remove))
)

app.use(
  '/api/search',
  express.Router()
    .get('/services', wrap(elasticsearch.services))
)


// クロール用 (非公開)
app.get('/api/crawls/inject', wrap(crawls.inject))

app.use('/api/*', (req, res) => {
  res.status(404).json({message: 'not found'})
})
app.use('/js/*', (req, res) => {
  res.status(404).json({message: 'not found'})
})
app.get('/-/:shortId', wrap(meets.redirectShortURL))

// あとで消す
app.get('/services/prices', (req, res) => res.redirect(301, '/prices'))

// media preview cache
app.post('/media/cacheInvalidation/:id', wrap(articles.clearArticleCache))

// server side rendering
app.get('/media/previews/:id', wrap(top.previewArticlePage))
app.get('/prices/:key', wrap(top.servicePricePage))
app.get('/services', wrap(top.serviceListPage))
app.get('/services/:key', wrap(top.servicePage))
app.get('/services/:key/media/:id', wrap(top.serviceArticlePage))
app.get('/services/:key/pickups/:id', wrap(top.serviceArticlePage))
app.get('/services/:key/:pref', wrap(top.servicePage))
app.get('/services/:key/:pref/:city', wrap(top.servicePage))
app.get('/services/:key/:pref/:city/:town', wrap(top.servicePage))
app.get('/amp/services/:key', wrap(top.servicePage))
app.get('/amp/services/:key/media/:id', wrap(top.serviceArticlePage))
app.get('/amp/services/:key/pickups/:id', wrap(top.serviceArticlePage))
app.get('/amp/services/:key/:pref', wrap(top.servicePage))
app.get('/amp/services/:key/:pref/:city', wrap(top.servicePage))
app.get('/amp/services/:key/:pref/:city/:town', wrap(top.servicePage))
app.get('/t/:key', wrap(top.categoryPage))
app.get('/t/:key/media/:id', wrap(top.categoryArticlePage))
app.get('/t/:key/pickups/:id', wrap(top.categoryArticlePage))
app.get('/t/:key/:pref', wrap(top.categoryPage))
app.get('/t/:key/:pref/:city', wrap(top.categoryPage))
app.get('/t/:key/:pref/:city/:town', wrap(top.categoryPage))
app.get('/amp/t/:key', wrap(top.categoryPage))
app.get('/amp/t/:key/media/:id', wrap(top.categoryArticlePage))
app.get('/amp/t/:key/pickups/:id', wrap(top.categoryArticlePage))
app.get('/amp/t/:key/:pref', wrap(top.categoryPage))
app.get('/amp/t/:key/:pref/:city', wrap(top.categoryPage))
app.get('/amp/t/:key/:pref/:city/:town', wrap(top.categoryPage))
app.get('/p/:id*', wrap(top.profilePage))
app.get('/amp/p/:id*', wrap(top.profilePage))
app.get('/pro/:category', wrap(top.proCategoryPage))
app.get('/pro/:category/media/:id', wrap(top.proArticlePage))
app.get('/amp/pro/:category', wrap(top.proCategoryPage))
app.get('/sections/:key', wrap(top.sectionsPage))
// app.get('/amp/pro/:category/media/:id', wrap(top.proArticlePage))

app.get('/__debug', wrap(top.debugPage))
app.get('/', wrap(top.topPage))
app.get('*', wrap(top.index))

module.exports = app
