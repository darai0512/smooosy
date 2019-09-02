import { ObjectId } from 'mongodb'
const config = require('config')
import { Crawl, Service, ServiceArea, User, Profile, ProfileIntroduction, Request, Meet, MeetTemplate, Location, ProService, Media, LocationService, Lead, FormattedRequest, Review, Category, ProAnswer, Keyword, QueryCopyHistory, RuntimeConfig, SeoSetting } from '../models'
const { generateJobRequirements, appendInfoToProService } = require('./proServices')
const { mongoIdToShortId } = require('../lib/mongoid')
const { S3 } = require('../lib/aws')
const { shuffle } = require('../lib/util')
const { getPriceEstimate } = require('../lib/pricing/estimates/queries')
const redis = require('../lib/redis')
const seo = require('../lib/seo')
const { getMeetEstimation } = require('../lib/estimate')
const copyDevQueryToProd = require('../lib/copyDevQueryToProd')
const { BigQueryInsert } = require('../routes/bigquery')
const { BQEventTypes } = require('@smooosy/config')

import { routes as Interfaces } from '../interfaces'
import { INCLUDE_ADMIN_FIELDS as QUERY_INCLUDE_ADMIN_FIELDS } from '../lib/queries'

const redisPrefix = 'spcontent-'
const DRAFT_MAX = 4

export const BASE_FIELDS = [ 'key', 'name', 'tags', 'priority', 'enabled', 'imageUpdatedAt', 'providerName', 'matchMoreEnabled' ]
const SHOW_FIELDS = [ 'queries', 'similarServices', 'interview', 'instantResultAnnotation' ]
const SP_FIELDS = [ 'description', 'pageTitle', 'pageDescription', 'pageMetaDescription', 'priceComment', 'pickupMedia', 'wpId', 'proQuestions', 'spContentTopFlag', 'deleted' ] // TODO: spContentTopFlagは移行後消す

export default {
  index,
  show,
  servicePricePage,
  servicePage,
  averagePrice,
  servicePageV2,
  // admin
  indexForAdmin,
  showForAdmin,
  createForAdmin,
  meetEstimation,
  update,
  remove,
  signedUrl,
  pageInformationSignedUrl,
  relatedMedia,
  contentDraftLoad,
  contentDraftSave,
  priceEstimateFromQuestions,
  copyQuery,
  // function
  getServiceCategory,
  getLocationService,
  getLocationServiceProfiles,
  getProfileMediaRequestReview,
  getTrends,
  getAveragePoint,
  // const
  BASE_FIELDS,
}

const { fetchArticleData, fetchRecommendArticleList } = require('./articles')


// クエリパラメータ有無にかかわらずキャッシュされるので注意
export async function index(req, res) {
  const services = await Service
    .find({deleted: {$ne: true}})
    .select(BASE_FIELDS.join(' '))
    .sort({requestCount: -1})
    .lean({virtuals: ['id', 'image']})
  res.json(services)
}

export async function show(req, res) {
  const cond = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    ? {_id: req.params.id}
    : {key: req.params.id}
  const service = await Service
    .findOne(cond)
    .select([...BASE_FIELDS, ...SHOW_FIELDS].join(' '))
    .populate('queries')
    .populate({
      path: 'similarServices',
      select: 'key name imageUpdatedAt',
      match: {
        enabled: true,
      },
    })
  if (service === null) return res.status(404).json({message: 'not found'})

  res.json(service)
}

export async function servicePricePage(req, res) {
  const service = await Service.findOne({key: req.params.key})
    .select('key name imageUpdatedAt providerName queries priceEstimateQueries priceArticleId tags matchMoreEnabled')
    .populate({path: 'category', select: 'key name'})
    .populate({path: 'queries'})
  if (!service || service.deleted) return res.status(404).json({message: 'not found'})

  const priceEstimate = await getPriceEstimate({service: service._id})

  if (!service.priceArticleId) return res.status(404).json({service, message: 'not found'})

  const wpInfo = await fetchArticleData({id: service.priceArticleId, target: service.id, reference: 'Service', isFixed: true})
  if (!wpInfo) return res.status(404).json({service, message: 'not found'})

  const relatedServices = await Service.find({ tags: service.tags[0], enabled: true }).select('id key name')

  return res.json({
    service: JSON.parse(JSON.stringify(service)),
    priceEstimate,
    wpInfo,
    relatedServices,
  })
}

