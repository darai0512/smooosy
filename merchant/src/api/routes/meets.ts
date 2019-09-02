export {}
const moment = require('moment')
const { Accounting, User, Service, Request, Meet, Chat, Profile, Review, Schedule, Thank, ProService } = require('../models')
const {
  emailNewMeet, emailWorkStart, emailMeetEnd, emailReviewDone, emailReviewAppend,
  emailConfirmHired, emailMeetRevert, emailMeetRead, emailNewChat,
} = require('../lib/email')
const { consumePoint, discountPoint } = require('./points')
const { calculatePrice } = require('./proServices')
const { injectDescriptionIntoQueries } = require('../lib/matching/common')
const { addNotice } = require('./notices')
const { BigQueryInsert, dummyUser } = require('./bigquery')
const generateInvoice = require('../lib/invoice')
const { meetPushable } = require('../lib/requests')
import { BEARS_PROFILE_ID } from '../lib/profiles'
const { excludeReason, quickResponse, payment, webOrigin, MeetStatusType, FlowTypes } = require('@smooosy/config')
const { shortIdToMongoId, mongoIdToShortId } = require('../lib/mongoid')
import instant from '../lib/matching/instant'
const meetsLib = require('../lib/meets')
const { slack } = require('../lib/util')
const { getDistance } = require('../lib/geospatial')
const { timeNumbers, reviewCampaign, rolloutDates } = require('@smooosy/config')

module.exports = {
  indexForPro,
  create,
  createByUser,
  acceptByPro,
  release,
  declineByPro,
  show,
  showForPro,
  update,
  review,
  updateReview,
  upsertAccounting,
  invoice,
  redirectShortURL,
  // admin
  showForAdmin,
  updateForAdmin,
  // function
  generateShortURL,
}

async function indexForPro(req, res) {
  const option: any = {pro: req.user.id}
  if (req.query.status === 'waiting') {
    option.status = 'waiting'
    option.archive = { $ne: true }
    option.chatStatus = { $ne: MeetStatusType.RESPONDED }
    option.proResponseStatus = { $nin: [ 'tbd', 'decline', 'inReview' ] }
  } else if (req.query.status === 'talking') {
    option.status = { $in: ['exclude', 'waiting'] }
    option.archive = { $ne: true }
    option.chatStatus = MeetStatusType.RESPONDED
    option.proResponseStatus = { $nin: [ 'tbd', 'decline', 'inReview' ] }
  } else if (req.query.status === 'hired') {
    option.status = { $in: ['progress', 'done'] }
    option.archive = { $ne: true }
  } else if (req.query.status === 'archive') {
    option.archive = true
    option.proResponseStatus = { $ne: 'inReview' }
  }

  const meets = await Meet
    .find(option)
    .sort({updatedAt: -1})
    .populate({
      path: 'request',
    })
    .populate({
      path: 'service',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname deactivate',
    })
    .populate({
      path: 'chats',
      select: '-emotionalScore',
      populate: {
        path: 'user',
        model: 'User',
        select: 'imageUpdatedAt deactivate',
      },
    })

  res.json(meets)
}

async function create(req, res) {
  const request = await Request
    .findOne({_id: req.params.requestId, sent: req.body.profile})
    .populate({
      path: 'service',
      select: 'name providerName',
      option: {lean: true},
    })
    .populate('customer')
  if (request === null) return res.status(404).json({message: 'not found'})

  const alreadyCreated = await Meet.countDocuments({request: request._id, profile: req.body.profile, pro: req.user._id})
  if (alreadyCreated) return res.status(302).json({message: '既に応募しています。見積済み案件を確認してください。'})

  const errorMessage = cannotCreateMeet(request)
  if (errorMessage) {
    return res.status(400).json({message: errorMessage})
  }

  const profile = await Profile.findOne({_id: req.body.profile})
  if (profile === null) return res.status(404).json({message: 'not found'})

  const meetsCount = await Meet.countDocuments({
    pro: req.user.id,
    proResponseStatus: {$nin: ['inReview', 'tbd', 'decline']},
  })
  // prepare meet
  req.body.pro = req.user.id
  req.body.request = request.id
  req.body.customer = request.customer
  req.body.service = request.service
  req.body.count = meetsCount + 1
  const fileIds = req.body.files || []
  delete req.body.files

  // 応募作成準備
  const meet = new Meet(req.body)
  const chat = new Chat({user: req.user.id, text: req.body.chat})
  meet.chats = [chat.id]

  if (request.point >= 0) {
    const result = await calcCurrentPoint({meet, request, proId: req.user._id})
    meet.point = result.point
    meet.discounts = result.discounts

    // 応募が保存できるかチェック
    if (chat.validateSync() || meet.validateSync()) {
      return res.status(400).json({message: '不明なエラーが発生しました。'})
    }

    try {
      await consumePoint({user: req.user.id, operator: req.user.id, point: meet.point, meet: meet.id, request: request.id, service: meet.service.id})
    } catch (e) {
      return res.status(400).json({status: 901, message: 'ポイントが不足しています'})
    }
  }

  // 課金して応募が作られないと返金事故になるので即座に応募作成
  await chat.save()
  await meet.save()

  // 依頼を更新
  await Request.update(
    {_id: request.id},
    {
      $push: { meets: meet.id },
      $pull: { sent: profile.id },
    },
    {runValidators: true}
  )

  // 追加の画像を保存
  const chats = await Chat.find({
    _id: { $in: fileIds },
  })
  // 並び順保証・createdAtはsaveしないと更新されない
  const createdAt = moment(chat.createdAt)
  for (const chat of chats) {
    chat.createdAt = createdAt.add({ms: 1}).toDate()
    await chat.save()
  }
  await Meet.findByIdAndUpdate(meet.id, {$push: {chats: fileIds}})

  if (req.user.refer && !req.user.refer.sendMeet) {
    const meetCount = await Meet.count({pro: req.user.id})
    if (meetCount === 1) {
      await User.findByIdAndUpdate(req.user.id, {$set: {'refer.sendMeet': true}})
    }
  }

  res.json(meet)

  BigQueryInsert(req, {
    event_type: 'meet_create',
    event: JSON.stringify({ service_id: request.service._id, request_id: request.id, meet_id: meet.id }),
  })

  emailNewMeet({
    user: request.customer,
    proName: profile.name,
    requestId: request.id,
    meetId: meet.id,
  })

  if (profile._id.toString() === BEARS_PROFILE_ID) {
    await slack({
      room: 'cs',
      channel: '#team_大手アカウント',
      message: `:bears: ${profile.name}さんが応募\n${request.customer.lastname}様に見積もり\n${webOrigin}/tools/#/stats/requests/${request._id}?meet=${meet._id}`,
    })
  }
}

