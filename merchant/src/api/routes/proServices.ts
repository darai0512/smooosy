export {}
const { ObjectID } = require('mongodb')
const { ProService, Service, Meet, Schedule, Request, Profile, Review, RuntimeConfig } = require('../models')
const { BigQueryInsert } = require('../routes/bigquery')
import instant from '../lib/matching/instant'
const { compObjRefs, arrayIntersection } = require('../lib/util')
const { meetPushable } = require('../lib/requests')
const userVirtuals = require('../lib/virtuals/user')
const mediaVirtuals = require('../lib/virtuals/media')
const { getDistance } = require('../lib/geospatial')
const { getBestReview } = require('../lib/review')
const { getMeetEstimation } = require('../lib/estimate')
const proServiceLib = require('../lib/proService')
const { injectDescriptionIntoQueries } = require('../lib/matching/common')
const moment = require('moment')
const { BQEventTypes } = require('@smooosy/config')

module.exports = {
  indexForPro,
  showForPro,
  updateForPro,
  updateAllForPro,
  updateManyForPro,
  show,
  search,
  searchWithRequest,
  generateJobRequirements,
  appendInfoToProService,
  // admin
  showForAdmin,
  updateForAdmin,
  // export for testing
  fetchSpentPoints,
  getRestPointInWeek,
  filterValidPriceValues,
  calculatePrice,
  getPriceForAnswers,
}

const selectService = 'id key name queries loc zipcode address prefecture distance budgetMin budgetMax matchMoreEditable showJobRequirements estimatePriceType providerName averagePoint manualAveragePoint singleBasePriceQuery allowsTravelFee tags'
const selectServiceAdmin = 'useConditionalMatching'
const selectProfile = 'id name services'
const selectQuery = 'type subType usedForPro priceFactorType options summary'

async function indexForPro(req, res) {
  const serviceIds = await ProService.find({user: req.user._id, disabled: {$ne: true}}).distinct('service')
  let [proServices, reqCounts] = await Promise.all([
    ProService.find({
      user: req.user.id,
      disabled: {$ne: true},
    })
    .populate({
      path: 'service',
      select: selectService,
      populate: {
        path: 'queries',
      },
    })
    .populate({
      path: 'profile',
      select: selectProfile,
    }),
    Request.aggregate()
      .match({
        service: {$in: serviceIds},
        createdAt: {$gt: moment().subtract(1, 'month').toDate()},
      })
      .group({
        _id: '$service',
        count: {$sum: 1},
      })
      .sort({
        count: -1,
      }),
  ])

  if (req.query.onlyMatchMore) {
    proServices = proServices.filter(ps => ps.service.matchMoreEditable)
  }

  // iso week starts from Monday
  const startOfIsoWeek = moment().startOf('isoWeek')
  const thisWeek = [
    startOfIsoWeek.toDate(),
    startOfIsoWeek.clone().add(1, 'week').toDate(),
  ]

  const runtimeConfigs = await RuntimeConfig.getMatchingConfigs({ services: proServices.map(ps => ps.service._id) })
  for (const key in proServices) {
    const spent = await fetchSpentPoints({
      userId: proServices[key].user,
      serviceId: proServices[key].service.id,
      range: thisWeek,
    })
    proServices[key] = proServices[key].toObject()
    proServices[key].spent = spent
    proServices[key].jobRequirements = generateJobRequirements(
      proServices[key].service.queries,
      proServices[key].jobRequirements
    )
    proServices[key].priceValues = filterValidPriceValues(proServices[key].priceValues, proServices[key].service.queries)
    proServices[key].reqCount = (reqCounts.find(r => r._id.equals(proServices[key].service._id)) || {count: 0}).count
    proServices[key].isMatchMore = instant.isMatchMoreProService({proService: proServices[key], user: req.user})

    proServices[key].priceValuesEnabled = proServiceLib.priceValuesEnabled(proServices[key].service, runtimeConfigs)
  }
  res.json(proServices)
}

