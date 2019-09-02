export {}
const { ObjectID } = require('mongodb')
const config = require('config')
const { Service, LocationService, Location, User, Profile, FormattedRequest, Category, CategoryArea, Lead, Media, Review } = require('../models')
const { shuffle } = require('../lib/util')
const { S3 } = require('../lib/aws')
const redis = require('../lib/redis')
const redisPrefix = 'cpcontent-'
const DRAFT_MAX = 4

const { fetchRecommendArticleList } = require('./articles')

module.exports = {
  index,
  show,
  proCategoryPage,
  oldServiceTagPage,
  categoryPage,
  showForInsight,
  // admin
  createForAdmin,
  updateForAdmin,
  pageInformationSignedUrl,
  relatedMedia,
  contentDraftLoad,
  contentDraftSave,
}

async function index(req, res) {
  const categories = await Category.find().select('key name parent priority')
  res.json(categories)
}

async function show(req, res) {
  const category = await Category.findOne({key: req.params.category})
  if (!category) return res.status(404).json({message: 'not found'})
  res.json(category)
}

async function oldServiceTagPage(req, res) {
  const category = await Category.findOne({name: req.params.category}).select('key')
  if (category) {
    return res.redirect(301, `/api/categories/${category.key}/categoryPage`)
  }

  return res.status(404).json({message: 'not found'})
}