function cannotCreateMeet(request) {
  if (request.status !== 'open') {
    const message =
      request.status === 'suspend' ? '申し訳ありません。ご操作の最中に依頼が取り消しされました。' :
      request.status === 'close' ? '申し訳ありません。ご操作の最中に他の事業者に決定しました。' : 'エラーが発生しました'
    return message
  }

  if (request.meets.length >= 5) {
    return '申し訳ありません。ご操作の最中に他の事業者から応募があり、5件に達したため受付を終了しました。'
  }

  if (new Date(request.createdAt) < moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate()) {
    return '申し訳ありません。ご操作の最中に受付期限になったので、受付を終了しました。'
  }

  return false
}

async function createByUser(req, res) {
  const profileIds = req.body

  const request = await Request.findOne({_id: req.params.requestId})
    .populate({
      path: 'service',
      select: 'id name description loc',
    })
  if (!request) return res.status(404).json({message: 'not found'})

  // 本人以外が追加しようとしている
  if (req.user.id !== request.customer.toString()) {
    return res.status(403).json({message: '不正なリクエストです'})
  }

  // you can create potential meets up to 5 pros after release
  // potential meet is a meet which can be `autoAccept`
  const pushable = await meetPushable(request)
  if (!pushable) {
    return res.status(400).json({message: '不正なリクエストです'})
  }

  const service = await Service.findById(request.service).populate('queries').lean()

  injectDescriptionIntoQueries(request.description, service.queries)

  const meets = []
  for (const profileId of profileIds) {
    if (!profileId) {
      continue
    }

    // create meet
    const profile = await Profile.findById(profileId)
    .select('id pro deactivate suspend loc')

    if (profile === null || profile.deactivate) {
      // プロが退会もしくは何らかの理由で存在しない
      continue
    }

    const proService = await ProService.findOne({
      user: profile.pro, profile: profile.id, service: request.service.id,
    }).populate({path: 'user', select: 'id refer email bounce lastname notification lineId deactivate schedule'})

    const distance = getDistance(request.loc, profile.loc) * 1000

    const isExactMatch = instant.isExactMatch(service.queries, proService)
    const priceValues = calculatePrice({
      priceValues: proService.priceValues,
      proService,
      service,
      description: service.queries.filter(q => q.priceFactorType),
      distance,
    })

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

    const scheduleConflictReason = instant.scheduleConflictReason({
      user: proService.user, schedules, description: request.description,
    })

    if (scheduleConflictReason) {
      continue
    }

    const meetsCount = await Meet.countDocuments({
      pro: profile.pro,
      proResponseStatus: {$nin: ['inReview', 'tbd', 'decline']},
    })
    // prepare meet
    const meetData = {
      pro: proService.user.id,
      profile: proService.profile,
      customer: request.customer,
      request: request.id,
      service: request.service.id,
      count: meetsCount + 1,
      price: priceValues ? priceValues.total : 0,
      priceValues,
      priceType: priceValues ? priceValues.estimatePriceType : 'tbd',
      read: true,
      isCreatedByUser: true,
      status: 'waiting',
      proResponseStatus: 'inReview',
      isExactMatch: isExactMatch && !scheduleConflictReason,
      distance,
    }

    // 応募作成準備
    let meet = new Meet(meetData)
    const chat = new Chat({
      user: proService.user.id,
      type: 'price',
      read: true,
    })
    meet.chats = [chat.id]

    if (request.point) {
      const result = await calcCurrentPoint({meet, request, proId: proService.user._id})
      meet.point = result.point
      meet.discounts = result.discounts
    } else {
      meet.point = 0
    }

    await chat.save()
    await meet.save()

    // fetch again
    meet = await Meet.findById(meet.id).select('id proResponseStatus')

    meets.push(meet)

    // 依頼を更新(プロ紹介)
    const paid = ['accept', 'autoAccept'].includes(meet.proResponseStatus)
    await Request.findByIdAndUpdate(
      request.id,
      {
        // push to pendingMeets if the meet is not exact match
        $addToSet: paid ? { meets: meet.id } : { pendingMeets: meet.id },
        $pull: { sent: proService.profile },
      }
    )

    if (proService.user.refer && !proService.user.refer.sendMeet) {
      const meetCount = await Meet.count({pro: proService.user.id})
      if (meetCount === 1) {
        await User.findByIdAndUpdate(proService.user.id, {$set: {'refer.sendMeet': true}})
      }
    }

    BigQueryInsert(req, {
      event_type: 'meet_create',
      event: JSON.stringify({ service_id: request.service.id, request_id: request.id, meet_id: meet.id, flow_type: FlowTypes.PPC }),
    })
  }

  res.json(meets)
}

