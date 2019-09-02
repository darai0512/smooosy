export {}
const { ObjectID } = require('mongodb')
const cloneDeep = require('lodash/cloneDeep')

const { Request, Meet, Profile, Service, User, MailLog, BlackList, ProStat, Location, Contact, ProService, RuntimeConfig, MatchExclusive } = require('../models')
const { emailCreateRequest, emailDeleteRequest, emailDeleteRequestPro, emailUpdateRequest, emailNewRequest } = require('../lib/email')
const {
  calculatePrice,
} = require('./proServices')
const { injectDescriptionIntoQueries } = require('../lib/matching/common')
const { matchingBuckets } = require('../lib/matching/buckets')
const { S3 } = require('../lib/aws')
const logger = require('../lib/logger')
const {
  slack,
  getIP,
  matchers,
  regexpEscaper,
  compObjRefs,
} = require('../lib/util')
const findMatchingProsForRequest = require('../lib/matching/requestBased')
const meetsLib = require('../lib/meets')
const { DEFAULT_PRICE_CONFIG } = require('../lib/pricing/requests/price_config')
import { filterPriceValuesWithJobRequirements, filterValidJobRequirements } from '../lib/proService'
const { BigQueryInsert } = require('./bigquery')
const config = require('config')
const moment = require('moment')
const Mecab = require('mecab-async')
const mecabDicDir = config.get('mecabDicDir')
Mecab.command = `mecab -d ${mecabDicDir}/mecab-ipadic-neologd`

const { discountPoint, refundPoint } = require('./points')
const { timeNumbers, interviewDescription, webOrigin, FlowTypes, MeetStatusType, rolloutDates } = require('@smooosy/config')
const { requestValidateNames, requestValidateText } = require('../lib/validate')
const intercom = require('../lib/intercom')
const { timeRangeToHourDuration } = require('../lib/date')
const { getPriceResultForRequest, priceResultsToMap, isHighPoint } = require('../lib/pricing/pricingUtils')
const { getQueryParams } = require('../lib/util')
const { pageview } = require('../lib/analytics')
import instant from '../lib/matching/instant'
const { handleCSTaskInterview } = require('./cstasks')
const { getMeetEstimation } = require('../lib/estimate')
const { getDistance } = require('../lib/geospatial')

const PRICE_THRESHOLD = 300000

module.exports = {
  index,
  latest,
  create,
  matchByUser,
  indexForPro,
  show,
  showForPro,
  showForLead,
  update,
  overwrite,
  pass,
  signedUrl,
  // admin
  indexForAdmin,
  showForAdmin,
  updateForAdmin,
  resendForAdmin,
  matchProForAdmin,
  excludeProForAdmin,
  // lib
  recent,
}

async function index(req, res) {
  const requests = await Request
    .find({
      customer: req.user.id,
      deleted: {$ne: true},
    })
    .select('service status meets createdAt')
    .sort({createdAt: -1})
    .populate({
      path: 'service',
      select: 'name providerName',
      options: {lean: true},
    })
    .populate({
      path: 'meets',
      select: 'pro status review',
      populate: {
        path: 'pro',
        model: 'User',
        select: 'imageUpdatedAt indentification deactivate',
      },
    })

  res.json(requests)
}

async function latest(req, res) {
  const cond: any = {
    customer: req.user.id,
    status: 'open',
    createdAt: {$gt: moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() },
  }

  if (req.query.serviceId) {
    cond.service = req.query.serviceId
  }
  const request = await Request.findOne(cond).select('id').sort('-createdAt')

  res.json(request)
}

async function matchByUser(req, res) {
  const [ request, profile ] = await Promise.all([
    Request.findOne({
      _id: req.params.id,
      customer: req.user.id,
    })
    .populate('customer')
    .populate({path: 'service', populate: {
      path: 'queries', options: { lean: true },
    }})
    .populate({path: 'meets', select: 'profile'})
    .populate({path: 'pendingMeets', select: 'profile'}),
    Profile.findOne({_id: req.body.profile})
    .populate('pro'),
  ])

  if (request === null || profile === null) {
    return res.json()
  }

  const alreadyMeetExists = [...(request.meets || []), ...(request.pendingMeets || [])].find(m => m.profile.toString() === profile.id)
  if (alreadyMeetExists) {
    return res.json()
  }

  // すでに送信済みのプロ
  const isSent = request.sent.find(s => s.toString() === profile.id)

  // 強制マッチ
  await Request.findByIdAndUpdate(request.id, {$addToSet: {specialSent: profile.id, sent: profile.id}})

  if (!isSent) {
    const proService = await ProService.findOne({
      profile: profile.id,
      service: request.service._id,
    }).select('_id jobRequirements')

    const queries = cloneDeep(request.service.queries)
    injectDescriptionIntoQueries(request.description, queries)
    const exactMatch = instant.isExactMatch(queries, proService)

    await Contact.createIfNotExists({
      request: request._id,
      proService: proService._id,
      profile: profile._id,
      isExactMatch: exactMatch,
      matchingBucket: matchingBuckets.MATCHED_BY_USER,
    })

    // 依頼メール送信
    emailNewRequest({
      profiles: [{
        pro: profile.pro,
        isExactMatch: exactMatch,
      }],
      lastname: request.customer.lastname,
      request,
      service: request.service,
    })
  }

  res.json()
}