async function categoryPage(req, res) {
  const { pref, city, town } = req.query

  // pageInformationはトップのみ
  const select = pref ? '-pageInformation' : ''

  let category = await Category.findOne({key: req.params.category}).select(select)
  if (!category) return res.status(404).json({message: 'not found'})

  // 存在しない地域
  if (pref) {
    const keyPath = []
    keyPath.push(pref)
    if (city) keyPath.push(city)
    if (town) keyPath.push(town)
    const location = await Location.countDocuments({keyPath: keyPath.join(',')})
    if (location === 0) {
      return res.status(410).json({message: 'gone', statusCode: 410})
    }
  }

  category = category.toObject()
  for (const info of category.pageInformation || []) {
    if (!info.user) continue
    info.user = await User.findById(info.user).select('lastname firstname deactivate').lean()
    if (info.user.deactivate) {
      info.user = null
      info.image = null
    }
  }

  const services = await Service.find({
    tags: category.name,
    enabled: true,
    deleted: {$ne: true},
  }).select('key name providerName imageUpdatedAt matchMoreEnabled').sort({priority: -1})
  if (services.length === 0) return res.status(404).json({message: 'not found'})

  const serviceIds = services.map(s => s.id)

  const keyPath = (town ? [pref, city, town] : city ? [pref, city] : pref ? [pref] : []).join(',')
  const parentKeyPath = (town ? [pref, city] : city ? [pref] : []).join(',')
  const locationServiceQuery =
    pref ? LocationService.find({keyPath, service: {$in: serviceIds}}) : // pref, city, town
    Promise.resolve([]) // 全国

  const selector = 'isGroup name key'

  let count = {count: {$gt: 0}}
  // 主要カテゴリ以外のプロが１人しかいない地域SP、地域CPのリンクをなくす
  if (!config.showLocationLPs.includes(category.key)) {
    count = {count: {$gt: 1}}
  }

  const brothersQuery =
    city ? LocationService.find({keyPath: new RegExp(`^${parentKeyPath},[^,]+$`), service: {$in: serviceIds}, ...count}).select(selector).sort('-count') : // city, town
    pref ? LocationService.find({parentKey: 'japan', service: {$in: serviceIds}, ...count}).select(selector).sort('-count') : // pref
    Promise.resolve([]) // 全国

  const childrenQuery =
    town ? Promise.resolve([]) : // town
    pref ? LocationService.find({keyPath: new RegExp(`^${keyPath},[^,]+$`), service: {$in: serviceIds}, ...count}).select(selector).sort('-count') : // pref, city
    LocationService.find({parentKey: 'japan', service: {$in: serviceIds}, ...count}).select(selector).sort('-count') // 全国

  const locationQuery =
    pref ? Location.findOne({keyPath, isPublished: true}) : // pref, city, town
    Promise.resolve() // 全国

  const areaDescQuery =
    pref ? CategoryArea.findOne({key: pref, category: category.id}) : // pref, city, town
    Promise.resolve() // 全国

  const prefLocationServicesQuery = pref ? LocationService.find({keyPath: new RegExp(`^${pref}$`), service: {$in: serviceIds}}).populate({path: 'service', select: 'key name providerName imageUpdatedAt matchMoreEnabled'}) : // pref, city, town
    Promise.resolve([]) // 全国

  const [locationServices, brothers, children, location, areaDesc, prefLocationServices] = await Promise.all([locationServiceQuery, brothersQuery, childrenQuery, locationQuery, areaDescQuery, prefLocationServicesQuery])
  if (pref && locationServices.length === 0) return res.status(404).json({message: 'not found'})

  const cond: any = pref ? {_id: {$in: [].concat(...locationServices.map(a => a.profiles))}} : {services: {$in: serviceIds}}
  cond.description = {$exists: true}
  cond.deactivate = {$exists: false}
  cond.suspend = {$exists: false}
  cond.hideProfile = {$ne: true}

  let locationService = locationServices[0]


  if (location && location.code) {
    locationService = locationService.toObject()
    locationService.code = location.code
  }

  if (areaDesc) {
    category.description = areaDesc.description ? areaDesc.description : category.description
    category.pageDescription = areaDesc.pageDescription ? areaDesc.pageDescription : category.pageDescription
  }

  const [categories, profiles, requests, reviews] = await Promise.all([
    Service.find({enabled: true, deleted: {$ne: true}}).select('tags')
      .then(async services => {
        const categories = await Category.find({name: {$in: services.map(s => s.tags[0])}})
          .select('key name priority')
          .sort('-priority')
        return categories
      }),
    Profile
      .find(cond)
      .select('name address description averageRating reviewCount services')
      .sort({score: -1})
      .limit(24)
      .populate({
        path: 'pro',
        select: 'imageUpdatedAt identification deactivate',
      }).populate({
        path: 'reviews',
        options: {
          sort: {createdAt: 1},
        },
      }),
    FormattedRequest
      .find({
        service: { $in: serviceIds },
        public: true,
        prefecture: city ? locationServices[0].parentName : pref ? locationServices[0].name : { $exists: true },
        'meets.2': { $exists: true }, // meets.length >= 3
      }).populate({
        path: 'service',
        select: 'name providerName',
      }),
    Review.aggregate([
      { $match: { service: {$in: services.map(s => s._id)} } },
      { $group: { _id: null, count: {$sum: 1}, avg: {$avg: '$rating'} } },
    ]),
  ])

  let leads = []
  if (profiles.length < 15) {
    const leadIds = [].concat(...locationServices.map(loc => loc.leads))
    leads = await Lead.find({_id: {$in: leadIds}, registered: {$ne: true}})
      .select('name address description')
      .limit(15 - profiles.length)
      .lean({virtuals: true})
    // 住所をページにあわせる
    leads = leads.map(l => ({...l, address: location.path.split(',').join('')}))
  }

  const { articles: recommendArticles } = await fetchRecommendArticleList({category: category.wpId, pref: pref || 'all', per_page: 6})

  res.json({
    category,
    services,
    locationService,
    brothers,
    children,
    leads,
    profiles,
    request: requests.length ? shuffle(requests)[0] : null,
    categories,
    reviewInfo: reviews[0],
    recommendArticles,
    prefLocationServices,
  })
}

async function proCategoryPage(req, res) {
  const category = await Category.findOne({key: req.params.category}).select('key name')
  if (!category) return res.status(404).json({message: 'not found'})
  const services = await Service.find({
    tags: category.name,
    deleted: {$ne: true},
  }).sort({priority: -1})
  if (services.length === 0) return res.status(404).json({message: 'not found'})

  const requests = await FormattedRequest.find({
    service: { $in: services.map(s => s.id) },
    public: true,
    'meets.2': { $exists: true }, // meets.length >= 3
  }).populate({
    path: 'service',
    select: 'name',
  })

  let request
  if (requests.length) {
    request = shuffle(requests)[0]
  }

  res.json({
    category,
    services,
    request,
  })
}

async function createForAdmin(req, res) {
  const exist = await Category.countDocuments({$or: [{key: req.body.key}, {name: req.body.name}]})
  if (exist) return res.status(400).json({ message: 'already exist' })

  const $set = {
    key: req.body.key,
    name: req.body.name,
    pageTitle: req.body.pageTitle,
    pageMetaDescription: req.body.pageMetaDescription,
    description: req.body.description,
    pageDescription: req.body.pageDescription,
    priority: req.body.priority,
    parent: req.body.parent,
    pageInformation: req.body.pageInformation,
  }
  const c = await Category.create($set)
  res.send(c)
}