async function acceptByPro(req, res) {
  const meet = await Meet.findOne({
    _id: req.params.id,
    pro: req.user.id,
    proResponseStatus: 'tbd',
  }).populate({
    path: 'request',
    select: 'status interview meets createdAt point',
  })
  if (meet === null) return res.status(404).json({message: 'not found'})

  const errorMessage = cannotCreateMeet(meet.request)
  if (errorMessage) {
    return res.status(400).json({message: errorMessage})
  }

  // calculate point again if payment is not finished yet
  const result = await calcCurrentPoint({meet, request: meet.request, proId: meet.pro._id})
  meet.point = result.point
  meet.discounts = result.discounts

  if (meet.point >= 0) {
    try {
      await consumePoint({user: req.user.id, operator: req.user.id, point: meet.point, meet: meet.id, request: meet.request, service: meet.service})
    } catch (e) {
      return res.status(400).json({status: 901, message: 'ポイントが不足しています'})
    }
  }

  await Meet.findByIdAndUpdate(
    req.params.id,
    {
      $set: { proResponseStatus: 'accept', point: meet.point },
    },
  )

  // move meet from request.pendingMeets to request.meets
  await Request.findByIdAndUpdate(
    meet.request.id,
    {
      $pull: { pendingMeets: meet.id },
      $addToSet: { meets: meet.id },
    }
  )

  await showForPro(req, res)
}

async function release(req, res) {
  try {
    await meetsLib.release({ meetId: req.params.id })
    res.json({})
  } catch (e) {
    res.status(404).json({message: e.message})
  }
}

async function declineByPro(req, res) {
  const meet = await Meet.findOne({
    _id: req.params.id,
    pro: req.user.id,
    proResponseStatus: 'tbd',
  })
  if (meet === null) return res.status(404).json({message: 'not found'})

  const passMessage = req.body.passMessage
  const chats = []
  if (passMessage) {
    const declineChat = await Chat.create({
      user: req.user.id,
      text: passMessage,
    })
    chats.push(declineChat.id)
  }

  const chat = await Chat.create({
    user: req.user.id,
    system: true,
    text: 'このプロは対応が難しいと返答しました。',
  })
  chats.push(chat.id)
  await Meet.findByIdAndUpdate(
    req.params.id,
    {
      $set: { proResponseStatus: 'decline' },
      $push: { chats: {$each: chats} },
    },
  )

  await showForPro(req, res)
}