export async function getServiceCategory({key, pref, city}) {
  const spFields = SP_FIELDS.slice() // copy
  // pageInformationはトップのみ
  if (!pref) {
    spFields.push('pageInformation')
  }
  const page = pref ? city ? 'city' : 'pref' : 'top'
  spFields.push(`pageLayouts.${page}`)

  let service = await Service
    .findOne({
      key,
      enabled: true,
    })
    .select([...BASE_FIELDS, ...spFields].join(' '))
    .populate({
      path: 'pickupMedia',
      populate: {
        path: 'user',
        select: 'lastname firstname',
        options: {lean: true},
      },
      options: {
        limit: 6,
      },
    })
    .populate({
      path: 'proQuestions',
      match: {isPublished: true},
      select: 'text',
    })
    .populate({
      path: 'similarServices',
      select: 'key name',
      match: { enabled: true },
    })
    .populate({
      path: 'recommendServices',
      select: 'key name',
      match: { enabled: true },
    })
    .populate({
      path: 'queries',
      select: 'type subType summary',
      match: { usedForPro: true },
    })
    .populate({
      path: `pageLayouts.${page}`,
      select: 'layout',
    })

  if (service === null) return {service}
  service = service.toObject()
  for (const info of service.pageInformation || []) {
    if (!info.user) continue
    info.user = await User.findById(info.user).select('lastname firstname deactivate').lean()
    if (!info.user || info.user.deactivate) {
      info.user = null
      info.image = null
    }
  }
  service.pageLayout = service.pageLayouts ? service.pageLayouts[page] : null
  delete service.pageLayouts

  const relatedServicesQuery =  Service.find({ tags: service.tags[0], enabled: true }).select('id key name')
  const categoryQuery = service.tags ? Category.findOne({name: service.tags[0]}).select('key name providerName') : Promise.resolve()
  const [ category, relatedServices ] = await Promise.all([
    categoryQuery,
    relatedServicesQuery,
  ])

  return { service, category, relatedServices }
}

export async function getLocationService({category, service, relatedServices, pref, city, town}) {
  const keyPath = (town ? [pref, city, town] : city ? [pref, city] : pref ? [pref] : []).join(',')
  const parentKeyPath = (town ? [pref, city] : city ? [pref] : []).join(',')
  const selector = 'isGroup name key'
  const locationServiceQuery =
    pref ? LocationService.findOne({keyPath, service: service.id}).sort('-count').lean() : // pref, city, town
    Promise.resolve() // 全国

  let count = {count: {$gt: 0}}
  // 主要カテゴリ以外のプロが１人しかいない地域SP、地域CPのリンクをなくす
  if (!config.showLocationLPs.includes(category.key)) {
    count = {count: {$gt: 1}}
  }

  const parentsQuery =
    city ? LocationService.find({parentKey: 'japan', service: service.id}).select(selector).sort('-count').lean()
    : Promise.resolve([])

  const brothersQuery =
    city ? LocationService.find({keyPath: new RegExp(`^${parentKeyPath},[^,]+$`), service: service.id, ...count}).select(selector).sort('-count').lean() : // city, town
    pref ? LocationService.find({parentKey: 'japan', service: service.id, ...count}).select(selector).sort('-count').lean() : // pref
    Promise.resolve([]) // 全国

  const childrenQuery =
    town ? Promise.resolve([]) : // town
    pref ? LocationService.find({keyPath: new RegExp(`^${keyPath},[^,]+$`), service: service.id, ...count}).select(selector).sort('-count').lean() : // pref, city
    LocationService.find({parentKey: 'japan', service: service.id, ...count}).select(selector).sort('-count').lean() // 全国

  const locationQuery =
    pref ? Location.findOne({keyPath, isPublished: true}) : // pref, city, town
    Promise.resolve() // 全国

  const areaDescQuery =
    pref ? ServiceArea.findOne({key: pref, service: service.id}) : // pref, city, town
    Promise.resolve() // 全国

  // 同一都道府県の関連サービスリスト
  const locationRelatedServicesQuery =
    pref && relatedServices && relatedServices.length > 0 ? LocationService.aggregate([
      {
        $match: {
          parentKey: 'japan',
          key: pref,
          service: {$in: relatedServices.map(s => s._id)},
          ...count,
        },
      },
      { $group: { _id: { key: '$key', name: '$name', service: '$service' } } },
      { $replaceRoot: { newRoot: '$_id' } },
      { $sort: { count: -1 } },
    ]) : Promise.resolve() // 全国

  // 近隣都道府県の同一サービスリスト
  const locationCategoriesQuery =
    LocationService.aggregate([
      {
        $match: {
          parentKey: 'japan',
          key: {$in: seo.nearPrefectures[pref] || seo.nearPrefectures.all},
          service: service._id,
          ...count,
        },
      },
      { $group: { _id: { key: '$key', name: '$name' } } },
      { $replaceRoot: { newRoot: '$_id' } },
      { $sort: { count: -1 } },
    ])

  const [locationService, parents, brothers, children, location, areaDesc, locationRelatedServices, locationCategories] = await Promise.all([
    locationServiceQuery,
    parentsQuery,
    brothersQuery,
    childrenQuery,
    locationQuery,
    areaDescQuery,
    locationRelatedServicesQuery,
    locationCategoriesQuery,
  ])

  if (locationService === null) return {locationService}
  if (areaDesc) {
    service.description = areaDesc.description ? areaDesc.description : service.description
    service.pageDescription = areaDesc.pageDescription ? areaDesc.pageDescription : service.pageDescription
  }

  if (locationRelatedServices) {
    locationRelatedServices.forEach(l => l.service = relatedServices.find(s => s._id.equals(l.service)))
  }
  if (locationCategories) {
    locationCategories.forEach(l => l.category = category)
  }

  return { locationService, parents, brothers, children, location, locationRelatedServices, locationCategories }
}