async function showForPro(req, res) {
  let proService = await ProService.findOne({
    user: req.user.id,
    service: req.params.serviceId,
  })
  .populate({
    path: 'service',
    select: selectService,
    populate: {
      path: 'queries',
    },
  })
  .populate({
    path: 'profile',
    select: selectProfile,
  })
  .populate({
    path: 'media',
    options: {
      lean: true,
    },
  })
  if (!proService) return res.status(404).json({message: 'not found'})

  proService = proService.toObject()

  // generate job requirements from service's queries
  // and fill in with pro's existing answers
  proService.jobRequirements = generateJobRequirements(
    proService.service.queries,
    proService.jobRequirements
  )

  proService.priceValues = filterValidPriceValues(proService.priceValues, proService.service.queries)
  proService.isMatchMore = instant.isMatchMoreProService({proService, user: req.user})

  const rcs = await RuntimeConfig.getMatchingConfigs({ services: [proService.service._id] })
  proService.priceValuesEnabled = proServiceLib.priceValuesEnabled(proService.service, rcs)

  res.json(proService)
}

async function updateManyForPro(req, res) {
  for (const serviceId in req.body) {
    await updateProService(serviceId, req.user._id, req.body[serviceId], req)
  }
  indexForPro(req, res)
}

async function updateForPro(req, res) {
  await updateProService(req.params.serviceId, req.user._id, req.body, req)

  await showForPro(req, res)
}

// use for not setup
async function updateAllForPro(req, res) {
  const { type } = req.params
  const { sameAs } = req.body
  const proService = await ProService.findById(sameAs).select('profile loc distance prefecture city zipcode address')
  if (!proService) return res.status(404).json({message: 'not found'})
  if (type === 'location') {
    await ProService.updateLocations({
      userId: req.user._id,
      profileId: proService.profile._id,
      origin: proService.loc,
      distance: proService.distance,
      prefecture: proService.prefecture,
      city: proService.city,
      zipcode: proService.zipcode,
      address: proService.address,
    })
    await Profile.findByIdAndUpdate(proService.profile._id, {$set: {
      loc: proService.loc,
      distance: proService.distance,
      prefecture: proService.prefecture,
      city: proService.city,
      zipcode: proService.zipcode,
      address: proService.address,
    }})
  }
  res.json({})
}


function generateJobRequirements(serviceQueries, jobRequirements) {
  return serviceQueries.filter(q => q.usedForPro).map(query => {
    const options = query.options.filter(o => o.usedForPro)
    const jobRequirement = jobRequirements.find(
      jr => compObjRefs(jr.query, query)
    )

    let answers
    if (jobRequirement && jobRequirement.answers) {
      // only include options that are in answers
      answers = options.filter(o => jobRequirement.answers.some(a => compObjRefs(a, o)))
    } else {
      // show all options if there's no setup yet
      answers = options
    }

    return {
      query: {
        ...query,
        // all pro queries are multiple choice queries
        type: 'multiple',
        options,
      },
      answers,
    }
  })
}

async function show(req, res) {
  const { serviceId, profileId } = req.params
  const { location, conditions, requestId } = req.body

  let proService = await ProService.findOne({profile: profileId, service: serviceId})
    .populate({
      path: 'service',
      select: 'name queries distance estimatePriceType maxPointCost singleBasePriceQuery matchMoreEnabled',
      populate: {
        path: 'queries',
        select: selectQuery,
      },
    })
    .populate({path: 'user', select: 'isMatchMore schedule imageUpdatedAt'})
    .populate({path: 'profile', select: 'loc'})

  if (!proService) {
    return res.status(404).json({ message: 'not found' })
  }

  proService = proService.toObject()
  const way = getDistance(location, proService.profile.loc) * 1000

  for (const q of proService.service.queries) {
    const checked = conditions[q._id]
    for (const o of q.options) {
      if (checked && checked[o._id]) {
        o.checked = true
        const val = checked[o._id]
        if (val && /^[0-9]+$/.test(val)) o.number = parseInt(val)
      } else if (q.type === 'number' && o.defaultNumber) {
        o.checked = true
        o.number = o.defaultNumber
      }
    }
  }

  if (proService.priceValues.length) {
    proService.price = calculatePrice({
      priceValues: proService.priceValues,
      proService: proService,
      service: proService.service,
      description: proService.service.queries.filter(q => q.priceFactorType),
      distance: way,
    })
  }

  proService.user.image = userVirtuals.image(proService.user)
  proService.user.setupBusinessHour = userVirtuals.setupBusinessHour(proService.user)
  proService.isMatchMore = instant.isMatchMoreProService({proService, user: proService.user})

  // remove unuse
  const keysToRemove = [
    'budget', 'jobRequirements', 'priceValues', 'setupLocation', 'setupJobRequirements',
    'setupPriceValues', 'setupBudget', 'isPromoted',
  ]
  for (const key of keysToRemove) {
    delete proService[key]
  }

  if (requestId && req.user) {
    const request = await Request
      .findOne({
        _id: requestId,
        customer: req.user.id,
      })
      .select('service meets description loc address status createdAt passed specialSent interview')
      .populate({
        path: 'meets',
        select: 'pro profile isCreatedByUser proResponseStatus price priceType priceValues',
      })
      .populate({
        path: 'pendingMeets',
        select: 'pro profile isCreatedByUser proResponseStatus price priceType priceValues',
      })
      .lean()

    if (!request) {
      return res.status(404).json({ message: 'not found' })
    }

    request.meets = request.meets || []
    request.pendingMeets = request.pendingMeets || []
    proService.request = request
  }

  res.json(proService)
}