async function show(req, res) {
  let meet = await Meet
    .findOne({_id: req.params.id, $or: [{customer: req.user.id}, {pro: req.user.id}]})
    .populate({
      path: 'pro',
      select: 'lastname phone imageUpdatedAt identification deactivate',
    })
    .populate({
      path: 'customer',
      select: 'lastname imageUpdatedAt deactivate',
    })
    .populate({
      path: 'request',
    })
    .populate({
      path: 'service',
    })
    .populate({
      path: 'review',
    })
    .populate({
      path: 'accounting',
      select: 'type data',
    })
  if (!meet) {
    // 関係のない応募
    if (await Meet.countDocuments({_id: req.params.id})) {
      return res.status(403).json({message: 'user mismatch'})
    }
    return res.status(404).json({message: 'not found'})
  }

  // navigate showForPro if request from pro
  if (meet.pro.id === req.user.id) {
    return showForPro(req, res)
  }

  const [chats, profile, proService] = await Promise.all([
    Chat
      .find({_id: {$in: meet.chats}})
      .select('-emotionalScore')
      .populate({
        path: 'user',
        select: 'imageUpdatedAt deactivate',
      })
      .populate({
        path: 'booking.schedule',
      })
      .sort('createdAt'),
    Profile
      .findOne({_id: meet.profile})
      .select('-templates -score')
      .populate({path: 'media'})
      .populate({path: 'pro', select: 'deactivate'})
      .populate({path: 'licences.licence', options: {lean: true}})
      .populate({
        path: 'reviews',
        options: {sort: {createdAt: -1}},
        populate: {
          path: 'service',
          model: 'Service',
          select: 'name',
        },
      }),
    ProService
      .findOne({
        user: meet.pro.id,
        service: meet.service.id,
      })
      .populate({path: 'media'})
      .populate('labels')
      .lean({virtuals: true}),
  ])

  const beforePayment = ['inReview', 'tbd', 'decline'].includes(meet.proResponseStatus)

  meet.chats = chats
  // プロフィール削除時に退会済みと表示されないように、User model の deactivate を利用する
  profile.deactivate = profile.pro.deactivate
  const p = profile ? profile.toObject() : null
  if (p && proService && proService.media && proService.media.length > 0) {
    p.serviceMedia = proService.media
  }
  // proServiceのdescription, accomplishment, advantageでreplace
  // labelsを付与
  if (p && proService) {
    p.description = proService.description || profile.description
    p.accomplishment = proService.accomplishment || profile.accomplishment
    p.advantage = proService.advantage || profile.advantage
    p.labels = proService.labels
    p.catchphrase = proService.catchphrase
  }
  const m = meet.toObject()
  if ((p || {}).deactivate === true || beforePayment) {
    delete m.pro.phone
  }
  m.profile = p

  // When a meet is unread, we send the point value to the client
  // so that they can send an event to Google Ads for tracking the total
  // number of points that have been spent.
  if (isUnreadMeet(meet, req)) {
    // Since this is a revenue number, use ofuscated variable
    // names here to make it harder for anyone trying to
    // reverse-engineer the code
    m.rs = {
      // convert points to yen
      // Points -> yen:
      // 142 (average cost of point in yen) * ~5% refund rate on
      // on requests where users already viewed meets.
      a: meet.point * payment.pricePerPoint.profit,
    }
  }

  res.json(m)

  // チャット既読処理
  for (const chat of chats) {
    if (chat.user.id !== req.user.id && !chat.system) {
      await Chat.findByIdAndUpdate(chat.id, {$set: {read: true}})
    }
  }

  if (meet.chatStatus === MeetStatusType.UNREAD) {
    await Meet.findByIdAndUpdate(meet.id, {
      $set: { chatStatus: MeetStatusType.READ },
    })
  }

  // 96時間以内に応募が既読になったらMeetをreadにする
  if (isUnreadMeet(meet, req))  {
    await Meet.findByIdAndUpdate(meet.id, { read: true })

    meet = await meet.populate(['pro']).execPopulate()
    emailMeetRead({ meet })

    BigQueryInsert(req, {
      event_type: 'meet_read',
      event: JSON.stringify({ service_id: meet.request.service.toString(), request_id: meet.request.id, meet_id: meet.id }),
    })
  }
}