export async function getProfileMediaRequestReview({profileCond, reviewOptions, service, locationService}) {
  const promises = [
    Profile
      .find(profileCond)
      .select('name address description averageRating score reviewCount')
      .sort({score: -1})
      .limit(50)
      .populate({
        path: 'pro',
        select: 'imageUpdatedAt',
      })
      .populate({
        path: 'reviews',
        select: 'rating username text service',
        match: {
          rating: {$gt: 3},
          text: {$exists: true},
          $expr: {$gt: [{ $strLenCP: '$text' }, 30]},
        },
        options: reviewOptions,
      })
      .lean({virtuals: true}),
    ProService
      .find({service: service._id})
      .select('user media')
      .populate({
        path: 'media',
        select: '-createdAt -__v',
      }),
    FormattedRequest.aggregate([
      { $match: { service: service._id, public: true } },
      { $project: {
        meetsLength: { $size: { $ifNull: [ '$meets', [] ] } },
        prefecture: true,
        city: true,
        description: true,
        meets: true,
        createdAt: true,
      } },
      { $sort: { meetsLength: -1 } },
    ]),
    Review.aggregate([
      { $match: { service: service._id } },
      { $group: { _id: null, count: {$sum: 1}, avg: {$avg: '$rating'} } },
    ]),
  ]

  const [profiles, mediaLists, requests, reviews] = await Promise.all(promises)

  // 場所にマッチする依頼例があればそれを使う
  let request
  if (requests.length) {
    for (const r of requests) {
      if (locationService && (r.prefecture === locationService.name || r.prefecture === locationService.parentName)) {
        request = r
        break
      }
    }
    if (!request) request = requests[0]
    request.customer = 'KSTNHMY'[(+new Date(request.createdAt)) % 7] // 適当なアルファベット生成
  }

  // 関連する画像
  const ids = profiles.map(p => p.pro.id)
  let media = []
  for (const list of mediaLists) {
    const index = ids.indexOf(list.user.toString())
    if (index === -1) continue
    const profile = profiles[index]
    list.media.map(m => {
      media.push(Object.assign({}, m.toObject(), {profile}))
    })
  }
  media = media.filter((m, i, self) => self.findIndex(t => t.id === m.id) === i)
  media = shuffle(media)

  return { profiles, media, request, reviews }
}

