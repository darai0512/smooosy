export {}
const { Category, Experiment, Service } = require('../models')
const { BigQueryInsert } = require('./bigquery')

const { webOrigin, wpOrigin } = require('@smooosy/config')
const { indexMediaList } = require('./media')
const profiles = require('./profiles')
import services from './services'
const categories = require('./categories')
const articles = require('./articles')

interface Global {
  window: any,
  document: any,
  navigator: any,
  localStorage: any,
}
declare let global: Global

// WORKAROUND: いくつかのクライアント系ライブラリがnodeにないwindow, documentなどを必要とする
/* eslint-disable */
if (typeof window === 'undefined') {
  global.window = {
    location: {
      origin: webOrigin,
      search: '',
    },
    navigator: {
      userAgent: '',
    },
    addEventListener: () => {},
  }
  global.document = {
    addEventListener: () => {},
  }
  global.navigator = {
    userAgent: '',
  }
  global.localStorage = {}
}
/* eslint-enable */

// after initializing localStorage
const { renderApp } = require('../ssr/renderApp')

module.exports = {
  index,
  topPage,
  serviceListPage,
  servicePricePage,
  servicePage,
  servicePageV2,
  profilePage,
  serviceArticlePage,
  categoryArticlePage,
  proArticlePage,
  categoryPage,
  proCategoryPage,
  previewArticlePage,
  debugPage,
  sectionsPage,
}

async function index(req, res) {
  let allServices = []
  await services.index(req, {status: res.status, json: (result) => allServices = result})
  const initialData = {
    service: { allServices },
  }

  renderApp(req, res, initialData)
}

async function topPage(req, res) {

  let allServices = []
  await services.index(req, {status: res.status, json: (result) => allServices = result})

  const initialData = {
    notice: {
      notices: [],
    },
    service: {
      services: allServices,
    },
    auth: {
      authFailed: false,
    },
  }
  renderApp(req, res, initialData)
}

async function servicePricePage(req, res) {
  const { key } = req.params
  if (!key) {
    await index(req, res)
    return
  }

  let sppInfo: any = {}
  await services.servicePricePage(req, {status: res.status, json: (json) => sppInfo = json})

  // redirect when empty response
  if (!sppInfo.service || sppInfo.service.deleted) {
    return res.status(410).json({message: 'gone'})
  }
  if (!sppInfo.wpInfo) {
    return res.status(404).json({message: 'not found'})
  }

  const initialData = {
    service: {
      sppInfo,
    },
  }

  renderApp(req, res, initialData)
}

async function serviceListPage(req, res) {
  let allServices = []
  let categoriesData = []

  await Promise.all([
    services.index(req, {status: res.status, json: (json) => allServices = json}),
    categories.index(req, {status: res.status, json: (json) => categoriesData = json}),
  ])

  const initialData = {
    category: {
      categories: categoriesData,
    },
    service: {
      allServices: allServices,
    },
  }

  renderApp(req, res, initialData)
}

async function servicePage(req, res) {
  const service = await Service.findOne({key: req.params.key})
    .select('matchMoreEnabled')
    .lean()

  if (!service) return res.status(404).json({message: 'not found'})

  if (service.matchMoreEnabled && req.params.pref) {
    return servicePageV2(req, res)
  }

  // SP以外を除外する
  const { key, pref, city, town } = req.params
  if (key === 'prices' || ['path', 'requests', 'media'].indexOf(pref) !== -1) {
    await index(req, res)
    return
  }

  let onlySSR = !req.query || Object.keys(req.query).length === 0

  let spInfo: any = {}
  req.query = {
    pref,
    city,
    town,
  }

  await services.servicePage(req, {status: res.status, json: (json) => spInfo = json})

  // redirect when empty response
  const isAmp = req.originalUrl.match(/\/amp\//)

  if (spInfo.statusCode === 410) {
    return res.status(410).json({message: 'gone'})
  } else if (!spInfo.service) {
    return res.status(404).json({message: 'not found'})
  } else if (spInfo.service.deleted) {
    return res.status(410).json({message: 'gone'})
  }

  // Experimental: disable amp for car serices
  const isNoAmpService = req.originalUrl.match(/\/services\/car-/)
  // MatchMore service page has no AMP page version
  const hasAmp = !spInfo.service.matchMoreEnabled && !isNoAmpService
  onlySSR = onlySSR && !spInfo.service.matchMoreEnabled

  if (isAmp && !hasAmp) {
    // for MatchMore-enabled services, don't use AMP pages
    return res.redirect(301, req.originalUrl.replace('/amp', ''))
  }

  if (isAmp) spInfo.media = []

  const initialData = {
    service: {
      service: spInfo.service,
      spService: spInfo.service,
      spInfo,
    },
  }
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData, hasAmp, onlySSR)
}