async function showForPro(req, res) {
  const meet = await Meet
    .findOne({
      _id: req.params.id,
      pro: req.user.id,
    })
    .populate({
      path: 'pro',
      select: 'lastname phone imageUpdatedAt identification deactivate',
    })
    .populate({
      path: 'customer',
      select: 'lastname imageUpdatedAt deactivate',
    })
    .populate({
      path: 'request',
    })
    .populate({
      path: 'service',
    })
    .populate({
      path: 'review',
    })
    .populate({
      path: 'accounting',
      select: 'type data',
    })
  if (!meet) {
    // 関係のない応募
    if (await Meet.countDocuments({_id: req.params.id})) {
      return res.status(403).json({message: 'user mismatch'})
    }
    return res.status(404).json({message: 'not found'})
  }

  const [chats, profile, meets] = await Promise.all([
    Chat
      .find({_id: {$in: meet.chats}})
      .select('-emotionalScore')
      .populate({
        path: 'user',
        select: 'imageUpdatedAt deactivate',
      })
      .populate({
        path: 'booking.schedule',
      })
      .sort('createdAt'),
    Profile
      .findOne({_id: meet.profile})
      .select('-templates -score')
      .populate({path: 'media'})
      .populate({path: 'pro', select: 'deactivate'})
      .populate({
        path: 'reviews',
        options: {sort: {createdAt: -1}},
        populate: {
          path: 'service',
          model: 'Service',
          select: 'name',
        },
      }),
    Meet
      .find({
        _id: {
          $ne: meet.id,
          $in: meet.request.meets,
        },
      })
      .select('price priceType profile status chats chatStatus createdAt')
      .populate({
        path: 'profile customer',
        select: 'prefecture city averageRating',
      })
      .populate({
        path: 'chats',
        select: 'user read',
      }),
  ])

  const beforePayment = ['inReview', 'tbd', 'decline'].includes(meet.proResponseStatus)
  if (beforePayment) {
    // hide phone number
    meet.request.phone = meet.request.phone ? 'ポイント利用後に表示されます' : 'なし'

    const meetsCount = await Meet.countDocuments({
      pro: req.user.id,
      proResponseStatus: {$nin: ['inReview', 'tbd', 'decline']},
    })
    meet.request.isNewbie = meetsCount === 0

    // calculate point again if payment is not finished yet
    const result = await calcCurrentPoint({proId: req.user._id, request: meet.request, meet})
    meet.point = result.point
    meet.discounts = result.discounts
  } else if (!meet.displayPhone && !meet.read) {
    meet.request.phone = meet.request.phone ? 'hidden' : 'なし'
  }

  meet.chats = chats
  // プロフィール削除時に退会済みと表示されないように、User model の deactivate を利用する
  profile.deactivate = profile.pro.deactivate
  const p = profile ? profile.toObject() : null
  const m = meet.toObject()

  // 既にmeetに適用されている割引を表示させる為の処理
  m.request.basePoint = m.request.point
  m.request.point = m.point
  m.request.discounts = m.discounts

  if (moment().isSameOrAfter(rolloutDates.enableMatchMoreCampaign)
    && moment().isSameOrBefore(rolloutDates.disableMatchMoreCampaign)
    && m.service.tags[0] === '車検・修理'
    && m.service.matchMoreEditable
  ) {
    const ps = await ProService.findOne({user: req.user._id, service: m.service._id})
      .populate({
        path: 'user',
        select: 'hasActiveCard isMatchMore schedule',
      })
      .select('setupLocation setupJobRequirements setupPriceValues')
      .lean({virtuals: true})

    // 4th argument means a <= date <= b
    const isBetween = moment(m.createdAt).isBetween(
      rolloutDates.enableMatchMoreCampaign,
      rolloutDates.disableMatchMoreCampaign,
      null,
      '[]'
    )
    m.request.isMatchMoreCampaignTarget = isBetween
      && instant.isMatchMoreProService({proService: ps, user: ps.user})
      && ps.setupPriceValues
      && req.user.hasActiveCard
  }

  if (p.deactivate === true || beforePayment) {
    delete m.pro.phone
  }
  m.opponents = meets
  m.profile = p

  res.json(m)

  if (!meet.readByPro) {
    await Meet.findByIdAndUpdate(meet.id, { readByPro: true })
  }

  // ご指名方式でプロが受けてない場合、既読処理しない
  if (beforePayment) return

  // チャット既読処理
  for (const chat of chats) {
    if (chat.user.id !== req.user.id && !chat.system) {
      await Chat.findByIdAndUpdate(chat.id, {$set: {read: true}})
    }
  }
}

function isUnreadMeet(meet, req) {
  return req.user.id === meet.customer.id && meet.request.status !== 'suspend' && !meet.read && moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() < new Date(meet.createdAt)
}