// Called when user makes a new search - run the search they sent
// and return the matches
// URL template: POST /api/instant-results
// body: { service: XX, location=[GeoJSON], conditions=XX }
async function search(req, res) {
  const { serviceId, location, conditions = {}, zip } = req.body

  const s = await Service
    .findById(serviceId)
    .select('name queries distance estimatePriceType maxPointCost singleBasePriceQuery allowsTravelFee')
    .populate({
      path: 'queries',
      select: selectQuery,
    })
    .lean()

  if (!s) {
    return res.status(404).json({ message: 'service not found' })
  }

  for (const q of s.queries) {
    const checked = conditions[q._id]
    for (const o of q.options) {
      if (checked && checked[o._id]) {
        o.checked = true
        const val = checked[o._id]
        if (val && /^[0-9]+$/.test(val)) o.number = parseInt(val)
      } else if (q.type === 'number' && o.defaultNumber) {
        o.checked = true
        o.number = o.defaultNumber
      }
    }
  }

  const matchingProServices = await instant.findMatchingProServicesForQuery({
    service: s,
    location,
    description: s.queries,
  })

  const proServices = await appendInfoToProService(matchingProServices, s)

  InsertIRPSearchLog(
    req,
    BQEventTypes.match_more.IRP_SEARCH,
    {service: s, proServices, zip} as any
  )

  res.json(proServices)
}

async function searchWithRequest(req, res) {
  const request = await Request
    .findOne({
      _id: req.params.id,
      customer: req.user.id,
    })
    // prefecture and city is needed for bigquery
    .select('service meets description loc address status createdAt passed specialSent interview prefecture city')
    .populate({
      path: 'meets',
      select: 'pro profile isCreatedByUser proResponseStatus price priceType priceValues',
    })
    .populate({
      path: 'pendingMeets',
      select: 'pro profile isCreatedByUser proResponseStatus price priceType priceValues',
    })
    .lean()

  if (!request) {
    return res.status(404).json({ message: 'not found' })
  }

  request.meets = request.meets || []
  request.pendingMeets = request.pendingMeets || []
  const pushable = await meetPushable(request)
  if (
    !pushable || // already has 5 potential meets
    request.status !== 'open' || // already closed
    moment().subtract({days: 4}).isAfter(request.createdAt) // already expired
  ) {
    return res.status(409).json({message: 'five meets already'})
  }

  const allMeets = [...request.meets, ...request.pendingMeets]
  const [service, matchedProServices] = await Promise.all([
    Service
    .findById(request.service)
    .select('name queries distance estimatePriceType maxPointCost singleBasePriceQuery')
    .populate({
      path: 'queries',
      select: selectQuery,
    })
    .lean(),
    ProService
    .find({
      user: { $in: allMeets.map(m => m.pro) },
      service: request.service,
    })
    .select('service jobRequirements address distance budget priceValues message setupLocation setupJobRequirements setupPriceValues setupBudget isPromoted chargesTravelFee media')
    .populate({
      path: 'profile',
      select: 'name address description media reviewCount averageRating experience',
      populate: {
        path: 'media',
      },
    })
    .populate({
      path: 'user',
      select: 'lastname imageUpdatedAt schedule lastAccessedAt isMatchMore isInArrears hasActiveCard',
    })
    .lean(),
  ])

  const matchedProServiceIds = []
  for (const ps of matchedProServices) {
    matchedProServiceIds.push(ps.profile._id)
    ps.existingMeet = allMeets.find(m => m.pro.toString() === ps.user._id.toString())
    if (ps.existingMeet) ps.tag = ps.existingMeet.isCreatedByUser ? 'userMeet' : 'proMeet'
  }

  injectDescriptionIntoQueries(request.description, service.queries)

  const matchingProServices = await instant.findMatchingProServicesForQuery({
    service: service,
    location: request.loc,
    description: service.queries,
    excludeProfiles: Array.from(new Set([...matchedProServiceIds, ...request.passed.map(p => p.profile)])),
  })

  const proServices = await appendInfoToProService(
    [...matchedProServices, ...matchingProServices],
    service
  )

  const { estimatedMeetCount, timeToFirstMeet } = await getMeetEstimation(request.service.id)
  request.estimatedMeetCount = estimatedMeetCount
  request.timeToFirstMeet = timeToFirstMeet

  InsertIRPSearchLog(
    req,
    BQEventTypes.match_more.IRP_SEARCH_WITH_REQUEST,
    {service, proServices, zip: request.address, prefecture: request.prefecture, city: request.city}
  )

  res.json({ proServices, request })
}