export async function servicePage(req, res) {
  const MAX_PROFILE_LENGTH = 12
  const serviceKey = req.params.key
  const { pref, city, town } = req.query

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

  // 1. サービスkeyを元にサービス・カテゴリを取得
  const { service, category, relatedServices } = await getServiceCategory({key: serviceKey, pref, city})
  if (service === null) return res.status(404).json({message: 'not found'})

  // 2. 関連サービス, エリア情報を取得
  const {
    locationService,
    parents,
    brothers,
    children,
    location,
    locationRelatedServices,
    locationCategories,
  } = await getLocationService({category, service, relatedServices, pref, city, town})

  // null判定でないとtopページまでリダイレクトしてしまう
  if (locationService === null) return res.status(404).json({message: 'locationService not found'})


  // 3. プロフィール、関連する投稿写真、依頼例を取得
  const profileCond: {
    hideProfile: {$ne: true},
    suspend: {$exists: false},
    deactivate: {$ne: true},
    description: {$exists: true, $ne: ''},
    _id?: object,
    services?: string,
    loc?: object,
  } = {
    hideProfile: {$ne: true},
    suspend: {$exists: false},
    deactivate: {$ne: true},
    description: {$exists: true, $ne: ''},
  }
  if (locationService) {
    profileCond._id = { $in: locationService.profiles }
    if (location && location.code) {
      locationService.code = location.code
    }
  } else {
    profileCond.services = service.id
  }

  const reviewOptions = {
    sort: {createdAt: 1},
  }

  let { profiles, request, media, reviews } = await getProfileMediaRequestReview({profileCond, reviewOptions, service, locationService})

  // 4. プロの並び替え
  for (const i in profiles) {
    // このサービスの成約数でスコアを増やす
    let score = profiles[i].score
    const hiredCount = await Meet.count({profile: profiles[i].id, service: service.id, hiredAt: {$exists: true}})
    score += hiredCount > 20 ? 40 :
             hiredCount > 10 ? 35 :
             hiredCount > 5 ? 30 :
             hiredCount > 2 ? 25 :
             hiredCount > 0 ? 20 : 0
    profiles[i].score = score
  }

  profiles = profiles.sort((a, b) => b.score - a.score).slice(0, MAX_PROFILE_LENGTH)

  // 5. プロが足りない場合
  let leads = []
  if (profiles.length < MAX_PROFILE_LENGTH) {

    if (location) {
      profileCond.loc = {
        $near: {
          $geometry: location.loc,
          $maxDistance: location.distance,
        },
      }
    }

    // 関連サービスのプロを並べる
    const relatedProfiles = await Profile
      .find({
        ...profileCond,
        _id: {$nin: profiles.map(p => p.id)},
        services: {$in: relatedServices.map(s => s.id)},
      })
      .select('name address description averageRating score')
      .sort({score: -1})
      .limit(MAX_PROFILE_LENGTH - profiles.length)
      .populate({
        path: 'pro',
        select: 'imageUpdatedAt',
      }).populate({
        path: 'reviews',
        select: 'rating username text service',
        match: {
          rating: {$gt: 3},
          text: {$exists: true},
          $expr: {$gt: [{ $strLenCP: '$text' }, 30]},
        },
        options: {
          sort: {createdAt: -1},
        },
      })
      .lean({virtuals: true})
    profiles.push(...relatedProfiles)

    if (profiles.length < MAX_PROFILE_LENGTH && locationService && locationService.leads) {
      // leadから住所が一致して、説明文が書かれているデータを取得する
      leads = await Lead.find({_id: {$in: locationService.leads}, registered: { $ne: true }})
        .select('name address description')
        .limit(MAX_PROFILE_LENGTH - profiles.length)
        .lean({virtuals: true})
      // 住所をページにあわせる
      leads = leads.map(l => ({...l, address: location.path.split(',').join('')}))
    }
  }

  // クチコミを出来る限りユニークにする
  for (const i in profiles) {
    if (profiles[i].reviews.length === 0) continue
    const serviceReviews = profiles[i].reviews.filter(r => r.service && r.service.toString() === service.id)
    // mongoID が 16 進数なので、それを 10 進数にしてクチコミ数で剰余をとる
    const hash = locationService ? parseInt(locationService._id.toString().slice(-12), 16) : 0
    // サービスに対するクチコミがあったらそのクチコミを選択する
    if (serviceReviews.length > 0) {
      const idx = hash % serviceReviews.length
      profiles[i].reviews = [serviceReviews[idx]]
    } else {
      // サービスに対するクチコミがなかったら分散させて選択する
      // ロジックはもっと改善できるかもしれない？
      const idx = hash % profiles[i].reviews.length
      profiles[i].reviews = [profiles[i].reviews[idx]]
    }
  }

  for (const proQuestion of service.proQuestions) {
    const cond: {
      proQuestion: string,
      isPublished: boolean,
      prefecture?: string,
      loc?: object,
    } = {
      proQuestion: proQuestion.id,
      isPublished: true,
    }

    if (location) {
      cond.prefecture = location.path.split(',')[0]
      cond.loc = {
        $near: {
          $geometry: location.loc,
        },
      }
    }

    // プロの回答
    proQuestion.answers = await ProAnswer
      .find(cond)
      .select('text profile')
      .populate({
        path: 'profile',
        select: 'name prefecture city',
        match: {
          services: service,
          deactivate: {$ne: true},
          hideProfile: {$ne: true},
          suspend: {$ne: true},
        },
      })
      .populate({
        path: 'pro',
        select: 'imageUpdatedAt',
      })
      .limit(20)
      .lean({virtuals: true})

    proQuestion.answers = proQuestion.answers
      .filter(a => a.profile)
      .slice(0, 4)
  }

  // 画像をシャッフル
  service.pickupMedia = shuffle(service.pickupMedia)

  const price = await getPriceEstimate({service: service._id})

  const { articles: recommendArticles } = await fetchRecommendArticleList({category: service.wpId, pref: pref || 'all', per_page: 6})

  const lsp = await getLocationServiceProfiles(req.query, service)

  res.json({
    service,
    category,
    locationService,
    leads,
    parents,
    brothers,
    children,
    request,
    price,
    profiles: lsp ? lsp.profiles : profiles,
    media: media.slice(0, 18),
    reviewInfo: reviews[0],
    relatedServices,
    locationRelatedServices,
    locationCategories,
    recommendArticles,
  })
}