async function update(req, res) {
  let meet = await Meet
    .findOne({_id: req.params.id, $or: [{customer: req.user.id}, {pro: req.user.id}]})
    .populate({
      path: 'profile',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    })
    .populate('request')
  if (meet === null) return res.status(404).json({message: 'not found'})

  if (!req.body.refund) delete req.body.refund // false, undefined を削除
  if (!req.body.read) delete req.body.read // false, undefined を削除
  delete req.body.chatStatus

  const preTrackInfo = getTrackInfo(meet)
  const $set: any = {}
  Object.keys(req.body).forEach(prop => ($set[prop] = req.body[prop]))

  const STATUS_CONVERSION = {
    KEEP_WAITING: 'keepWaiting',
    HIRE: 'hire',
    DIRECT_COMPLETE: 'directComplete',
    COMPLETE: 'complete',
    REVERT: 'revert',
    EXCLUDE: 'exclude',
  }

  const getStatusConversion = (preStatus, status) => {
    if (preStatus === 'waiting' && status === 'waiting') {
      return STATUS_CONVERSION.KEEP_WAITING
    }
    if (preStatus === 'waiting' && status === 'progress') {
      return STATUS_CONVERSION.HIRE
    }
    if (preStatus === 'waiting' && status === 'done') {
      return STATUS_CONVERSION.DIRECT_COMPLETE
    }
    if (preStatus === 'progress' && status === 'done') {
      return STATUS_CONVERSION.COMPLETE
    }
    if (['progress', 'done'].includes(preStatus) && status === 'waiting') {
      return STATUS_CONVERSION.REVERT
    }
    if (preStatus !== 'exclude' && status === 'exclude') {
      return STATUS_CONVERSION.EXCLUDE
    }
  }
  const status = getStatusConversion(meet.status, $set.status || meet.status)

  const $push = {chats: []}
  const $unset: any = {}
  // システムメッセージチャット生成、ログ送信
  switch (status) {
    case STATUS_CONVERSION.KEEP_WAITING:
      if (req.body.remindMessage) {
        const chat = await Chat.create({user: req.user.id, system: true, text: req.body.remindMessage})
        $push.chats.push(chat.id)

        if (req.body.reason !== 'other') {
          const chat = await Chat.create({user: req.user.id, system: true, text: `検討中の理由： ${req.body.remindReason}`})
          $push.chats.push(chat.id)
        }
      }
      break
    case STATUS_CONVERSION.HIRE:
      {
        const text = req.user.id === meet.customer.id ? `${meet.profile.name}様に決定しました` : `${meet.profile.name}様が成約に設定しました`
        const chat = await Chat.create({user: req.user.id, system: true, text})
        $push.chats.push(chat.id)

        $set.hiredAt = new Date()
        BigQueryInsert(req, {
          event_type: 'meet_hire',
          event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.id, meet_id: meet.id, prev: preTrackInfo }),
        })
      }
      break
    case STATUS_CONVERSION.DIRECT_COMPLETE:
      if (meet.request.status === 'open') {
        const chat = await Chat.create({user: req.user.id, system: true, text: `${meet.profile.name}様が完了に設定しました`})
        $push.chats.push(chat.id)

        $set.hiredAt = new Date()
      } else {
        return res.status(409).json({message: '更新に失敗しました。再読み込みしてください。'})
      }
      BigQueryInsert(req, {
        event_type: 'meet_done',
        event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.id, meet_id: meet.id, prev: preTrackInfo }),
      })
      break
    case STATUS_CONVERSION.COMPLETE:
      {
        const chat = await Chat.create({user: req.user.id, system: true, text: '依頼が完了しました'})
        $push.chats.push(chat.id)

        BigQueryInsert(req, {
          event_type: 'meet_done',
          event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.id, meet_id: meet.id, prev: preTrackInfo }),
        })
      }
      break
    case STATUS_CONVERSION.REVERT:
      {
        const chat = await Chat.create({user: req.user.id, system: true, text: `${meet.customer.lastname}様は交渉中に戻しました`})
        $push.chats.push(chat.id)

        $unset.hiredAt = true
      }
      break
    case STATUS_CONVERSION.EXCLUDE:
      {
        if (req.body.quickResponse) {
          const chat = await Chat.create({user: req.user.id, text: quickResponse.decline})
          $push.chats.push(chat.id)

          const user = await User.findOne({_id: meet.pro})
          emailNewChat({
            user,
            fromUser: req.user,
            toPro: true,
            meet,
            chat,
          })
          BigQueryInsert(req, {
            event_type: 'meet_chat',
            event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.toString(), meet_id: meet.id, chat_id: chat.id, prev: preTrackInfo }),
          })
        }
        let chat = await Chat.create({user: req.user.id, system: true, text: `${req.user.lastname}様が${meet.profile.name}様を候補から外すを選択しました` })
        $push.chats.push(chat.id)
        if (req.body.reason !== 'other') {
          chat = await Chat.create({user: req.user.id, system: true, text: `候補外の理由：${excludeReason[req.body.reason]}`})
          $push.chats.push(chat.id)
        }
        $set.excludeReason = req.body.excludeReason || excludeReason[req.body.reason]

        BigQueryInsert(req, {
          event_type: 'meet_exclude',
          event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.id, meet_id: meet.id, prev: preTrackInfo }),
        })
      }
      break
  }

  if (meet.archive != $set.archive) {
    BigQueryInsert(req, {
      event_type: $set.archive ? 'meet_archive' : 'meet_unarchive',
      event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.id, meet_id: meet.id, prev: preTrackInfo }),
    })
  }

  if ($push.chats.length && meet.customer.equals(req.user.id)) {
    $set.chatStatus = MeetStatusType.RESPONDED
  }

  const updateData: any = {$set, $push}
  if (Object.keys($unset).length) {
    updateData.$unset = $unset
  }
  meet = await Meet.findByIdAndUpdate(meet.id, updateData)
    .populate({
      path: 'profile',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    })
    .populate('request')
  res.json(meet)

  meet = await meet.populate(['profile', 'pro', 'customer']).execPopulate()
  // メール送信
  switch (status) {
    case STATUS_CONVERSION.HIRE:
    case STATUS_CONVERSION.DIRECT_COMPLETE:
      {
        const request = await Request.findOne({_id: meet.request.id})
        if (request) {
          await Request.findByIdAndUpdate(request.id, {$set: {status: 'close'}})
        }
        if (req.user.id === meet.pro.id) {
          emailConfirmHired({ meet })
        } else if (meet.status === 'progress') {
          emailWorkStart({user: meet.pro, lastname: meet.customer.lastname, meetId: meet.id})
        }
      }
      break
    case STATUS_CONVERSION.COMPLETE:
      emailMeetEnd({user: meet.customer, proName: meet.profile.name, request: meet.request, meet})
      break
    case STATUS_CONVERSION.REVERT:
      {
        const request = await Request.findOne({_id: meet.request.id})
        if (request) {
          await Request.findByIdAndUpdate(request.id, {$set: {status: 'open'}})
        }
        emailMeetRevert({ meet })
      }
      break
  }

}