async function indexForPro(req, res) {
  const tbdMeets = await Meet.find({
    pro: req.user._id,
    proResponseStatus: 'tbd',
  }).select('request').lean()
  const acceptedMeets = await Meet.find({
    pro: req.user._id,
    proResponseStatus: 'autoAccept',
    readByPro: {$ne: true},
  }).select('request').lean()

  const requestToMeet = {}
  for (const meet of [...tbdMeets, ...acceptedMeets]) {
    requestToMeet[meet.request] = meet._id
  }
  const acceptedRequest = await Request
    .find({
      _id: { $in: acceptedMeets.map(a => a.request._id) },
      status: 'open',
    })
    .sort({createdAt: -1})
    .select('-phone')
    .populate({
      path: 'service',
      select: 'name tags matchMoreEditable',
      options: {lean: true},
    })
    .populate({
      path: 'customer',
      select: 'lastname',
      options: {lean: true},
    })
    .lean()
  const tbdRequests = await Request
    .find({
      _id: { $in: tbdMeets.map(t => t.request._id) },
      status: 'open',
      'meets.4': { $exists: false },
      createdAt: {$gt: moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() },
      interview: { $ne: 'admin' },
    })
    .sort({createdAt: -1})
    .select('-phone')
    .populate({
      path: 'service',
      select: 'name tags matchMoreEditable',
      options: {lean: true},
    })
    .populate({
      path: 'customer',
      select: 'lastname',
      options: {lean: true},
    })
    .lean()

  const requests = await Request
    .find({
      _id: {$nin: [...acceptedRequest, ...tbdRequests].map(c => c._id)},
      status: 'open',
      sent: {$in: req.user.profiles},
      'meets.4': { $exists: false },
      createdAt: {$gt: moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() },
      'passed.profile': {$nin: req.user.profiles},
      interview: { $ne: 'admin' },
    })
    .sort({createdAt: -1})
    .select('-phone')
    .populate({
      path: 'service',
      select: 'name queries tags matchMoreEditable',
      populate: { path: 'queries' },
      options: {lean: true},
    })
    .populate({
      path: 'customer',
      select: 'lastname',
      options: {lean: true},
    })
    .lean()

  const cmRequests = requests.filter(r => r.matchParams && r.matchParams.showExactMatch)

  if (cmRequests.length) {
    const services = Array.from(new Set(cmRequests.map(r => r.service)))

    const proServices = await ProService.find({
      profile: { $in: req.user.profiles },
      service: { $in: services },
    }).select('jobRequirements service').lean()

    for (const cmRequest of cmRequests) {
      const proService = proServices.find(ps => compObjRefs(ps.service, cmRequest.service))

      const service: any = services.find(s => compObjRefs(s, cmRequest.service))

      // need to make individual copy of service queries for each request,
      // since we may have multiple requests for the same service.
      const queries = cloneDeep(service.queries)
      injectDescriptionIntoQueries(cmRequest.description, queries)
      cmRequest.isExactMatch = instant.isExactMatch(queries, proService)
    }
  }

  const contacts = [...acceptedRequest, ...tbdRequests].sort((a, b) => {
    if (a.createdAt < b.createdAt) {
      return 1
    } else if (a.createdAt > b.createdAt) {
      return -1
    }
    return 0
  }).map(c => {
    c.meetId = requestToMeet[c._id]
    return c
  })

  res.json([ ...contacts, ...requests ])
}

// 依頼のチェック（フラグ）
async function requestValidate(req) {
  const service = await Service.findOne({_id: req.body.service})
  const profiles = await Profile.find({pro: req.body.customer})
    .populate({
      path: 'services',
      select: 'tags',
      match: {tags: service.tags[0]},
    })

  const user = req.user
  const description = req.body.description || []
  const requestTime = req.body.time
  const phone = req.body.phone
  const price = req.body.price

  const interview = []
  const userValid = requestValidateNames(user.firstname, user.lastname)

  if (userValid.isNotName) {
    interview.push('notname')
  }
  if (userValid.isAnonymous) {
    interview.push('anonymous')
  }
  if (userValid.isNG) {
    interview.push('ngwords')
  }
  if (userValid.isTest) {
    interview.push('testwords')
  }
  if (userValid.isRepeat) {
    interview.push('repeat')
  }
  if (userValid.hasEmail) {
    interview.push('hasEmail')
  }
  if (userValid.hasPhone) {
    interview.push('hasPhone')
  }

  const blacklists = await BlackList.find({enabled: true})
  const inputBlackLists = []
  const ipBlackLists = []
  const phoneBlackLists = []
  for (const blacklist of blacklists) {
    const regexp = matchers[blacklist.type](blacklist.text)
    // Eメール
    if (blacklist.target === 'email' && regexp.test(user.email)) {
      interview.push('blacklist')
    }
    // 名前
    if (blacklist.target === 'name' && (regexp.test(user.firstname) || regexp.test(user.lastname))) {
      interview.push('blacklist')
    }
    // 入力欄に含まれていたら
    if (blacklist.target === 'input') {
      inputBlackLists.push(regexp)
    }
    if (blacklist.target === 'ip') {
      ipBlackLists.push(regexp)
    }
    if (blacklist.target === 'phone') {
      phoneBlackLists.push(regexp)
    }
  }

  const validateTexts = []
  for (const d of description) {
    if (d.type === 'textarea') {
      validateTexts.push(d.answers[0].text)
    } else if (['multiple', 'singular'].includes(d.type)) {
      // answer.noteは'textarea'か'text'かnull
      validateTexts.push(...d.answers.filter(answer => answer.checked && answer.note).map(ans => ans.noteText))
    } else {
      continue
    }

  }
  loop:
  for (const text of validateTexts) {
    for (const regexp of inputBlackLists) {
      if (regexp.test(text)) {
        interview.push('blacklist')
        break loop
      }
    }
  }

  interview.push(...requestValidateText(validateTexts.join(' ')))

  const mustPhone = await RuntimeConfig.getBoolValue(
    'mustPhone',
  )

  // 聞き取り必須のサービス
  if (service.interview && !mustPhone) {
    interview.push('service')
  }

  // プロのログイン中の場合はプロフィールに含まれているカテゴリに依頼した場合はテストの可能性が高い
  const relatedServices = [].concat(...profiles.map(p => p.services))
  if (relatedServices.length > 0) {
    interview.push('protest')
  }

  // モーダル時間
  if (requestTime && requestTime < service.eliminateTime) {
    interview.push('early')
  }

  // 電話番号あり
  if (phone) {
    // デタラメな電話番号
    for (const regexp of phoneBlackLists) {
      if (regexp.test(phone)) {
        interview.push('phone')
      }
    }
    //高額案件はフラグを立てる
    if (price && price.avg > PRICE_THRESHOLD) {
      interview.push('highPrice')
    }
  }

  for (const regexp of ipBlackLists) {
    if (regexp.test(req.body.ip)) {
      interview.push('ip')
    }
  }

  return interview
}