export async function getLocationServiceProfiles(query, service) {
  const { pref, city } = query
  if (!pref) {
    return null
  }
  const keyPath = []
  keyPath.push(pref)
  if (city) keyPath.push(city)

  const runtimeConfigName = await RuntimeConfig.getConfigNameForId(service._id, service)
  const isEnabled = runtimeConfigName === 'newSp'
  if (!isEnabled) {
    return null
  }

  const profilePopulate = {
    path: 'profile',
    model: 'Profile',
    select: 'name address description averageRating score reviewCount',
    sort: {score: -1},
    populate: {
      path: 'pro',
      model: 'User',
      select: 'imageUpdatedAt',
    },
  }
  const profileSort = (a, b) => {
    return b.score - a.score
  }

  const locationService = await LocationService.findOne({
    service,
    keyPath: keyPath.join(','),
  }).populate({
    path: 'reviews',
    select: 'rating username text service',
    populate: profilePopulate,
  }).populate({
    path: 'relatedReviews',
    select: 'rating username text service',
    populate: profilePopulate,
  }).populate({
    path: 'proServices',
    select: 'description service',
    populate: profilePopulate,
  }).populate({
    path: 'relatedProServices',
    select: 'description service',
    populate: profilePopulate,
  }).lean({virtuals: true})

  if (!locationService || !locationService.reviews || !locationService.proServices) {
    return null
  }

  const locationReviews = locationService.relatedReviews ? [...locationService.reviews, ...locationService.relatedReviews] : locationService.reviews
  const locationProServices = locationService.relatedProServices ? [...locationService.proServices, ...locationService.relatedProServices] : locationService.proServices

  // 段階リリース
  // まずは review 12 溜まっているものから
  if (locationReviews.length < 12) {
    return null
  }

  if (locationProServices.length > 0) {
    const locationProfiles = [
      ...locationReviews.map(r => {
        const p = r.profile
        p.reviews = [r]
        p.description = null
        delete r.profile
        return p
      }).sort(profileSort),
      ...locationProServices.map(ps => {
        const p = ps.profile
        p.reviews = []
        p.description = ps.description || p.description
        delete ps.profile
        return p
      }).sort(profileSort),
    ]
    return {
      profiles: locationProfiles,
    }
  }

  // proServices がない場合は、自己紹介も下につける
  // ただし、サービス別自己紹介がある場合はそれを優先する
  const proServices = await ProService.find({
    service,
    profile: {$in: locationReviews.map(r => r.profile)},
  }).select('_id profile description').lean()

  const locationProfiles = locationReviews.map(r => {
    const p = r.profile
    p.reviews = [r]
    const ps = proServices.find(ps => ps.profile.toString() === p._id.toString())
    if (ps && ps.description && ps.description.length > 0) {
      p.description = ps.description
    }
    delete r.profile
    return p
  }).sort(profileSort)

  return {
    profiles: locationProfiles,
  }
}

export async function priceEstimateFromQuestions(req, res) {
  let questionsParams = []
  if (req.query.questions) {
    try {
      questionsParams = JSON.parse(req.query.questions)
    } catch (e) {
      return res.json({})
    }
  }
  const cond = ObjectId.isValid(req.query.id) ? {_id: req.query.id} : {key: req.query.key || ''}

  const service = await Service.findOne(cond)
    .select('_id priceEstimateQueries')
    .populate('priceEstimateQueries.query')
    .lean()
  if (!service || !service.priceEstimateQueries) return res.json({})

  const questions = []
  for (const q of service.priceEstimateQueries) {
    const query = q.query
    const answered = questionsParams.find(qp => qp.id === query._id.toString())
    if (answered && answered.answers.length) {
      questions.push({
        summary: query.summary,
        type: query.type,
        subType: query.subType,
        answers: query.options.map(o => ({...o, checked: answered.answers.includes(o._id.toString())})),
      })
    }
  }
  const priceEstimate = await getPriceEstimate({
    service: service._id,
    questions,
  })

  res.json(priceEstimate)
}

export async function averagePrice(req, res) {
  const meets = await calcMedian()
  const services = await Service.populate(meets, {path: '_id'})

  const response = services.map(s => ({
    id: s._id.id,
    key: s._id.key,
    name: s._id.name,
    tags: s._id.tags,
    image: s._id.image,
    price: Math.round(s.median / 100) * 100,
  }))

  res.json(response)
}

// admin