function convertCampaignReviewData(oriDetails) {
  const newDetails = []
  // sort details
  reviewCampaign.details.forEach(conf => {
    const d = oriDetails.find(d => d.title === conf.title)
    if (d) newDetails.push(d)
  })

  if (newDetails.length == 0) {
    return null
  }
  let text = newDetails[0].answer
  if (newDetails.length > 1) {
    text += '\n' + newDetails.slice(1).map(qa => `${qa.title}は、${qa.answer}`).join('\n')
  }

  return {
    text,
    details: newDetails,
  }
}

async function review(req, res) {
  let meet = await Meet
    .findOne({_id: req.params.id, customer: req.user.id})
  if (meet === null) return res.status(404).json({message: 'not found'})
  if (meet.review) return res.status(400).json({message: 'already reviewed'})

  const preTrackInfo = getTrackInfo(meet)
  const thanks = req.body.thanks
  delete req.body.thanks

  // for QA type rerview
  if (req.body.details) {
    // FE にも validation あり
    const invalidDetails = req.body.details.filter(qa => !reviewCampaign.details.find(rc => rc.title === qa.title && qa.answer && qa.answer.length >= rc.min))
    if (invalidDetails.length > 0) {
      return res.status(400).json({status: 400, message: 'invalid review'})
    }

    const data = convertCampaignReviewData(req.body.details)
    if (!data) {
      return res.status(400).json({status: 400, message: 'invalid review'})
    }
    req.body.text = data.text
    req.body.details = data.details
  }

  req.body.meet = meet.id
  req.body.profile = meet.profile
  req.body.service = meet.service
  const review = await Review.create(req.body)

  meet = await Meet.findByIdAndUpdate(meet.id, {$set: {review: review.id, status: 'done'}}).populate('review')

  const request = await Request.findByIdAndUpdate(meet.request, {$set: {status: 'close'}})
  let profile = await Profile.findByIdAndUpdate(meet.profile, {$push: {reviews: review.id}})
  profile = await profile.calcScore()

  res.json(meet)

  BigQueryInsert(req, {
    event_type: 'meet_review',
    event: JSON.stringify({ service_id: meet.service.toString(), request_id: request.id, meet_id: meet.id, prev: preTrackInfo }),
  })

  meet = await meet.populate(['pro', 'customer']).execPopulate()
  emailReviewDone({user: meet.pro, lastname: meet.customer.lastname, meetId: meet.id, profileId: profile.id})

  if (thanks) {
    await Thank.create({
      from: req.user.id,
      to: profile.pro,
    })
    addNotice('thanks', profile.pro, {lastname: req.user.lastname})
  }
}

async function updateReview(req, res) {
  const meet = await Meet.findOne({_id: req.params.id, customer: req.user.id}).populate('review')
  if (meet === null) return res.status(404).json({message: 'not found'})
  if (meet.review === null || meet.review.details === null) return res.status(400).json({status: 400, message: 'invalid review'})

  // for QA type rerview
  if (!req.body.details) {
    return res.status(400).json({status: 400, message: 'invalid review'})
  }

  const preTrackInfo = getTrackInfo(meet)

  // FE にも validation あり
  // キャンペーン期間中のみ利用のため、両方で管理
  // 今後もキャンペーンをしていくなら、両方で同じ設定利用するように修正
  const invalidDetails = req.body.details.filter(qa => !qa.title || !qa.answer || qa.answer.length < 100 || meet.review.details.filter(r => qa.title === r.title).length > 0)
  if (invalidDetails.length > 0) {
    return res.status(400).json({status: 400, message: 'invalid review'})
  }

  // convert details
  const $set = convertCampaignReviewData([...meet.review.details, ...req.body.details])
  if (!$set) {
    return res.status(400).json({status: 400, message: 'invalid review'})
  }

  await Review.findByIdAndUpdate(meet.review, {$set})

  let [ newMeet, request, profile ] = await Promise.all([
    Meet.findById(meet._id).populate('review'),
    Request.findById(meet.request),
    Profile.findById(meet.profile),
  ])
  res.json(newMeet)

  BigQueryInsert(req, {
    event_type: 'meet_review_append',
    event: JSON.stringify({ service_id: newMeet.service.toString(), request_id: request.id, meet_id: meet.id, prev: preTrackInfo }),
  })

  newMeet = await newMeet.populate(['pro', 'customer']).execPopulate()
  emailReviewAppend({user: newMeet.pro, lastname: newMeet.customer.lastname, meetId: newMeet.id, profileId: profile.id})
}