async function create(req, res) {
  req.body.customer = req.user.id
  req.body.ip = getIP(req)

  // 依頼のチェック
  req.body.interview = await requestValidate(req)

  // 予算を設定する
  for (const d of req.body.description) {
    if (d.type === 'calendar' && d.subType === 'duration' &&
        d.answers.length > 0 && d.answers[0].start && d.answers[0].end) {
      req.body.duration = timeRangeToHourDuration(d.answers[0].start, d.answers[0].end)
    }

    if (d.type !== 'price') continue

    // [20000, 30000], [30000, 50000] を選んだら
    // min = 20000, max = 50000 に設定する
    let min = Infinity
    let max = 0
    for (const a of d.answers) {
      if (!a.range || !a.checked) continue
      min = Math.min(min, a.range[0])
      max = Math.max(max, a.range[1])
    }
    if (min < max) {
      req.body.price = {
        min,
        max,
        avg: (min + max) / 2,
      }
    }
    break
  }

  if (req.body.phone) {
    req.body.phone = req.body.phone.replace(/\-/g, '')
  }

  const request = new Request(req.body)
  request.priceModels = [DEFAULT_PRICE_CONFIG]

  if (request.loc) {
    request.nearbyPros = await request.calcNearbyPros()

    // add location
    const location = await Location.findOne({
      parentName: request.prefecture,
      name: request.city,
    }).select('_id').lean()
    if (!location) {
      logger.warn('can not find location', {requestId: request._id})
    } else {
      request.location = location._id
    }
  }

  const service = await Service.findByIdAndUpdate(req.body.service, {$inc: {requestCount: 1}}).populate('queries')
  request.category = service.tags[0]
  request.distance = service.distance
  request.maxPointCost = service.maxPointCost
  request.matchMoreEnabled = service.matchMoreEnabled // save matchMoreEnabled at this time
  request.usePriceValueBudget = service.usePriceValueBudget

  if (request.usePriceValueBudget) {
    injectDescriptionIntoQueries(request.description, service.queries)
    request.priceValueResult = calculatePrice({
      priceValues: service.priceValues,
      description: service.queries.filter(q => q.priceFactorType),
      service,
      distance: 0,
      proService: {},
    })
    request.priceModels.push('instant')
    request.pricesToPoints = service.pricesToPoints
  }

  request.matchParams = request.matchParams || {}

  if (service.showJobRequirements) {
    request.matchParams.showExactMatch = true
  }

  const context = {
    seed: request._id,
    service: service,
  }

  const useIdealMatching = await RuntimeConfig.getBoolValue(
    'useIdealMatching',
    context
  )
  const useIdealMatchingShadow = await RuntimeConfig.getBoolValue(
    'useIdealMatchingShadow',
    context
  )

  if (useIdealMatching) {
    request.matchParams.useIdealMatching = true
  }

  if (useIdealMatchingShadow) {
    request.matchParams.useIdealMatchingShadow = true
  }

  const { priceResults } = await request.calcPoint(service.basePoint, service.queries)

  request.point = getPriceResultForRequest(priceResults, request).value
  request.pt = await request.calcProbability() // 依頼の真性度

  if (request.price && isHighPoint(request.point, request.price.max)) {
    request.interview.push('highPoint')
  }

  // 類似依頼
  const relate = await relateRequest(request)
  if (relate) {
    request.interview.push('duplicate')
  }

  if (request.stack.some(s => /utm_medium=emailNewRequestForLead/.test(s))) {
    request.interview.push('viaLead')
  }
  if (request.stack.some(s => /^\/new-requests/.test(s))) {
    request.interview.push('viaNewRequest')
  }
  if (request.stack.some(s => /help\.smooosy\.com/.test(s))) {
    request.interview.push('viaHelp')
  }
  if (request.stack.some(s => /^\/pro/.test(s) && !s.includes('media'))) {
    request.interview.push('viaPro')
  }

  // 担当者判定
  if (req.user.corporation) {
    // lastnameに会社名以外に人名が入っている可能性がある
    const text = [req.user.lastname].concat(...req.body.description.filter(d => d.type === 'textarea').map(d => d.answers.map(a => a.text))).join('')
    try {
      const results = Mecab.parseSync(text)
      const includePersonName = results.some(result => result[3] === '人名')
      if (includePersonName) {
        request.interview.push('personName')
      }
    } catch (e) {
      console.log(e)
    }
  }

  request.interview = Array.from(new Set(request.interview))
  await request.save()
  // TODO: 計測テスト（created2にして様子見）
  pageview(`/modal/new-request/created2/${service.key}`, req.body.gaParams)

  await handleCSTaskInterview({request})
  req.params = {id: request.id}
  show(req, res)

  emailCreateRequest({user: req.user, request})

  BigQueryInsert(req, {
    event_type: 'request_create',
    event: JSON.stringify({ service_id: service.id, request_id: request.id }),
  })

  BigQueryInsert(req, {
    event_type: 'price_result_create',
    event: JSON.stringify({
      service_id: service.id,
      request_id: request.id,
      ...priceResultsToMap(priceResults),
    }),
  })

  // slackに通知
  const message = `:new: 【新規依頼】${req.body.flowType === FlowTypes.PPC ? '【ご指名】' : ''}${service.name}(${request.point}pt${request.discountReason || ''}) by ${req.user.lastname}${req.user.firstname ? ` ${req.user.firstname}` : ''}${req.user.corporation ? '【法人】' : ''} ${request.interview.length ? `:kininaru: ${request.interview.map(i => interviewDescription[i]).join(', ')}` : '' }\n${webOrigin}/tools/#/stats/requests/${request.id}`
  await slack({message, room: 'cs'})
  const allRequestCount = await Request.estimatedDocumentCount()
  if (allRequestCount % 10000 === 0) {
    await slack({
      message: `<!channel> 依頼総数${allRequestCount.toLocaleString()}件達成！:tada:`,
      room: 'cs',
      channel: '#all_オフィス',
    })
  }
}