export async function indexForAdmin(req, res) {
  const type = req.query.type
  let services
  if (type === 'proQuestion') {
    // proQuestionsのpopulateは重い
    services = await Service
      .find({deleted: {$ne: true}})
      .sort({priority: -1})
      .populate('proQuestions')
  } else if (type === 'query') {
    // queriesのpopulateは重い
    services = await Service
      .find({deleted: {$ne: true}})
      .sort({priority: -1})
      .populate({
        path: 'queries',
        select: QUERY_INCLUDE_ADMIN_FIELDS,
      })
      .select()
  } else {
    services = await Service
      .find()
      .sort({priority: -1})
  }
  res.json(services)
}

export async function servicePageV2(req, res) {
  const service: Interfaces.services.servicePageV2.Service = await Service.findOne({key: req.params.key})
    .select('_id name image imageUpdatedAt key description category queries averagePoint matchMoreEnabled tags pageMetaDescription providerName instantResultAnnotation')
    .populate({path: 'category', select: 'key name'})
    .populate({path: 'queries', select: 'summary subType usedForPro type'})
    .lean({virtuals: true})

  if (!service) return res.status(404).json({message: 'not found'})
  const { pref, city, town } = req.query
  const keyPath = [pref, city, town].filter(p => p).join(',')
  const location: Interfaces.services.servicePageV2.Location = await Location
    .findOne({keyPath})
    .select('_id path name loc keyPath')
    .lean()
  if (!location) {
    return res.status(410).json({message: 'gone', statusCode: 410})
  }

  let [proServices, reviews] = await Promise.all<Interfaces.services.servicePageV2.ProService[], Interfaces.services.servicePageV2.Review[]>([
    ProService.aggregate([{
      $geoNear: {
        spherical: true,
        near: location.loc,
        distanceField: 'way',
        limit: 1000000,
        query: {
          disabled: {$ne: true},
          service: {$eq: service._id},
        },
      },
    }, {
      $lookup: {
        from: 'users',
        foreignField: '_id',
        localField: 'user',
        as: 'user',
      },
    }, {
      $unwind: '$user',
    }, {
      $lookup: {
        from: 'profiles',
        foreignField: '_id',
        localField: 'profile',
        as: 'profile',
      },
    }, {
      $unwind: '$profile',
    }, {
      $match: {
        'profile.hideProfile': { $ne: true }, // 非表示プロは検索結果に出さない
        'profile.description': { $exists: true }, // 説明文がない
        'profile.suspend': {$exists: false},  // 運営がBAN
        'profile.deactivate': {$ne: true},    // プロが退会
        'user.isInArrears': {$ne: true},      // user payment didn't fail
        'user.imageUpdatedAt': {$exists: true},
      },
    }, {
      $lookup: {
        from: 'media',
        foreignField: '_id',
        localField: 'media',
        as: 'media',
      },
    }, {
      $lookup: {
        from: 'media',
        foreignField: '_id',
        localField: 'profile.media',
        as: 'profile.media',
      },
    }, {
      $addFields: {
        isSamePrefecture: {$eq: ['$prefecture', location.path.split(',')[0]]},
        isSameCity: {$and: [{$eq: ['$city', location.path.split(',')[1]]}, {$eq: ['$prefecture', location.path.split(',')[0]]}]},
        score: {$divide: ['$profile.score', '$way']},
      },
    }, {
      $addFields: {
        // 市区町村ページは市区町村一致、都道府県ページは都道府県一致だけを見る
        isAreaMatch: {$cond: [!!city, '$isSameCity', '$isSamePrefecture']},
      },
    }, {
      $project: {
        way: true,
        service: true,
        'user.lastAccessedAt': true, // ProSummary
        'user.imageUpdatedAt': true, // UserAvatar
        'user.schedule': true, // InstantResult
        'user._id': true,
        'profile.name': true, // ProSummary
        'profile.address': true, // ProSummary
        'profile.reviewCount': true, // ProSummary
        'profile.averageRating': true, // ProSummary
        'profile.description': true, // ProSummary
        'profile.score': true, // sort
        'profile.media': true,
        'profile._id': true,
        zipcode: true,
        address: true,
        budget: true,
        prefecture: true,
        city: true,
        distance: true,
        distanceGroup: {$cond: ['$isAreaMatch', 0, {$floor: {$divide: ['$way', 5000]}}]},
        media: true,
        reviewCount: true,
        priceValues: true,
        minValue: true,
        description: true,
        setupPriceValues: true,
        score: {$cond: [{$or: ['$isSamePrefecture', '$isSameCity']}, '$profile.score', '$score']},
      },
    }, {
      $sort: {
        isAreaMatch: -1,
        distanceGroup: 1, // エリア外は5km単位でグルーピング
        setupPriceValues: -1, // セグメント内で価格入力プロを上に
        isPromited: -1, // セグメント内でプロモONを上に
        score: -1, // さらにスコア順に並べる
      },
    }, {
      $limit: 20,
    }]),
    Review.aggregate()
      .match({service: service._id})
      .group({_id: null, count: {$sum: 1}, avg: {$avg: '$rating'}}),
  ])

  proServices = await appendInfoToProService(
    proServices.map(p => {
      p.minValue = p.priceValues.filter(p => p.type === 'base').reduce((p, c) => p ? Math.min(p, c.value) : c.value, null)
      p.profile.shortId = mongoIdToShortId(p.profile._id)
      return p
    }),
    service
  )
  proServices = proServices.map(ps => {
    if (!ps.existingMeet) {
      ps.price = {
        components: [],
        estimatePriceType: 'minimum',
        total: ps.minValue,
      }
    }
    return ps
  })

  InsertMatchMoreSPSearchLog(req,
    BQEventTypes.match_more.SP_RESULT,
    {
      proServices,
      service,
      prefecture: location.path.split(',')[0],
      city: location.path.split(',')[1],
      town: location.path.split(',')[2],
    }
  )

  const response: Interfaces.services.servicePageV2.Response = {
    service,
    location,
    proServices,
    reviewInfo: reviews[0], // for SEO
  }
  res.json(response)
}