async function upsertAccounting(req, res) {
  let meet = await Meet.findById(req.params.id)
  if (!meet || meet.pro.toString() !== req.user.id) return res.status(404).json({message: 'not found'})
  const exists = await Accounting.findOne({meet: meet.id})
  if (exists) {
    await exists.update({$set: req.body})
  } else {
    req.body.meet = meet.id
    const accounting = await Accounting.create(req.body)
    meet = await meet.update({$set: {accounting}}, {new: true})
  }
  res.json(meet)
}

async function invoice(req, res) {
  const meet = await Meet.findById(req.params.id)
  if (!meet) return res.status(404).json({message: 'not found'})
  const { from, name, nameSuffix, items } = req.query
  const option = {
    from,
    name,
    meet,
    nameSuffix,
    items,
  }
  const pdf = generateInvoice(option)
  pdf.pipe(res)
}

async function showForAdmin(req, res) {
  const meet = await Meet
    .findOne({_id: req.params.id})
    .populate({
      path: 'pro',
      select: 'lastname phone imageUpdatedAt identification deactivate',
    })
    .populate({
      path: 'customer',
      select: 'lastname imageUpdatedAt deactivate',
    })
    .populate({
      path: 'service',
      select: 'name estimatePriceType',
    })
    .populate({
      path: 'review',
    })
    .populate({
      path: 'request',
      select: 'createdAt point',
    })
    .populate({
      path: 'profile',
      select: 'suspend',
      options: {lean: true},
    })
  if (meet === null) return res.status(404).json({message: 'not found'})

  const chats = await Chat
    .find({_id: {$in: meet.chats}})
    .populate({
      path: 'user',
      select: 'imageUpdatedAt deactivate',
    })
    .populate({
      path: 'booking.schedule',
    })

  meet.chats = chats

  const result = await calcCurrentPoint({meet, request: meet.request, proId: meet.pro._id})
  meet.point = result.point
  meet.discounts = result.discounts

  res.json(meet)
}

async function updateForAdmin(req, res) {
  // 更新すべきものだけ更新
  const meet = await Meet.findOne({_id: req.params.id})
  if (meet === null) return res.status(404).json({message: 'not found'})

  if (req.body.updatedAt && !moment(req.body.updatedAt).isSame(meet.updatedAt)) {
    return res.status(409).json({message: 'updatedAt mismatch'})
  }

  const hired = ['progress', 'done'].includes(meet.status)
  const willHire = ['progress', 'done'].includes(req.body.status)

  const $set: any = {}
  if (req.body.price) $set.price = req.body.price
  if (req.body.priceType) $set.priceType = req.body.priceType
  if (req.body.status) $set.status = req.body.status

  // 成約時刻の保存
  const $unset: any = {}
  if (hired && !willHire) {
    $unset.hiredAt = true
    await Request.findByIdAndUpdate(meet.request, {$set: {status: 'open'}})
  } else if (!hired && willHire) {
    $set.hiredAt = new Date()
    await Request.findByIdAndUpdate(meet.request, {$set: {status: 'close'}})
  }

  // 除外理由削除
  if (meet.status !== 'exclude') {
    $unset.excludeReason = true
  }

  const updateData: any = {$set}
  if (Object.keys($unset).length) {
    updateData.$unset = $unset
  }
  await meet.update(updateData)

  await showForAdmin(req, res)
}

async function calcCurrentPoint({proId, meet, request}) {
  const meetsCount = await Meet.countDocuments({
    pro: proId,
    proResponseStatus: {$nin: ['inReview', 'tbd', 'decline']},
  })
  const hiredCount = await Meet.countDocuments({
    hiredAt: {$lt: request.createdAt},
    pro: proId,
  })

  const result = await discountPoint({
    meetsCount,
    hiredCount,
    point: request.point,
    // for MatchMore campaign
    proId: proId,
    serviceId: meet.service._id,
    requestCreatedAt: request.createdAt,
  })

  return result
}

/**
 * @param {Object} req
 *   @param {Object} req.params
 *     @param {string} req.params.shortId
 */
async function redirectShortURL(req, res) {
  const meet = await Meet.findById(shortIdToMongoId(req.params.shortId))
  if (!meet) {
    return res.status(404).json({message: 'not found'})
  }
  const url = `${webOrigin}/requests/${meet.request}/responses/${meet.id}`
  res.redirect(url)

  if (!req.userData) {
    req.userData = dummyUser()
  }

  BigQueryInsert(req, {
    event_type: 'click_short_url',
    event: JSON.stringify({
      meet_id: meet.id,
      request_id: meet.request,
    }),
  })
}

/**
 * @async
 * @param {string} meetId meetId
 * @returns {string} The url with shortId
 */
function generateShortURL(meetId) {
  return `${webOrigin}/-/${mongoIdToShortId(meetId)}`
}

function getTrackInfo(meet) {
  return {
    status: meet.status,
    archive: meet.archive,
  }
}