async function show(req, res) {
  let request = await Request
    .findOne({_id: req.params.id, customer: req.user.id})
    .populate({
      path: 'sent',
      model: 'Profile',
      select: '-templates -score',
    })
    .populate({
      path: 'customer',
      select: 'lastname imageUpdatedAt deactivate',
    })
    .populate({
      path: 'service',
      select: 'name providerName recommendServices matchMoreEnabled',
      populate: {
        path: 'recommendServices',
        model: 'Service',
        select: 'name key matchMoreEnabled',
      },
    })
  if (request === null) {
    // 依頼主じゃない場合
    if (await Request.countDocuments({_id: req.params.id})) {
      return res.status(403).json({message: 'user mismatch'})
    }
    return res.status(404).json({message: 'not found'})
  }

  const meets = await Meet
    .find({request: request.id, customer: req.user.id})
    .sort({updatedAt: -1})
    .populate({
      path: 'pro',
      select: 'lastname firstname imageUpdatedAt lastAccessedAt identification deactivate phone',
    })
    .populate({
      path: 'profile',
      select: '-templates -score',
      populate: {
        path: 'reviews licences.licence',
      },
    })
    .populate({
      path: 'chats',
      populate: {
        path: 'user',
        model: 'User',
        select: 'imageUpdatedAt deactivate',
      },
    })

  // プロフィール削除時に退会済みと表示されないように、User model の deactivate を利用する
  const proServices = await ProService
    .find({
      profile: meets.map(m => m.profile._id),
      service: request.service._id,
    })
    .select('catchphrase profile')
    .populate('labels')
    .lean()

  const { estimatedMeetCount, timeToFirstMeet } = await getMeetEstimation(request.service.id)
  request = request.toObject()
  request.meets = meets.map(m => m.toObject()).map(m => {
    m.profile.deactivate = m.pro.deactivate
    m.proService = proServices.find(p => p.profile._id.toString() === m.profile._id.toString())
    return m
  })
  request.estimatedMeetCount = estimatedMeetCount
  request.timeToFirstMeet = timeToFirstMeet

  res.json(request)
}

async function showForPro(req, res) {
  // 応募済み
  const meet = await Meet
    .findOne({ request: req.params.id, pro: req.user.id })
    .select('status archive review chatStatus')
    .populate({
      path: 'request',
      select: 'status deleted',
    })
  if (meet) return res.status(302).json({meet})

  let request = await Request
    .findOne({_id: req.params.id, sent: {$in: req.user.profiles}})
    .populate({
      path: 'customer',
      select: 'lastname imageUpdatedAt deactivate',
    })
    .populate({
      path: 'service',
      select: 'name providerName needMoreInfo tags matchMoreEditable allowsTravelFee',
      populate: {
        path: 'queries',
      },
      options: {lean: true},
    })
    .populate({
      path: 'meets',
      options: {lean: true},
    })

  if (!request) {
    // requestは存在するが異なるユーザー
    if (await Request.countDocuments({_id: req.params.id})) {
      return res.status(403).json({message: 'user mismatch'})
    }
    return res.status(404).json({message: 'not found'})
  }

  const profile = await Profile.findOne({
    pro: req.user.id,
    _id: { $in: request.sent },
  })

  if (profile === null) return res.status(404).json({message: 'not found'})

  // hide phone number
  request.phone = request.phone ? '応募後に表示されます' : 'なし'

  injectDescriptionIntoQueries(request.description, request.service.queries)
  if (request.matchParams && request.matchParams.showExactMatch) {
    const proService = await ProService.findOne({
      profile: profile._id,
      service: request.service._id,
    })

    request.isExactMatch = instant.isExactMatch(request.service.queries, proService)
  }

  request = request.toJSON()
  request.profile = profile.id
  request.pass = request.passed.map(p => p.profile.toString()).indexOf(profile.id) !== -1


  if (moment().isSameOrAfter(rolloutDates.enableMatchMoreCampaign)
    && moment().isSameOrBefore(rolloutDates.disableMatchMoreCampaign)
    && request.service.tags[0] === '車検・修理'
    && request.service.matchMoreEditable
  ) {
    const ps = await ProService.findOne({user: req.user._id, service: request.service._id})
      .populate({
        path: 'user',
        select: 'hasActiveCard isMatchMore schedule',
      })
      .select('setupLocation setupJobRequirements setupPriceValues')
      .lean({virtuals: true})

    request.isMatchMoreCampaignTarget = instant.isMatchMoreProService({proService: ps, user: ps.user})
      && ps.setupPriceValues
      && req.user.hasActiveCard
  }

  // discount for newbie
  if (request.point) {
    const [meetsCount, hiredCount] = await Promise.all([
      Meet.countDocuments({
        pro: req.user.id,
        proResponseStatus: {$nin: ['inReview', 'tbd', 'decline']},
      }),
      Meet.countDocuments({
        hiredAt: {$lt: request.createdAt},
        pro: req.user.id,
      }),
    ])

    request.basePoint = request.point
    const result = await discountPoint({
      meetsCount,
      hiredCount,
      point: request.point,
      // for MatchMore campaign
      proId: req.user._id,
      serviceId: request.service._id,
      requestCreatedAt: request.createdAt,
    })
    request.point = result.point
    request.discounts = result.discounts
    request.isNewbie = meetsCount === 0
  }

  // calculate price
  const proService = await ProService.findOne({
    service: request.service._id,
    user: req.user._id,
    // this comment out is a support for when user move service to other profile
    // profile: profile._id,
  }).populate({
    path: 'service',
    select: 'singleBasePriceQuery estimatePriceType queries',
    populate: {
      path: 'queries',
      select: 'options usedForPro priceFactorType',
    },
  }).lean()

  request.priceValueResult = calculatePrice({
    priceValues: filterPriceValuesWithJobRequirements(
      proService.priceValues,
      filterValidJobRequirements(proService.jobRequirements, proService.service.queries),
      proService.service.queries
    ),
    proService,
    service: request.service,
    description: request.service.queries.filter(q => q.priceFactorType),
    distance: getDistance(request.loc, proService.loc) * 1000,
  })

  res.json(request)

  BigQueryInsert(req, {
    event_type: 'request_view',
    event: JSON.stringify({ service_id: request.service._id, request_id: request.id }),
  })
}