function InsertMatchMoreSPSearchLog(req, event_type, {service, proServices, prefecture, city, town}) {
  try {
    BigQueryInsert(req, {
      event_type,
      event: JSON.stringify({
        serviceId: service._id,
        prefecture,
        city,
        town,
        proServices: proServices.map((ps, index) => ({
          price: ps.price && ps.price.total,
          rating: ps.profile.averageRating,
          reviewCount: ps.profile.reviewCount,
          mediaLength: ps.media.length,
          descriptionLength: (ps.description || ps.profile.description || '').length,
          _id: ps._id,
          rank: index + 1,
        })),
      }),
    }, 'match_more')
  } catch (e) {
    console.log(e)
  }
}

export async function showForAdmin(req, res) {
  let service = await Service.findOne({_id: req.params.id}).populate(['pickupMedia', 'similarServices', 'recommendServices', 'proQuestions'])
  .populate({
    path: 'queries',
    select: QUERY_INCLUDE_ADMIN_FIELDS,
  })

  if (service === null) return res.status(404).json({message: 'not found'})

  const price = await getPriceEstimate({service: service._id})
  service = service.toObject()
  service.price = price
  service.jobRequirements = generateJobRequirements(service.queries, [])

  // TODO: delete after migrating all keys
  const seoSetting = await SeoSetting.findOne({category: service.category, service: service._id})
    .select('relatedServices')
    .populate({
      path: 'relatedServices',
      select: '_id key name',
    })
  service.seoSetting = seoSetting || {relatedServices: []}

  res.json(service)
}

export async function createForAdmin(req, res) {
  const exist = await Service.countDocuments({key: req.body.key})
  if (exist) return res.status(400).json({message: 'already exist'})

  const service = await Service.create(req.body)
  req.params.id = service.id
  await showForAdmin(req, res)
}

export async function update(req, res) {
  const service = await Service.findOne({_id: req.params.id})
  if (service === null) return res.status(404).json({message: 'not found'})

  if (req.body.pageInformation) {
    await redis.delAsync(redisPrefix + service.id)
  }

  // TODO: delete after migrating all keys to seoSettings
  if (req.body.seoSetting) {
    await SeoSetting.findOneAndUpdate(
      {category: service.category, service: service.id},
      {$set: req.body.seoSetting},
      {upsert: true, new: true, runValidators: true}
    )
    delete req.body.seoSetting
  }

  await Service.findByIdAndUpdate(service.id, {$set: req.body})
  await showForAdmin(req, res)
}

export async function remove(req, res) {
  const migrateTo = await Service.find({_id: req.body.migrateTo})
  if (!migrateTo.length) return res.status(404).json({message: 'not found'})
  const service = await Service.findByIdAndUpdate(req.params.id, {deleted: true})
  if (service === null) return res.status(404).json({message: 'not found'})

  await Service.update({similarServices: service}, {$addToSet: {similarServices: migrateTo}}, {multi: true})
  await Service.update({similarServices: service}, {$pull: {similarServices: service._id}}, {multi: true})
  await Service.update({recommendServices: service}, {$addToSet: {recommendServices: migrateTo}}, {multi: true})
  await Service.update({recommendServices: service}, {$pull: {recommendServices: service._id}}, {multi: true})

  await Profile.update({services: service}, {$addToSet: {services: migrateTo}}, {multi: true})
  await Profile.update({services: service}, {$pull: {services: service._id}}, {multi: true})

  await ProService.updateMany({service}, {$set: {disabled: true}})

  await MeetTemplate.remove({service})
  await LocationService.remove({service})
  await ServiceArea.remove({service})
  await ProfileIntroduction.remove({service})
  await Keyword.remove({service})

  res.send()

  // もしエラーが出てもどうにかなる & 重いqueryはres.send()のあと
  await Crawl.update({services: service}, {$addToSet: {services: migrateTo}}, {multi: true})
  await Crawl.update({services: service}, {$pull: {services: service._id}}, {multi: true})

  await Lead.update({services: service}, {$addToSet: {services: migrateTo}}, {multi: true})
  await Lead.update({services: service}, {$pull: {services: service._id}}, {multi: true})
}

