export {}
const moment = require('moment')
const { FormattedRequest, Request, Service, Keyword, LocationService, Category } = require('../models')
const { shortIdToMongoId } = require('../lib/mongoid')
const { shuffle } = require('../lib/util')
const { updateKeywordCount } = require('./keywords')
const { makeLookupTable, shouldFormatRequest, anonymizeRequest, incrementLookupTable } = require('../lib/formatRequestUtils')

module.exports = {
  index,
  show,
  indexForAdmin,
  showForAdmin,
  updateForAdmin,
  copyForAdmin,
  removeForAdmin,
  examples,
  copyFromRequests,
}


async function examples(req, res) {
  const serviceKey = req.params.key

  const service = await Service
  .findOne({
    key: serviceKey,
    enabled: true,
  })


  if (service === null) return res.status(404).json({message: 'not found'})

  const requests = await FormattedRequest.aggregate([
    { $match: { service: service._id, public: true }},
    { $project: {
      meetsLength: { $size: { $ifNull: [ '$meets', [] ] } },
      prefecture: '$prefecture',
      city: '$city',
      description: '$description',
      meets: '$meets',
      createdAt: '$createdAt',
    } },
    { $match: {meetsLength: {$gt: 2 }} },
  ])

  let request
  if (requests.length) {
    if (!request) request = shuffle(requests)[0]
    request.customer = 'KSTNHMY'[(+new Date(request.createdAt)) % 7]
  }

  res.json(request)
}