async function showForLead(req, res) {
  const request = await Request
    .findOne({_id: req.params.id})
    .populate({
      path: 'customer',
      select: 'lastname deactivate',
    })
    .populate({
      path: 'service',
      select: 'name providerName tags',
    })

  if (request === null) return res.status(404).json({message: 'not found'})

  // hide phone number
  request.phone = request.phone ? '応募後に表示されます' : 'なし'
  // hide name
  request.customer.lastname = '[登録後に表示]'

  res.json(request)
}

async function update(req, res) {
  const request = await Request
    .findOne({_id: req.params.id, customer: req.user.id})
    .populate('meets')
  if (request === null) return res.status(404).json({message: 'not found'})

  if (request.status !== 'suspend' && req.body.status === 'suspend') {
    BigQueryInsert(req, {
      event_type: 'request_cancel',
      event: JSON.stringify({ service_id: request.service.toString(), request_id: request.id }),
    })
  }

  const $set: any = {
    status: req.body.status || request.status,
    showReason: req.body.showReason || request.showReason,
    suspendReason: req.body.suspendReason || request.suspendReason,
  }

  if (!request.phone && req.body.phone) {
    request.phone = $set.phone = req.body.phone.replace(/\-/g, '')

    // フラグの更新
    const interview = request.interview
    // デタラメな電話番号
    const blacklists = await BlackList.find({enabled: true, target: 'phone'})
    for (const blacklist of blacklists) {
      const regexp = matchers[blacklist.type](blacklist.text)
      if (regexp.test(req.body.phone)) {
        interview.push('phone')
      }
    }
    if (!interview.includes('phone')) {
      const user = await User.findById(req.user.id)
      // ユーザの電話番号が空の場合は登録
      if (user && !user.phone) {
        await User.findByIdAndUpdate(req.user.id, {$set: {phone: $set.phone}})
      }
    }
    // 高額案件はhighPriceフラグをつける
    if (request.price && request.price.avg > PRICE_THRESHOLD) {
      interview.push('highPrice')
    }
    $set.interview = Array.from(new Set(interview))

    // 電話番号追加でポイント増
    if (request.sent.length === 0) {
      const service = await Service.findOne({_id: request.service})
        .select('basePoint priceValues singleBasePriceQuery pricesToPoints allowsTravelFee')
        .populate('queries')

      if (request.loc) {
        request.nearbyPros = $set.nearbyPros = await request.calcNearbyPros()
      }

      if (request.usePriceValueBudget) {
        injectDescriptionIntoQueries(request.description, service.queries)
        request.priceValueResult = calculatePrice({
          priceValues: service.priceValues,
          description: service.queries.filter(q => q.priceFactorType),
          service,
          distance: 0,
          proService: {},
        })
        request.priceModels.push('instant')
        request.pricesToPoints = service.pricesToPoints
      }

      const { priceResults } = await request.calcPoint(service.basePoint, service.queries)

      $set.point = getPriceResultForRequest(priceResults, request).value
      $set.pt = await request.calcProbability()

      BigQueryInsert(req, {
        event_type: 'price_result_update',
        event: JSON.stringify({
          service_id: service.id,
          request_id: request.id,
          ...priceResultsToMap(priceResults),
        }),
      })
    }
  }

  const updated = await Request.findByIdAndUpdate(request.id, {$set})

  await show(req, res)
  // CSのタスク処理
  await handleCSTaskInterview({request: updated})
}