export async function signedUrl(req, res) {
  const key = `services/${req.params.id}.jpg`
  const signedUrl = await S3.getSignedUrl({key})
  res.json({signedUrl})
}

export async function pageInformationSignedUrl(req, res) {
  const id = new ObjectId()
  const key = `pageinformation/${id}.${req.query.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
  const url = `${config.get('bucketOrigin')}/${key}?`
  res.json({signedUrl, url, id})
}

export async function relatedMedia(req, res) {
  const id = req.params.id

  const [profiles, proServices] = await Promise.all([
    Profile.find({
      services: id,
      suspend: {$exists: false},
      deactivate: {$ne: true},
      deleted: {$ne: true},
    }).select('media'),
    ProService.find({service: id}).select('media'),
  ])

  const ids = [].concat(...profiles.map(p => p.media), ...proServices.map(m => m.media))
  const media = await Media.find({_id: {$in: ids}}).limit(500)

  res.json(media)
}

export async function copyQuery(req, res) {
  const serviceId = req.params.id
  const userId = req.user._id

  if (process.env.NODE_ENV !== 'dev') {
    res.status(400).json({message: 'this operation is dev only'})
    return
  }
  await copyDevQueryToProd(serviceId)
  await QueryCopyHistory.create({
    operator: userId,
    service: serviceId,
  })

  res.json({message: 'ok'})
}

export async function contentDraftLoad(req, res) {
  const drafts = await redis.lrangeAsync(redisPrefix + req.params.id, 0, DRAFT_MAX)
  if (drafts === null) return res.status(404).json({message: 'not found'})

  res.json(drafts.map(d => JSON.parse(d)))
}

export async function contentDraftSave(req, res) {
  const service = await Service.findOne({_id: req.params.id})
  if (service === null) return res.status(404).json({message: 'not found'})

  const len = await redis.llenAsync(redisPrefix + service.id)
  // 古い順に消す
  if (len > DRAFT_MAX) {
    await redis.rpopAsync(redisPrefix + service.id)
  }
  req.body.user = req.user.lastname + req.user.firstname || ''
  req.body.date = new Date()
  await redis.lpushAsync(redisPrefix + service.id, JSON.stringify(req.body))

  await showForAdmin(req, res)
}

export async function meetEstimation(req, res) {
  const meetEstimation = await getMeetEstimation(req.params.id)
  res.json(meetEstimation)
}

//functions

export async function calcMedian() {
  const cond = {
    priceType: 'fixed',
    price: {$gt: 0},
  }

  // 見積もり価格中央値
  return await Meet.aggregate([
    {$match: cond},
    {$sort: {price: 1}},
    {$group: {
      _id: '$service',
      prices: {$push: '$price'},
      count: {$sum: 1},
    }},
    // 標本10以上
    {$match: {count: {$gte: 10}}},
    {$project: {
      std: 1,
      median: {
        $let: {
          vars: {
            mid: {
              $floor: {$divide: ['$count', 2]},
            },
          },
          in: {
            // 中央値+その２つ上の値の平均を中央値とする
            $avg: [
              { $arrayElemAt: [ '$prices', '$$mid' ] },
              { $arrayElemAt: [ '$prices', { $add: ['$$mid', 1] } ] },
              { $arrayElemAt: [ '$prices', { $add: ['$$mid', 2] } ] },
            ],
          },
        },
      },
    }},
  ])
}

export async function getTrends() {
  const keys = [
    'portrait-photographers',
    'housing-architecture-photographers',
    'housework',
    'air-conditioner-cleaning',
    'inheritance-tax-accountant',
    'tax-return-accountant',
    'corporate-website-development',
    'english-translation',
  ]
  const trends = await Service.find({key: {$in: keys}, deleted: {$ne: true}}).select('key name')

  return trends.map(t => ({
    key: t.key,
    name: t.name,
  }))
}

export async function getAveragePoint(serviceId) {
  const response = await Request.aggregate([
    {
      $match: {
        service: new ObjectId(serviceId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 100,
    },
    {
      $group: {
        _id: '$service',
        avgPoint: {$avg: '$point'},
      },
    },
  ])

    // 平均ポイント
    // PPCが増えてきたら、PPCの成約率で割るのもありか？
  const averagePoint = response.length > 0 ? response[0].avgPoint : 0
  return averagePoint
}