async function index(req, res) {
  const page = Math.max(0, parseInt(req.query.page || 1) - 1)
  const cond: any = { public: true }
  const response: any = {}
  if (req.query.key) {
    const service = await Service.findOne({key: req.query.key, enabled: true})
    if (service === null) return res.status(404).json({message: 'not found'})
    const category = await Category.findOne({name: service.tags[0]}).select('key name')

    cond.service = service.id
    response.service = service.toObject()
    response.service.category = category
  }
  if (req.query.path) {
    const [keywords, keyword] = await Promise.all([
      Keyword.find({
        service: cond.service,
        path: new RegExp('^' + req.query.path),
      }).select('path word count'),
      Keyword.findOne({
        service: cond.service,
        path: req.query.path,
      }),
    ])
    response.keyword = keyword

    const $regex = new RegExp(keywords.map(k => k.word.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').split(/[\s\u3000]/).join('|')).join('|'))
    cond.$or = [
      { title: { $regex } },
      { 'description.answers.text': { $regex } },
    ]
  } else if (req.query.query) {
    const $regex = new RegExp('^' + req.query.query.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').split(/[\s\u3000]/).map(s => `(?=.*${s})`).join(''))
    const services = await Service.find({
      $or: [
        { name: { $regex } },
        { providerName: { $regex } },
      ],
    })

    cond.$or = [
      { service: { $in: services.map(s => s.id) } },
      { title: { $regex } },
      { 'description.answers.text': { $regex } },
    ]
  }
  if (req.query.location) {
    cond.address = {
      $regex: new RegExp(req.query.location.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').split(/[\s\u3000]/).join('|')),
    }
  }

  let list
  [response.requests, response.total, list] = await Promise.all([
    FormattedRequest
    .find(cond)
    .populate({
      path: 'service',
      select: 'name key providerName imageUpdatedAt deleted',
    })
    .sort('-createdAt')
    .skip(20 * page)
    .limit(20),
    FormattedRequest.count(cond),
    FormattedRequest
    .aggregate([
      {$group: { _id: '$service', count: { $sum: 1 } }},
      {$sort: { count: -1 }},
      {$lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service',
      }},
    ]),
  ])
  response.services = list.map(l => ({...l.service[0], count: l.count}))

  res.json(response)
}

async function show(req, res) {
  if (req.params.id.length == 16) {
    req.params.id = shortIdToMongoId(req.params.id)
  }

  let request = await FormattedRequest
    .findOne({_id: req.params.id, public: true})
    .populate({
      path: 'service',
      select: 'name key tags providerName imageUpdatedAt deleted',
    })

  if (request === null) return res.status(404).json({message: 'not found'})
  const category = await Category.findOne({name: request.service.tags[0]}).select('key name')
  request = request.toObject()
  request.category = category

  res.json(request)
}


async function indexForAdmin(req, res) {
  const cond: any = {}
  if (req.query.service) {
    cond.service = req.query.service
  }
  const requests = await FormattedRequest
    .find(cond)
    .sort({createdAt: -1})
    .select('-request -status -loc -address -point')
    .populate({
      path: 'service',
      select: 'name',
    })

  res.json(requests)
}

async function showForAdmin(req, res) {
  const request = await FormattedRequest
    .findOne({_id: req.params.id})
    .populate({
      path: 'service',
    })

  if (request === null) return res.status(404).json({message: 'not found'})

  res.json(request)
}

async function updateForAdmin(req, res) {
  const request = await FormattedRequest.findOne({_id: req.params.id})
  if (request === null) return res.status(404).json({message: 'not found'})

  await FormattedRequest.findByIdAndUpdate(request.id, {$set: req.body})

  await showForAdmin(req, res)

  await updateKeywordCount()
}

async function copyForAdmin(req, res) {
  const request = await Request
    .findOne({
      _id: req.params.id,
    })
    .populate({
      path: 'meets',
      select: 'price priceType chats',
      populate: {
        path: 'chats',
        model: 'Chat',
        select: 'type text user system updatedAt',
      },
    })
  if (request === null) return res.status(404).json({ message: 'not found' })

  const anonymizedRequest = anonymizeRequest(request)
  const formattedRequest = await copyRequest(anonymizedRequest)
  return res.json(formattedRequest)
}

async function copyRequest(request) {
  await Request.update({_id: request.id}, {copy: true})

  const requestId = request.id
  request = request.toObject()
  request.request = requestId
  delete request.__v
  delete request._id
  delete request.id

  request.description = request.description.map(d => {
    const checkCount = d.answers.filter(a => a.checked).length
    if (d.answers.length === 1 || checkCount === 0) return d

    return {
      ...d,
      answers: d.answers.filter(a => a.checked),
    }
  })

  request.meets = request.meets.map(m => {
    return {
      ...m,
      chats: m.chats.filter(c => !c.system && c.type === 'text').map(c => ({
        ...c,
        pro: !request.customer.equals(c.user),
      })),
    }
  })

  let formatted = await FormattedRequest.findOne({request: requestId})
  if (formatted) {
    formatted = await FormattedRequest.findByIdAndUpdate(formatted.id, {$set: request})
  } else {
    formatted = await FormattedRequest.create(request)
  }

  return formatted
}

async function removeForAdmin(req, res) {
  // Note: If you set a 'remove' hook, it will be fired when you call myDoc.remove(),
  // not when you call MyModel.remove(). http://mongoosejs.com/docs/middleware.html
  const formattedRequest = await FormattedRequest.findByIdAndRemove(req.params.id)
  if (formattedRequest === null) return res.status(404).json({message: 'not found'})

  await Request.update({_id: formattedRequest.request}, {copy: false})

  res.json({})
}

async function copyFromRequests(req, res) {
  // 依頼例作成用の依頼を取得する
  // １ヶ月前作成の依頼で見積もり３以上でcopy済みでない場合に取得できる
  let cond: any = {
    status: {$ne: 'suspend'},
    copy: {$ne: true},
    createdAt: {
      $lt: moment().subtract({month: 1}).toDate(),
    },
    'meets.2': { $exists: true }, // meets.length >= 3
  }
  if (req.body.service) {
    cond.service = req.body.service
  }

  // get all requests
  const allRequests = await Request
    .find(cond)
    .sort({ pt: -1 })
    .select('service prefecture city')

  if (allRequests.length === 0) return res.json([])

  // find all formatted requests, make Lookup Table
  cond = {}
  if (req.body.service) {
    cond.service = req.body.service
  }
  const formattedRequests = await FormattedRequest
    .find(cond).select('service prefecture city')

  const lookupTable = makeLookupTable(formattedRequests)

  const response = []
  // choose the ones we actually want to prioritize
  for (const request of allRequests) {
    const count = await LocationService.count({
      service: request.service,
      parentName: request.prefecture,
      name: request.city,
    })
    if (count === 0) continue

    const shouldFormat = await shouldFormatRequest(request, lookupTable)
    if (!shouldFormat) continue

    const populated = await Request
      .findOne({
        _id: request.id,
      })
      .populate({
        path: 'meets',
        select: 'price priceType chats',
        populate: {
          path: 'chats',
          model: 'Chat',
          select: 'type text user system updatedAt',
        },
      })

    const anonymizedRequest = anonymizeRequest(populated)
    const copied = await copyRequest(anonymizedRequest)
    response.push(copied)
    incrementLookupTable(request, lookupTable)
  }

  res.json(response)
}