async function overwrite(req, res) {
  const request = await Request
    .findOne({
      _id: req.params.id,
      customer: req.user.id,
    })
  if (request === null) return res.status(404).json({message: 'not found'})

  const relate = await relateRequest(request)
  if (relate) {
    relate.deleted = true
    relate.status = 'suspend'
    relate.suspendReason = '重複による削除'
    relate.editLog.push(await relate.createEditLog({
      user: req.user.id,
      editType: 'status',
      before: 'open',
      after: relate.status,
      description: relate.suspendReason,
    }))
    await relate.save()

    // 見積もり済みのプロにrefundする
    for (const m of relate.meets) {
      const meet = await Meet.findById(m)
      if (meet === null || meet.refund) continue

      await refundPoint(meet.id)
      const pro = await User.findOne({_id: meet.pro})
      emailDeleteRequestPro({
        user: pro,
        customer: req.user,
      })
    }
  }
  const before = request.interview.join(',') || 'none'
  let interview = request.interview.filter(i => i !== 'duplicate')
  interview = Array.from(new Set(interview))
  const editLog = request.editLog
  editLog.push(await request.createEditLog({
    user: req.user.id,
    editType: 'interview',
    before,
    after: interview.join(',') || 'none',
  }))
  const updated = await Request.findByIdAndUpdate(request.id, {$set: {interview, editLog}})

  res.json({})
  await handleCSTaskInterview({request: updated})
}

async function pass(req, res) {
  let request = await Request
    .findOne({_id: req.params.id})
    .populate({path: 'pendingMeets', select: 'profile'})
  if (request === null) return res.status(404).json({message: 'not found'})

  // マッチング済みプロか判定
  const matched = [...request.sent.map(s => s.toString()), ...request.pendingMeets.map(pm => pm.profile.toString())]
  if (!matched.includes(req.body.profile)) {
    return res.status(404).json({message: 'not found'})
  }

  const passed = request.passed || []
  if (passed.map(p => p.profile.toString()).includes(req.body.profile)) {
    // すでにパス済み
    return res.json()
  }

  request = await Request.findByIdAndUpdate(request.id, {$addToSet: {passed: req.body}})

  BigQueryInsert(req, {
    event_type: 'request_pass',
    event: JSON.stringify({ service_id: request.service.toString(), request_id: request.id }),
  })

  return res.json()
}