async function updateForAdmin(req, res) {
  const $set: any = {}
  if (req.body.pageInformation) $set.pageInformation = req.body.pageInformation
  if (req.body.description) $set.description = req.body.description
  if (req.body.priority) $set.priority = req.body.priority
  if (req.body.pageDescription) $set.pageDescription = req.body.pageDescription
  if (req.body.mediaListPageDescription) $set.mediaListPageDescription = req.body.mediaListPageDescription
  if (req.body.name) $set.name = req.body.name
  if (req.body.providerName) $set.providerName = req.body.providerName
  if (req.body.parent) $set.parent = req.body.parent
  await Category.findByIdAndUpdate(
    req.params.id,
    {$set},
    { runValidators: true }
  )
  res.send()
}

async function pageInformationSignedUrl(req, res) {
  const id = new ObjectID()
  const key = `categoryinformation/${id}.${req.query.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
  const url = `${config.get('bucketOrigin')}/${key}?`
  res.json({signedUrl, url, id})
}

async function relatedMedia(req, res) {
  const id = req.params.id

  const category = await Category.findById(id).select('name').lean()
  if (category === null) return res.json([])

  const profiles = await Profile.find({
    category: category.name,
    suspend: {$exists: false},
    deactivate: {$ne: true},
  }).select('pro')

  const ids = profiles.map(p => p.pro)
  const media = await Media.find({user: {$in: ids}}).limit(500)

  res.json(media)
}

async function contentDraftLoad(req, res) {
  const drafts = await redis.lrangeAsync(redisPrefix + req.params.id, 0, DRAFT_MAX)
  if (drafts === null) return res.status(404).json({message: 'not found'})

  res.json(drafts.map(d => JSON.parse(d)))
}

async function contentDraftSave(req, res) {
  const category = await Category.findOne({_id: req.params.id})
  if (category === null) return res.status(404).json({message: 'not found'})

  const len = await redis.llenAsync(redisPrefix + category.id)
  // 古い順に消す
  if (len > DRAFT_MAX) {
    await redis.rpopAsync(redisPrefix + category.id)
  }
  req.body.user = req.user.lastname + req.user.firstname || ''
  req.body.date = new Date()
  await redis.lpushAsync(redisPrefix + category.id, JSON.stringify(req.body))

  res.json(category)
}

const INSIGHT_DATA = {
  all: {
    reviewCount: 4.2,
    averageRating: 4.89,
    proAnswerCount: 2.4,
    averageTimeToMeet: 173,
  },
  photographers: {
    reviewCount: 5.4,
    averageRating: 4.88,
    proAnswerCount: 3.6,
    averageTimeToMeet: 152,
  },
  cleaning: {
    reviewCount: 3.0,
    averageRating: 4.61,
    proAnswerCount: 3.4,
    averageTimeToMeet: 182,
  },
  remodel: {
    reviewCount: 3.2,
    averageRating: 4.94,
    proAnswerCount: 2.5,
    averageTimeToMeet: 212,
  },
  utilityman: {
    reviewCount: 2.0,
    averageRating: 4.97,
    proAnswerCount: 0.3,
    averageTimeToMeet: 114,
  },
  'video-production': {
    reviewCount: 4.6,
    averageRating: 4.95,
    proAnswerCount: 0.92,
    averageTimeToMeet: 155,
  },
  'tax-accountant': {
    reviewCount: 2.9,
    averageRating: 5.0,
    proAnswerCount: 3.2,
    averageTimeToMeet: 427,
  },
  'administrative-scrivener': {
    reviewCount: 3.0,
    averageRating: 5.0,
    proAnswerCount: 0.9,
    averageTimeToMeet: 99,
  },
  'car-maintenance': {
    reviewCount: 3.9,
    averageRating: 4.9,
    proAnswerCount: 0.2,
    averageTimeToMeet: 212,
  },
}

async function showForInsight(req, res) {
  const categoryName = req.params.name
  const category = await Category.findOne({name: categoryName}).select('key')
  if (category === null) {
    return res.status(404).json({message: 'not found'})
  }

  return res.json(INSIGHT_DATA[category.key] || INSIGHT_DATA.all)
}