function InsertIRPSearchLog(req, event_type, {service, proServices, zip, prefecture, city}) {
  try {
    const cond = service.queries
    .filter(q => q.options.some(o => o.checked))
    .map(q => {
      q.options = q.options.filter(o => o.checked)
      delete q.answers
      return q
    })

    BigQueryInsert(req, {
      event_type,
      event: JSON.stringify({
        serviceId: service._id,
        zip,
        prefecture,
        city,
        conditions: cond,
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

async function appendInfoToProService(matchingProServices, service) {
  // iso week starts from Monday
  const startOfIsoWeek = moment().startOf('isoWeek')
  const thisWeek = [
    startOfIsoWeek.toDate(),
    startOfIsoWeek.clone().add(1, 'week').toDate(),
  ]

  const proServices = []
  for (const ps of matchingProServices) {
    ps.user.image = userVirtuals.image(ps.user)
    ps.user.setupBusinessHour = userVirtuals.setupBusinessHour(ps.user)

    if (ps.budget && !ps.existingMeet) {
      // filter out the pros who run out their budget
      const spent = await fetchSpentPoints({
        userId: ps.user._id,
        serviceId: ps.service,
        range: thisWeek,
      })
      if (ps.budget - spent < service.averagePoint) {
        continue
      }
    }

    // add media
    const media = []
    const concatMedia = [...ps.media, ...ps.profile.media]
    const mediaIds = new Set()
    for (const cm of concatMedia) {
      if (mediaIds.has(cm._id.toString())) continue
      mediaIds.add(cm._id.toString())
      const m: any = {}
      m.id = cm._id
      m.url = mediaVirtuals.url(cm)
      media.push(m)
    }
    ps.media = media

    // add schedules
    const schedules = await Schedule.find({
      user: ps.user._id,
      status: {$nin: ['decline', 'cancel']},
      $or: [
        {
          startTime: {
            $gte: moment().toDate(),
            $lte: moment().add({month: 4}).toDate(),
          },
        },
        { recurrence: {$exists: true} },
      ],
    })
    ps.schedules = schedules

    // add best review
    const reviews = await Review.find({profile: ps.profile._id})
      .select('text rating service username')
      .lean()
    ps.bestReview = getBestReview(reviews, {service: service._id, includeOtherService: true})

    if (ps.existingMeet) {
      if (ps.existingMeet.priceValues) {
        ps.price = ps.existingMeet.priceValues
        ps.price.estimatePriceType = service.estimatePriceType
      }
    } else if (ps.priceValues.length) {
      ps.price = calculatePrice({
        priceValues: ps.priceValues,
        proService: ps,
        service,
        description: service.queries.filter(q => q.priceFactorType),
        distance: ps.way,
      })
    }

    ps.isMatchMore = instant.isMatchMoreProService({proService: ps, user: ps.user})

    // remove unuse
    const keysToRemove = [
      'budget', 'jobRequirements', 'priceValues', 'setupLocation', 'setupJobRequirements',
      'setupPriceValues', 'setupBudget', 'isPromoted', 'way',
    ]
    for (const key of keysToRemove) {
      delete ps[key]
    }
    proServices.push(ps)
  }
  return proServices
}

async function showForAdmin(req, res) {
  const user = req.params.userId
  const service = req.params.serviceId
  let proService = await ProService.findOne({user, service})
    .populate({
      path: 'user',
      select: 'isMatchMore schedule hasActiveCard',
    })
    .populate({
      path: 'service',
      select: [selectService, selectServiceAdmin].join(' '),
      populate: {
        path: 'queries',
      },
    })
    .populate({
      path: 'profile',
      select: selectProfile,
    })

  if (!proService) return res.status(404).json('not found')

  proService = proService.toObject()

  // generate job requirements from service's queries
  // and fill in with pro's existing answers
  proService.jobRequirements = generateJobRequirements(
    proService.service.queries,
    proService.jobRequirements
  )

  // add schedules
  const schedules = await Schedule.find({
    user: proService.user._id,
    status: {$nin: ['decline', 'cancel']},
    $or: [
      {
        startTime: {
          $gte: moment().toDate(),
          $lte: moment().add({month: 4}).toDate(),
        },
      },
        { recurrence: {$exists: true} },
    ],
  })
  proService.schedules = schedules

  res.json(proService)
}

async function updateForAdmin(req, res) {
  const proService = await ProService.findById(req.params.id).lean()
  if (!proService) return res.status(404).json({message: 'not found'})
  await updateProService(proService.service._id, proService.user._id, req.body, req)
  req.params.userId = proService.user._id
  req.params.serviceId = proService.service._id
  await showForAdmin(req, res)
}

async function fetchSpentPoints({userId, serviceId, range}) {
  const data = await Meet
  .aggregate()
  .match({
    pro: ObjectID(userId),
    service: ObjectID(serviceId),
    createdAt: {
      $gte: range[0],
      $lt: range[1],
    },
    proResponseStatus: {
      $nin: ['inReview', 'tbd', 'decline'],
    },
  })
  .group({
    _id: null,
    point: { $sum: '$point' },
  })
  return (data[0] || {}).point || 0
}

async function getRestPointInWeek({userId, serviceId, budget}) {
  // iso week starts from Monday
  const startOfIsoWeek = moment().startOf('isoWeek')
  const thisWeek = [
    startOfIsoWeek.toDate(),
    startOfIsoWeek.clone().add(1, 'week').toDate(),
  ]
  // filter out the pros who run out their budget
  const spent = await fetchSpentPoints({
    userId,
    serviceId,
    range: thisWeek,
  })
  const rest = budget - spent
  return rest
}

function filterValidPriceValues(priceValues, queries) {
  // acceptable optionIds for answers of priceValues
  const optionIds = [].concat(
    ...queries.filter(q => q.priceFactorType)
    .map(q => q.options.filter(o => o.usedForPro).map(o => o._id.toString()))
  )

  const baseOptions = []
  for (const q of queries) {
    if (q.priceFactorType === 'base') {
      baseOptions.push(q.options.filter(o => o.usedForPro).map(o => o._id.toString()))
    }
  }

  return priceValues.filter(price => {
    price.value = parseInt(price.value, 10)
    if (price.value < 0) return false
    if (price.type === 'singleBase') return true
    if (!['base', 'discount', 'addon', 'travelFee'].includes(price.type)) return false
    if (price.type === 'discount' && price.value > 100) return false

    if (price.type === 'travelFee') {
      return price.requestConditions &&
        price.requestConditions.length &&
        price.requestConditions[0] &&
        price.requestConditions[0].rangeValue &&
        parseInt(price.requestConditions[0].rangeValue.lowerBound, 10) >= 0
    }

    for (const answer of price.answers) {
      if (!optionIds.includes(answer.toString())) return false
    }

    // for multiple base query
    if (price.type === 'base') {
      for (const o of baseOptions) {
        if (!arrayIntersection(o, price.answers.map(a => a.toString())).length) return false
      }
    }
    return true
  })
}

// return highest ranking match (either exact, or best partial)
function getPriceForAnswers({ answers, priceValues, exactMatch }) {
  if (priceValues.length === 0) return null

  if (exactMatch && answers.length === 0) return null

  const answerIds = answers.map(a => a._id)

  const priceValue = priceValues.sort((a, b) => {
    const matchSort = arrayIntersection(b.answers, answerIds, compObjRefs).length -
    arrayIntersection(a.answers, answerIds, compObjRefs).length

    if (matchSort) {
      return matchSort
    }

    // secondary sort - when two options with same match-level, prefer cheapest option
    return a.value - b.value
  })[0]

  if (exactMatch) {
    // priceValue.answers should include all answers
    if (arrayIntersection(priceValue.answers, answerIds, compObjRefs).length !== answerIds.length) {
      return null
    }
  }

  return {
    value: priceValue.value,
    priceValueAnswers: priceValue.answers,
    label: answers.map(a => a.text).join(' + '),
    answers,
  }
}

// Generate prices for a given pro's price values
// based on a user's question responses.
// Algorithm:
// Break up prices into:
// - base queries (numeric and non-numeric)
// - discount
// - addons
//
// Matching user answer to pro prices:
// We try to do exact match or partial match if exact not found.
// For numeric queries, we take each numeric query's answer and the
// corresponding single-choice answer and use that as the user's answer
// for matchinhg.
// For non-numeric queries, we take all base query answers and match against
// pro prices based on all of the answers.
//
// query.summary is added to price.question for discount and addon
// for base, there isn't price.question because of considering in case of two baseQuery
function getPriceValuesByPriceFactorType({ priceValues, description }) {
  let hidePrice = false, numberQuery, discount
  const baseQueries = [], basePrices = [], addons = []
  const singleBaseQuery = priceValues.find(pv => pv.type === 'singleBase')
  let singleBasePrice
  for (const q of description) {
    if (!q.priceFactorType) {
      continue
    }
    q.answers = q.options.filter(o => o.usedForPro)

    if (q.priceFactorType === 'discount') {
      const price: any = getPriceForAnswers({
        answers: q.answers.filter(a => a.checked),
        priceValues: priceValues.filter(pv => pv.type === 'discount'),
        exactMatch: true,
      })
      if (price && price.value) {
        price.question = q.summary
        price.type = 'discount'
        discount = price
      }
      continue
    }

    if (q.priceFactorType === 'addon') {
      for (const answer of q.answers) {
        if (!answer.checked) continue
        if (q.type === 'number' && answer.number === 0) continue

        const price: any = getPriceForAnswers({
          answers: [answer],
          priceValues: priceValues.filter(pv => pv.type === 'addon'),
          exactMatch: true,
        })
        if (price && price.value) {
          price.question = q.summary
          price.type = 'addon'
          price.isNumber = q.type === 'number'
          addons.push(price)
        }
      }
      continue
    }

    // base type or singleBase type
    if (q.type === 'number') {
      numberQuery = q
    } else {
      baseQueries.push(q)
    }
  }

  if (numberQuery) {
    // if all answers are zero, set first answer as one
    const hasAnswer = numberQuery.answers.some(a => a.checked && a.number)
    if (!hasAnswer) {
      numberQuery.answers[0].checked = true
      numberQuery.answers[0].number = 1
    }
    // for each numerical choice answer, find corresponding single choice
    // price value
    numberQuery.answers.filter(a => a.checked && a.number).forEach(a => {
      const baseAnswers = baseQueries.length ? [...baseQueries[0].answers, a] : [a]

      const price: any = getPriceForAnswers({
        answers: baseAnswers.filter(a => a.checked),
        priceValues: priceValues.filter(pv => pv.type === 'base'),
        exactMatch: true,
      })
      if (price) {
        const matchAnswers = baseAnswers.filter(
          o => arrayIntersection([o], price.priceValueAnswers, compObjRefs).length
        )
        price.type = 'base'
        price.isNumber = true
        price.label = matchAnswers.map(a => a.text).join(' + ')

        basePrices.push(price)
      } else {
        hidePrice = true
        return
      }
    })
  } else {
    const baseAnswers = [].concat(
      ...baseQueries.sort(q => q.type === 'singular' ? -1 : 1).map(q => q.answers)
    )
    const hasAnswer = baseAnswers.some(a => a.checked)

    const price: any = getPriceForAnswers({
      answers: baseAnswers.filter(a => a.checked),
      priceValues: priceValues.filter(pv => pv.type === 'base'),
      exactMatch: hasAnswer,
    })
    if (price) {
      const matchAnswers = baseAnswers.filter(
        o => arrayIntersection([o], price.priceValueAnswers, compObjRefs).length
      )
      price.type = 'base'
      price.label = matchAnswers.map(a => a.text).join(' + ')

      basePrices.push(price)
    } else {
      hidePrice = true
    }
  }

  if (singleBaseQuery) {
    singleBasePrice = {
      isNumber: !!numberQuery,
      value: singleBaseQuery.value,
    }
    hidePrice = false
  }

  return { basePrices, discount, addons, singleBasePrice, hidePrice }
}

function getTravelFee({ priceValues, proService, service, distance }) {
  if (!proService.chargesTravelFee) {
    return null
  }
  if (!service.allowsTravelFee) {
    return null
  }

  const hasRemoveTravelFeeAnswer = service.queries.find(q => {
    return q.options && q.options.find(o => {
      return o.removeTravelFee && o.checked
    })
  })

  if (hasRemoveTravelFeeAnswer) {
    return null
  }

  const travelFee = priceValues.filter(pv => {
    return pv.type === 'travelFee'
  }).sort((a, b) => b.value - a.value).find(pv => {
    return pv.requestConditions.find(rc => {
      return rc.key === 'distance' &&
        rc.rangeValue.lowerBound <= distance &&
        (
          rc.rangeValue.upperBound === undefined ||
          rc.rangeValue.upperBound > distance
        )
    })
  })

  if (!travelFee) {
    return null
  }

  const { rangeValue: { lowerBound, upperBound } } = travelFee.requestConditions.find(rc => {
    return rc.key === 'distance'
  })

  let labelRange

  if (upperBound) {
    labelRange = `${upperBound / 1000}km未満`
  } else {
    labelRange = `${lowerBound / 1000}km以上`
  }

  return {
    value: travelFee.value,
    priceValueAnswers: travelFee.answers,
    label: `交通費（${labelRange}）`,
  }
}

// We assume all questions are already only ones used for pro
function calculatePrice({ priceValues, proService, service, description, distance }) {
  let {
    singleBasePrice,
    basePrices,
    discount,
    addons,
    hidePrice,
  } = getPriceValuesByPriceFactorType({ priceValues, description })

  if (hidePrice) return null

  basePrices.forEach(bp => {
    const numberAnswer = bp.answers.find(a => a.number)
    bp.calculatedValue =
      bp.value * (numberAnswer ? numberAnswer.number : 1)
  })

  if (discount) {
    discount.discountedOnValue = sum(basePrices, 'calculatedValue')
    discount.calculatedValue = discount.discountedOnValue * (discount.value / 100) * -1
  }

  addons.forEach(a => {
    const numberAnswer = a.answers.find(a => a.number)
    a.calculatedValue = a.value * (numberAnswer ? numberAnswer.number : 1)
  })

  const travelFee: any = getTravelFee({ priceValues, proService, service, distance })

  if (travelFee) {
    travelFee.calculatedValue = travelFee.value
    travelFee.type = 'travelFee'
  }

  const components = []
  if (singleBasePrice) {
    singleBasePrice.type = 'base'
    singleBasePrice.label = (service.singleBasePriceQuery || {}).label
    singleBasePrice.calculatedValue = singleBasePrice.value
    singleBasePrice.answers = []
    singleBasePrice.singleBase = true
    basePrices = []
    components.push(singleBasePrice)
  }

  components.push(
    ...basePrices,
    ...(discount ? [discount] : []),
    ...addons,
    ...(travelFee ? [travelFee] : []),
  )
  // delete priceValueAnswers
  for (const c of components) {
    delete c.priceValueAnswers
  }

  return {
    components,
    total: sum(components, 'calculatedValue'),
    estimatePriceType: (service || {}).estimatePriceType || 'fixed',
  }
}

function sum(arr, field) {
  return arr.reduce((total, curr) => {
    return total + curr[field]
  }, 0)
}

// req is for bigquery
async function updateProService(serviceId, userId, newData, req) {
  const updateBody: any = {}

  const service = await Service.findById(serviceId)
    .select('queries')
    .populate({
      path: 'queries',
    })
    .lean()

  if (newData.jobRequirements) {
    updateBody.jobRequirements = generateJobRequirements(
      service.queries,
      newData.jobRequirements
    )
  }

  if (newData.loc) updateBody.loc = newData.loc
  if (newData.zipcode) updateBody.zipcode = newData.zipcode
  if (newData.address) updateBody.address = newData.address
  if (newData.prefecture) updateBody.prefecture = newData.prefecture
  if (newData.city) updateBody.city = newData.city

  if (newData.catchphrase) updateBody.catchphrase = newData.catchphrase
  if (newData.description) updateBody.description = newData.description
  if (newData.accomplishment) updateBody.accomplishment = newData.accomplishment
  if (newData.advantage) updateBody.advantage = newData.advantage

  const prevProService = await ProService.findOne({ user: userId, service: serviceId })
    .select('setupDescriptions setupLocation setupJobRequirements setupPriceValues setupBudget isPromoted loc distance')
    .populate('service', 'distance showTargetLocationsToPros')
  let event_type = null
  if (newData.setupDescriptions) {
    if (!prevProService.setupDescriptions) event_type = 'setup_description_matchmore'
    updateBody.setupDescriptions = newData.setupDescriptions
  }
  if (newData.setupLocation) {
    if (!prevProService.setupLocation) event_type = 'setup_location_matchmore'
    updateBody.setupLocation = newData.setupLocation
  }
  if (newData.setupJobRequirements) {
    if (!prevProService.setupJobRequirements) event_type = 'setup_jobrequirement_matchmore'
    updateBody.setupJobRequirements = newData.setupJobRequirements
  }
  if (newData.setupPriceValues) {
    if (!prevProService.setupPriceValues) event_type = 'setup_price_matchmore'
    updateBody.setupPriceValues = newData.setupPriceValues
  }
  if (newData.setupBudget) {
    if (!prevProService.setupBudget) event_type = 'setup_budget_matchmore'
    updateBody.setupBudget = newData.setupBudget
  }

  if (newData.budget) {
    updateBody.budget = newData.budget
  }

  if (newData.priceValues) {
    updateBody.priceValues = filterValidPriceValues(newData.priceValues, service.queries)
  }

  if (newData.chargesTravelFee !== undefined) {
    updateBody.chargesTravelFee = newData.chargesTravelFee
  }

  if (newData.message) updateBody.message = newData.message

  // initial setup
  if (newData.isPromoted !== undefined) {
    if (prevProService.isPromoted === undefined) event_type = 'setup_matchmore'
    updateBody.isPromoted = newData.isPromoted
    if (!newData.isPromoted) {
      BigQueryInsert(req, {
        event_type: 'matchmore_opt_out',
        event: JSON.stringify(newData.optOutReason),
      })
    }
  }

  if (prevProService.service.showTargetLocationsToPros) {
    if (newData.targetLocations) {
      updateBody.targetLocations = newData.targetLocations
    } else if (newData.distance) {
      const [ candidateLocations, targetLocations ] = await prevProService.getLocations(prevProService.loc, newData.distance)

      updateBody.candidateLocations = candidateLocations
      updateBody.targetLocations = targetLocations
      updateBody.distance = newData.distance
    }
  } else if (newData.distance) {
    updateBody.distance = newData.distance
  }

  if (newData.labels) {
    updateBody.labels = newData.labels
  }

  const proService = await ProService.findOneAndUpdate(
    { user: userId, service: serviceId },
    { $set: updateBody },
  )

  if (event_type) {
    BigQueryInsert(req, {
      event_type,
      event: JSON.stringify({ proservice_id: proService.id, user_id: proService.user.toString(), profile_id: proService.profile.toString(), service_id: proService.service.toString()}),
    })
  }

  // toggle promo
  if (newData.isPromoted || newData.isPromoted === false) {
    BigQueryInsert(req, {
      event_type: 'toggle_promo',
      event: JSON.stringify({ status: newData.isPromoted, proservice_id: proService.id, user_id: proService.user.toString(), profile_id: proService.profile.toString(), service_id: proService.service.toString()}),
    })
  }
}