async function signedUrl(req, res) {
  const id = new ObjectID()
  const key = `requests/${id}.${req.query.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
  const imageUrl = `${config.get('bucketOrigin')}/${key}?`
  res.json({signedUrl, key, imageUrl})
}

async function indexForAdmin(req, res) {
  const cond: any = {}

  const conditions = req.body
  let unread
  for (const c of conditions) {
    if (c.name === 'createdAt') {
      cond.createdAt = {
        $gte: moment(c.data[0] || undefined).startOf('day').toDate(),
        $lte: moment(c.data[1] || undefined).endOf('day').toDate(),
      }
    } else if (c.name === 'meets') {
      if (c.data[0] && parseInt(c.data[0]) > 0) {
        cond[`meets.${parseInt(c.data[0]) - 1}`] = {$exists: true} // meets.length >= c.data[0]
      }
      if (c.data[1] && parseInt(c.data[1]) > 0) {
        cond[`meets.${parseInt(c.data[1])}`] = {$exists: false} // meets.length <= c.data[0]
      }
    } else if (c.name === 'category') {
      cond.category = {$in: c.data}
    } else if (c.name === 'service') {
      cond.service = {$in: c.data}
    } else if (c.name === 'point') {
      cond.point = {}
      if (c.data[0]) cond.point.$gte = c.data[0]
      if (c.data[1]) cond.point.$lte = c.data[1]
      if (Object.keys(cond.point).length === 0) delete cond.point
    } else if (c.name === 'price') {
      if (c.data[0]) cond['price.max'] = {$gte: c.data[0]}
      if (c.data[1]) cond['price.min'] = {$lte: c.data[1]}
    } else if (c.name === 'address') {
      cond.address = {$regex: regexpEscaper(c.data[0])}
    } else if (c.name === 'interview') {
      if (c.data.includes('any')) {
        cond['interview.0'] = {$exists: true}
      } else {
        cond.interview = {$in: c.data.map(d => c.items.find(i => i.name === d).name)}
      }
    } else if (c.name === 'date') {
      // answersから取得 or limitDate
    } else if (c.name === 'status') {
      cond.$or = cond.$or || []
      if (c.data.includes('open')) {
        cond.$or.push({
          status: 'open',
          createdAt: { $gt: moment().subtract(4, 'days').toDate()},
        })
      }
      if (c.data.includes('expired')) {
        cond.$or.push({
          status: 'open',
          createdAt: { $lt: moment().subtract(4, 'days').toDate()},
        })
      }
      if (c.data.includes('deleted')) {
        cond.$or.push({deleted: true})
      }
      if (c.data.includes('close')) {
        cond.$or.push({status: 'close'}, {additionalStatus: 'hired'})
      }
      if (c.data.includes('suspend')) {
        cond.$or.push({
          status: 'suspend',
          deleted: { $ne: true },
        })
      }
      if (cond.$or.length === 0) {
        delete cond.$or
      }
    } else if (c.name === 'option') {
      if (c.data.includes('picture')) {
        cond['description.answers.image'] = /\/img\/requests\//
      }
      if (c.data.includes(MeetStatusType.UNREAD)) {
        unread = true
      }
      if (c.data.includes(MeetStatusType.HAS_PHONE_NUM)) {
        cond.phone = /^.{1,}$/
      }
    }
  }

  if (req.query.user) {
    cond.customer = req.query.user
  }

  let requests = await Request
    .find(cond)
    .lean()
    .select('status additionalStatus supportStatus address point deleted interview createdAt phone limitDate stack flowType')
    .sort({createdAt: -1})
    .populate({
      path: 'service',
      select: 'name tags',
      options: {lean: true},
    })
    .populate({
      path: 'customer',
      select: 'lastname firstname corporation email requestDeactivate',
      options: {lean: true},
    })
    .populate({
      path: 'meets',
      select: 'profile status hiredAt point chats chatStatus createdAt read',
      populate: {
        path: 'profile',
        model: 'Profile',
        select: 'name',
      },
    })
    .limit(10000)

  for (const r of requests) {
    r.queryParams = getQueryParams(r)
  }

  if (unread) {
    requests = requests.filter(r =>
      r.meets.length && !r.meets.some(m => m.read)
    )
  }

  res.json(requests)
}

async function updateForAdmin(req, res) {
  const request = await Request.findOne({_id: req.params.id})
    .populate('service')
    .populate('meets')
    .populate('pendingMeets')
  if (request === null) return res.status(404).json({message: 'not found'})

  if (req.body.updatedAt && !moment(req.body.updatedAt).isSame(request.updatedAt)) {
    return res.status(409).json({message: 'updatedAt mismatch'})
  }

  // 運営サスペンド
  if (req.body.deleted) {
    const user = await User.findOne({_id: request.customer})
    emailDeleteRequest({user, serviceName: request.service.name})
    for (const meet of request.meets) {
      await refundPoint(meet.id)
      const pro = await User.findOne({_id: meet.pro})
      emailDeleteRequestPro({
        user: pro,
        customer: user,
        type: 'patrol',
      })
    }
  }

  // additionalStatus更新
  if (req.body.meet) {
    await Meet.update({request: req.params.id}, {$set: {additionalStatus: ''}, $unset: {hiredAt: true}}, {multi: true})
    if (/^[0-9a-fA-F]{24}$/.test(req.body.meet)) await Meet.update({_id: req.body.meet}, {additionalStatus: 'hired', hiredAt: new Date()})
    delete req.body.meet
  }

  // editLog追加
  if (req.body.editLog) {
    const newLogs = await Promise.all(req.body.editLog.map(l => {
      l.user = req.user.id
      return request.createEditLog(l).then(log => log._id)
    }))
    req.body.editLog = request.editLog.concat(newLogs)
  }

  if (req.body.phone) {
    req.body.phone = req.body.phone.replace(/\-/g, '')
  }
  if (req.body.interview) {
    req.body.interview = Array.from(new Set(req.body.interview))
  }
  const updated = await Request.findByIdAndUpdate(request.id, {$set: req.body})

  // if request no longer has interview blockers, release
  // any user-initiated meets the request has
  if ((!updated.interview || !updated.interview.length)) {
    const inReviewMeets = [...request.meets, ...request.pendingMeets].filter(m => m.proResponseStatus === 'inReview')

    for (const m of inReviewMeets) {
      await meetsLib.release({ meetId: m._id })
    }
  }

  await showForAdmin(req, res)
  await handleCSTaskInterview({request: updated})
}


async function showForAdmin(req, res) {
  const request = await Request
    .findOne({_id: req.params.id})
    .lean({virtuals: true})
    .populate({
      path: 'sent',
      select: 'name pro',
    })
    .populate({
      path: 'customer',
    })
    .populate({
      path: 'service',
      select: 'name',
    })
    .populate({
      path: 'meets',
      select: 'status additionalStatus profile read chats proResponseStatus displayPhone',
      populate: [
        {
          path: 'profile',
          model: 'Profile',
          select: 'name loc',
        },
        {
          path: 'chats',
          model: 'Chat',
          select: 'user createdAt',
        },
      ],
    })
    .populate({
      path: 'pendingMeets',
      select: 'status additionalStatus profile read chats proResponseStatus',
      populate: [
        {
          path: 'profile',
          model: 'Profile',
          select: 'name loc',
        },
        {
          path: 'chats',
          model: 'Chat',
          select: 'user createdAt',
        },
      ],
    })
    .populate({
      path: 'specialSent',
      select: 'name',
    })
    .populate({
      path: 'editLog',
      populate: {
        path: 'user',
        select: 'lastname firstname',
      },
    })

  if (request === null) return res.status(404).json({message: 'not found'})

  request.queryParams = getQueryParams(request)

  const excludedProfiles = await MatchExclusive.find({request: request._id}).select('profile').populate({path: 'profile', select: 'name'})
  request.excluded = excludedProfiles.map(ex => ex.profile)

  try {
    // intercomから情報を取得
    const intercomInfo = await intercom.users.find({user_id: request.customer.id}).then(res => res.body)
    request.locationData = intercomInfo.location_data
  } catch (e) {
    // empty
  }

  const contacts = await Contact.find({ request: request }).lean()

  const sentUserIds = request.sent.map(s => s.pro)
  const sentProStats = await ProStat.find({pro: {$in: sentUserIds}, meetsCount: 0}).select('pro')
  const beginnerSentIds = sentProStats.map(s => s.pro.toString())
  request.sent = request.sent.map(s => {
    const contact = contacts.find(c => compObjRefs(c.profile, s))

    return {
      ...s,
      isBeginner: beginnerSentIds.includes(s.pro.toString()),
      isExactMatch: contact && contact.isExactMatch,
      matchingBucket: contact && contact.matchingBucket,
    }
  })

  request.sentLead = await MailLog.countDocuments({
    template: /^emailNewRequestForLead/,
    request: req.params.id,
  })

  request.meets.forEach(m => {
    setMatchingBucketOnMeet(m, contacts)
  })
  request.pendingMeets.forEach(m => {
    setMatchingBucketOnMeet(m, contacts)
  })

  if (
    request.status === 'open' && request.meets.length < 5 &&
    moment().subtract({days: 3, hours: 12}).isBefore(request.createdAt)
  ) {
    const tmp = await Request
      .findOne({_id: request._id})
      .lean({virtuals: true})
      .populate({
        path: 'sent',
        select: 'pro',
      })
      .populate({
        path: 'meets',
        select: 'pro',
      })
      .populate({
        path: 'pendingMeets',
        select: 'pro',
      })
      .populate({
        path: 'service',
        populate: { path: 'queries' },
      })
    request.willSend = await findMatchingProsForRequest({ request: tmp })

    const willSendUserIds = request.willSend.map(ws => ws.pro)
    const willSendProStats = await ProStat.find({pro: {$in: willSendUserIds}, meetsCount: 0}).select('pro')
    const beginnerWillSendIds = willSendProStats.map(s => s.pro.toString())

    request.willSend = request.willSend.map(s => ({...s, isBeginner: beginnerWillSendIds.includes(s.pro.toString())}))
  }
  res.json(request)
}

function setMatchingBucketOnMeet(m, contacts) {
  const contact = contacts.find(c => compObjRefs(c.profile, m.profile))

  if (contact) {
    // we don't yet set exact match on meet when creating, so need to fetch
    // from contact
    m.isExactMatch = contact.isExactMatch
    m.matchingBucket = contact.matchingBucket
  }
}

async function resendForAdmin(req, res) {
  const request = await Request
    .findOne({_id: req.params.id})
    .populate({
      path: 'sent',
      select: 'pro',
      populate: {
        path: 'pro',
        model: 'User',
      },
    })
    .populate({
      path: 'meets',
      select: 'pro',
      populate: {
        path: 'pro',
        model: 'User',
      },
    })
    .populate({
      path: 'service',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    })
  if (request === null) return res.status(404).json({message: 'not found'})

  await Request.findByIdAndUpdate(request.id, {$set: {passed: []}})


  await showForAdmin(req, res)

  // 未送信のプロ
  emailUpdateRequest({
    users: request.sent.map(s => s.pro),
    lastname: request.customer.lastname,
    request,
  })

  // 応募済のプロ
  for (const meet of request.meets) {
    emailUpdateRequest({
      users: [meet.pro],
      lastname: request.customer.lastname,
      request,
      meet,
    })
  }
}

async function excludeProForAdmin(req, res) {
  const [ request, profile ] = await Promise.all([
    Request.findOne({
      _id: req.params.id,
      sent: { $ne: req.body.profile },
    }),
    Profile.findOne({_id: req.body.profile}),
  ])
  if (request === null || profile === null) {
    return res.status(400).json({
      message: 'すでにマッチ済みのプロです',
    })
  }
  if (await MatchExclusive.countDocuments({request: request._id, profile})) {
    return res.status(400).json({
      message: 'すでに除外されているプロです',
    })
  }
  await MatchExclusive.create({
    request: request._id,
    profile,
  })

  await showForAdmin(req, res)
}

async function matchProForAdmin(req, res) {
  const [ request, profile ] = await Promise.all([
    Request.findOne({
      _id: req.params.id,
      sent: { $ne: req.body.profile },
    })
    .populate('customer')
    .populate({
      path: 'service',
      populate: {
        path: 'queries',
        options: {lean: true},
      },
    }),
    Profile.findOne({_id: req.body.profile})
    .populate('pro'),
  ])
  if (request === null || profile === null) {
    return res.status(400).json({
      message: 'すでにマッチ済みのプロです',
    })
  }
  if (await MatchExclusive.countDocuments({request: request._id, profile})) {
    return res.status(400).json({
      message: 'すでに除外されているプロです',
    })
  }

  const proService = await ProService.findOne({
    profile: profile._id,
    service: request.service._id,
  }).select('_id jobRequirements')

  if (proService === null) {
    return res.status(400).json({
      message: 'このプロは依頼のサービスを登録していません',
    })
  }

  let exactMatch

  if (request.matchParams.showExactMatch) {
    const queries = cloneDeep(request.service.queries)
    injectDescriptionIntoQueries(request.description, queries)
    exactMatch = instant.isExactMatch(queries, proService)
  }

  await Contact.createIfNotExists({
    request: request._id,
    proService: proService._id,
    profile,
    isExactMatch: exactMatch,
    matchingBucket: matchingBuckets.MATCHED_BY_ADMIN,
  })

  await Request.findByIdAndUpdate(request.id, {$addToSet: {sent: profile.id}})

  emailNewRequest({
    profiles: [{
      pro: profile.pro,
      isExactMatch: exactMatch,
    }],
    lastname: request.customer.lastname,
    request,
    service: request.service,
  })

  await showForAdmin(req, res)
}

/*
 * 同ユーザーの過去の類似依頼を探す
 */
async function relateRequest(request) {
  const services = await Service
    .find({
      tags: request.category,
      enabled: true,
    })
    .select('id')

  const relate = await Request
    .findOne({
      _id: {$ne: request.id},
      customer: request.customer,
      status: 'open',
      service: {$in: services.map(s => s.id)},
      createdAt: {$gt: moment().subtract(7, 'days').toDate()},
    })
    .sort({createdAt: -1})

  return relate
}

/*
 * 直近の依頼（訴求用）
 */
async function recent(req, res) {

  const days = 7
  const fromDay = moment().subtract(days, 'day')
  const requests = await Request
    .find({
      service: req.query.service,
      createdAt: {$gte: fromDay.toDate()},
      address: {$exists: true},
    })
    .select('customer service prefecture city createdAt')
    .sort('createdAt')
    .limit(req.query.limit || 100)
    .populate({
      path: 'service',
      select: 'name key',
    })
    .lean()

  const results = []
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]
    let interval = 0
    // 表示インターバルの計算(days倍速する)
    if (i > 0) {
      const createdAtFromDay = moment(fromDay).diff(requests[i].createdAt, 'seconds')
      const prevCreatedAtFromDay = moment(fromDay).diff(requests[i - 1].createdAt, 'seconds')
      interval = Math.floor(Math.abs(createdAtFromDay - prevCreatedAtFromDay)) / days
    }
    results.push({
      key: request.service.key,
      prefecture: request.prefecture,
      city: request.city,
      serviceName: request.service.name,
      interval})
  }

  return res.json(results)
}