async function servicePageV2(req, res) {
  const { pref, city, town } = req.params

  let info: any = {}
  req.query = {
    pref,
    city,
    town,
  }

  await services.servicePageV2(req, {status: res.status, json: (json) => info = json})

  if (info.statusCode === 410) {
    return res.status(410).json({message: 'gone'})
  } else if (!info.service) {
    return res.status(404).json({message: 'not found'})
  } else if (info.service.deleted) {
    return res.status(410).json({message: 'gone'})
  }

  const isAmp = req.originalUrl.match(/\/amp\//)
  if (isAmp) return res.redirect(301, req.originalUrl.replace('/amp', ''))

  const initialData = {
    service: {
      service: info.service,
      spService: info.service,
      servicePageV2: info,
    },
  }

  renderApp(req, res, initialData, false, false)
}

async function profilePage(req, res) {
  const isAMP = req.originalUrl.match(/\/amp\//)
  if (isAMP) {
    const redirectUrl = req.originalUrl.replace(/\/amp\//, '\/')
    return res.redirect(301, redirectUrl)
  }

  let initialData = {
    profile: { profile: null },
    media: { mediaLists: null},
  }

  const profileId = req.params.id
  if (!profileId) {
    return res.json(400)
  }
  req.params.id = profileId.split(/[^0-9A-Za-z\-_]/)[0]

  let profile = null
  await profiles.profilePage(req, {status: res.status, json: (json) => profile = json})
  if (!profile.id) return res.status(404).json({message: 'not found'})

  let mediaLists = null
  req.query.profile = profile.id
  await indexMediaList(req, {status: res.status, json: (json) => mediaLists = json})
  if (!Array.isArray(mediaLists)) {
    // データが壊れている場合
    console.error('プロフィールのサービス別メディアデータが壊れています、プロフィールID:', profile.id)
    mediaLists = []
  }

  initialData = {
    profile: { profile },
    media: { mediaLists },
  }
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData)

  if (/badge/.test(req.query.from)) {
    BigQueryInsert(req, {
      event_type: req.query.from === 'badge' ? 'inbound_link' : 'inbound_link_review',
      event: JSON.stringify({
        action: 'click',
        projectId: profile.id,
      }),
    })
  }
}

async function serviceArticlePage(req, res) {
  let initialData = {}
  const onlySSR = !req.query || Object.keys(req.query).length === 0

  const mediaId = req.params.id
  if (!mediaId) {
    return res.json(400)
  }

  let wpInfo = null
  await articles.serviceArticlePage(req, {status: res.status, send: (data) => wpInfo = data})

  const base = req.originalUrl.match(/\/amp\//) ? '/amp' : ''
  if (wpInfo.redirect) {
    return res.redirect(301, base + wpInfo.redirect)
  }
  if (!wpInfo.service) {
    return res.status(404).json({message: 'not found'})
  }

  initialData = {
    article: { wpInfo },
  }
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData, true, onlySSR)
}

async function categoryArticlePage(req, res) {
  let initialData = {}
  const onlySSR = !req.query || Object.keys(req.query).length === 0

  const mediaId = req.params.id
  if (!mediaId) {
    return res.json(400)
  }

  let wpInfo = null
  await articles.categoryArticlePage(req, {status: res.status, send: (data) => wpInfo = data})

  const base = req.originalUrl.match(/\/amp\//) ? '/amp' : ''
  if (wpInfo.redirect) {
    return res.redirect(301, base + wpInfo.redirect)
  }
  if (!wpInfo.category) {
    return res.status(404).json({message: 'not found'})
  }

  initialData = {
    article: { wpInfo },
  }
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData, true, onlySSR)
}

async function proArticlePage(req, res) {
  let initialData = {}

  const mediaId = req.params.id
  if (!mediaId) {
    return res.json(400)
  }

  let wpInfo = null
  req.params.key = req.params.category
  await articles.proArticlePage(req, {status: res.status, send: (data) => wpInfo = data})

  const base = req.originalUrl.match(/\/amp\//) ? '/amp' : ''
  if (wpInfo.redirect) {
    return res.redirect(301, base + wpInfo.redirect)
  }
  if (!wpInfo.category) {
    return res.status(404).json({message: 'not found'})
  }

  initialData = {
    article: { wpInfo },
  }
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData)
}

async function categoryPage(req, res) {
  let initialData: any = {}
  const { key, pref, city, town } = req.params

  const onlySSR = !req.query || Object.keys(req.query).length === 0
  if (pref === 'media') {
    await index(req, res)
    return
  }

  req.query = { key, pref, city, town }
  req.params.category = key
  await categories.categoryPage(req, {status: res.status, json: (json) => initialData = json})

  if (initialData.statusCode === 410) {
    return res.status(410).json({message: 'gone'})
  } else if (!initialData.services) {
    return res.status(404).json({message: 'not found'})
  }

  initialData = {
    category: {
      cpInfo: {
        ...initialData,
      },
    },
  }
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData, true, onlySSR)
}


async function proCategoryPage(req, res) {
  const initialData: any = {}
  const category = await Category.findOne({
    $or: [
      {key: req.params.category},
      {name: req.params.category},
    ],
  }).select('key name')

  if (!category) {
    return res.status(404).json({message: 'not found'})
  }

  initialData.service = {}
  await services.index(req, {status: res.status, json: (json) => initialData.service.services = json})

  initialData.profile = {}
  req.query.category = req.params.category
  await profiles.pickup(req, {status: res.status, json: (json) => initialData.profile.pickup = json})
  delete req.query.category

  initialData.category = {}
  req.params.category = category.key
  await categories.proCategoryPage(req, {status: res.status, json: (json) => {
    initialData.category.category = json.category
    initialData.category.services = json.services
    initialData.category.request = json.request
  }})
  delete req.params.tag
  req.experiments = await getAMPExperiments(req)

  renderApp(req, res, initialData, true)
}

async function previewArticlePage(req, res) {
  let initialData = {}

  const mediaId = req.params.id
  if (!mediaId) {
    return res.json(400)
  }

  let wpInfo = null
  await articles.previewArticlePage(req, {status: res.status, send: (data) => wpInfo = data})

  const base = req.originalUrl.match(/\/amp\//) ? '/amp' : ''
  if (wpInfo.redirect) {
    return res.redirect(301, base + wpInfo.redirect)
  }
  if (!wpInfo.articleId) {
    return res.redirect(301, `${wpOrigin}/wp-login.php?redirect_to=${encodeURIComponent(`${webOrigin}${req.originalUrl}`)}`)
  }

  initialData = {
    article: { wpInfo },
  }

  renderApp(req, res, initialData)
}

async function debugPage(req, res) {
  renderApp(req, res, {})
}

async function getAMPExperiments(req) {
  const isAMP = req.originalUrl.match(/\/amp\//)
  if (isAMP) {
    let exps =  await Experiment.find({
      isActive: true,
      startAt: { $lte: new Date() },
      endAt: { $gte: new Date() },
    })
    .select('name buckets')
    const experiments = {}
    exps = exps.filter(exp => !exp.buckets.find(bucket => bucket.end - bucket.start === 0))
    for (const exp of exps) {
      const variants = {}
      for (const bucket of exp.buckets) {
        variants[bucket.name] = bucket.end - bucket.start
      }
      // variants変数名は変えてはいけない
      // https://developers.google.com/optimize/devguides/amp-experiments?hl=ja
      experiments[exp.name] = { variants }
    }
    return experiments
  }
  return {}
}

async function sectionsPage(req, res) {
  let allServices = []
  let categoriesData = []

  await Promise.all([
    services.index(req, {status: res.status, json: (json) => allServices = json}),
    categories.index(req, {status: res.status, json: (json) => categoriesData = json}),
  ])

  const initialData = {
    category: {
      categories: categoriesData,
    },
    service: {
      allServices: allServices,
    },
  }

  renderApp(req, res, initialData)
}
