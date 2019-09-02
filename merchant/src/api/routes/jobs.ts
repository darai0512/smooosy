export {}
const moment = require('moment')
const cheerio = require('cheerio')
const axios = require('axios')
const cloneDeep = require('lodash/cloneDeep')
const { BigQueryInsert, dummyUser } = require('../routes/bigquery')
const findMatchingProsForRequest = require('../lib/matching/requestBased')
import { isExactMatch } from '../lib/matching/instant'
const { injectDescriptionIntoQueries } = require('../lib/matching/common')
const { matchingBuckets } = require('../lib/matching/buckets')
const { refundPoint, expirePoints, noticeExpire, earnPoint } = require('./points')
const { linebot, linemsg } = require('../lib/line')
const { Category, Request, Meet, Profile, User, Schedule, LocationService, Service, Location, Lead, MailLog, ProStat, Chat, Contact, ProService } = require('../models')
const { search } = require('../lib/searchConsole')
const { getDistance } = require('../lib/geospatial')
const {
  emailNewRequest, emailManyPass, emailMeetEnd, emailNoMeet, emailRemindMeets, emailRemindMeetsPro,
  emailDailyRemind, emailBookingRemind, emailRemindProfile,
  emailReportInsights, emailSignupAsProFollowup,
} = require('../lib/email')
const { emailCheckExist, slack } = require('../lib/util')
const { timeNumbers, prefectures, wpOrigin, FlowTypes } = require('@smooosy/config')
const emptyGIF = require('fs').readFileSync(`${__dirname}/../assets/empty.gif`, 'utf8')
const redis = require('../lib/redis')
const { runGenerateLocationServices } = require('./locationServices')
const meetsLib = require('../lib/meets')
const { saveMeetEstimation } = require('../lib/estimate')

module.exports = {
  checkMediaDeadImage,
  signedUpProFollowup,
  sendRequestToLocalPro,
  sendManyPass,
  sendNoMeet,
  remindMeets,
  remindMeetEnd,
  dailyRemind,
  bookingRemind,
  updateFinishedJobs,
  remindProfile,
  refundPoints,
  retryPushMessage,
  locationServiceDaemon,
  locationServiceDaemonV2,
  proStats,
  checkExpirePoints,
  checkNoticeExpire,
  reportInsights,
  searchConsoleCheck,
  checkLeadEmail,
  setMeetEstimation,
  pointBack,
}

async function checkMediaDeadImage() {

  // 1x1 img
  const dummyImg = emptyGIF
  let wpDatas = null
  try {
    wpDatas = await axios.get(`${wpOrigin}/wp-json/custom/v1/posts`).then(res => res.data)
  } catch (e) {
    console.error(e)
    return
  }

  const imageUrls = {}
  const retrived = new Set()

  const traversePost = async (id) => {
    if (retrived.has(id)) return
    retrived.add(id)
    let data = null
    try {
      data = await axios.get(`${wpOrigin}/wp-json/wp/v2/posts/${id}`).then(res => res.data)
    } catch (e) {
      console.error(e)
      return
    }
    const link = data.link
    const html = data.content.rendered
    const $ = cheerio.load(html)
    $('body').children().each(function() {
      $(this).find('img').each(function(_, element) {
        const imageUrl = $(element).attr('src')
        if (!imageUrls[imageUrl]) {
          imageUrls[imageUrl] = new Set()
        }
        imageUrls[imageUrl].add(link)
      })
    })
  }
  for (const wpData of wpDatas) {
    await traversePost(wpData.id)
  }


  const deadImageMedia = {}
  const deadImages = []
  for (const key in imageUrls) {
    const paths = key.split('/')
    const filenames = paths[paths.length - 1].split('.')
    if (/^https/.test(key) && filenames.length > 1 && /^[a-fA-F0-9]{24}$/.test(filenames[0])) {
      const img = await axios.get(key).then(res => res.data)
      // nginx側で存在しない画像は1x1の空画像を返す
      if (dummyImg === img) {
        deadImages.push(filenames[0])
        deadImageMedia[key] = imageUrls[key]
      }
    }
  }

  for (const key in deadImageMedia) {
    const message = `:cold_sweat: SMOOOSYメディアの利用画像が削除されました：${key}\n対象メディアページ：${Array.from(deadImageMedia[key]).join('\n')}`
    await slack({message, room: 'cs'})
  }
}

async function signedUpProFollowup() {
  const users = await User.find({
    createdAt: {
      $gt: moment().subtract(33, 'hour'),
      $lte: moment().subtract(9, 'hour'),
    },
    deactivate: {$ne: true},
    pro: true,
  })
  for (const user of users) {
    emailSignupAsProFollowup({user})
  }
}

// 近くのプロから依頼を投げる
async function sendRequestToLocalPro() {
  const start = moment().subtract({hours: timeNumbers.requestExpireHourWithMargin})
  const end = moment().subtract(3, 'minutes')

  const requests = await Request.find({
    status: 'open',
    createdAt: {
      $gt: start.toDate(),
      $lt: end.toDate(),
    },
    // don't match requests that already have 120 sent
    'sent.119': { $exists: false },
    finishedMatching: { $ne: true },
    interview: {$size: 0},
    'meets.4': { $exists: false }, // meets.length < 5
  })
  .populate({
    path: 'pendingMeets',
    select: 'proResponseStatus',
  })
  .select('service')
  .lean()

  const serviceMap = {}
  const serviceIds: any[] = Array.from(new Set(requests.map(r => r.service._id)))
  for (const serviceId of serviceIds) {
    serviceMap[serviceId] = await Service.findById(serviceId)
      .select('name needMoreInfo providerName')
      .populate({
        path: 'queries',
        options: { lean: true },
      })
  }

  for (let r of requests) {
    const inReviews = r.pendingMeets.filter(m => m.proResponseStatus === 'inReview')
    for (const meet of inReviews) {
      await meetsLib.release({ meetId: meet._id.toString() })
    }
    // update request after release
    r = await Request.findById(r._id)
      .populate({
        path: 'sent',
        select: 'pro',
      })
      .populate({
        path: 'meets',
        select: 'pro profile',
      })
      .populate({
        path: 'pendingMeets',
        select: 'pro profile proResponseStatus',
      })
      .populate({
        path: 'customer',
        select: 'lastname',
      })

    r.service = serviceMap[r.service]

    let profiles = await findMatchingProsForRequest({ request: r })
    profiles = await User.populate(profiles, {path: 'pro'})

    for (const p of profiles) {
      // This is mainly used for analytics purposes
      await Contact.createIfNotExists({
        request: r,
        proService: p.proService,
        profile: p,
        isExactMatch: p.isExactMatch,
        matchingBucket: p.matchingBucket,
        meetRate: p.meetRate,
        expectedMeetRate: p.expectedMeetRate,
        matchingAlgorithm: p.matchingAlgorithm,
        userBucket: p.userBucket,
      })
    }

    // 近くのプロ
    const matched = profiles.map(p => p._id)

    let addSpecials = []
    const addSpecialIsExactMatch = {}

    if (r.specialSent.length > 0) {
      const excludes = Array.from(new Set([
        ...matched.map(m => m.toString()),
        ...r.sent.map(s => s._id.toString()),
        ...r.meets.map(m => m.profile.toString()),
        ...r.pendingMeets.map(m => m.profile.toString()),
      ]))
      addSpecials = r.specialSent.filter(rs => !excludes.includes(rs.toString()))

      for (const profileId of addSpecials) {
        const proService = await ProService.findOne({
          profile: profileId,
          service: r.service._id,
        }).select('_id jobRequirements')

        let exactMatch

        if (r.matchParams.showExactMatch) {
          const queries = cloneDeep(r.service.queries)
          injectDescriptionIntoQueries(r.description, queries)

          exactMatch = isExactMatch(queries, proService)
        }

        await Contact.createIfNotExists({
          request: r,
          proService: proService._id,
          profile: profileId,
          isExactMatch: exactMatch,
          matchingBucket: matchingBuckets.MATCHED_BY_USER,
        })

        addSpecialIsExactMatch[profileId] = exactMatch
      }

      matched.push(...addSpecials)
    }

    await Request.findByIdAndUpdate(r.id, {
      $addToSet: {
        sent: { $each: matched },
      },
      // only match once for ideal matching, keep same behavior for normal
      // matching
      finishedMatching: r.matchParams.useIdealMatching ? true : false,
    })

    if (profiles.length > 0) {
      emailNewRequest({
        profiles: profiles.map(p => ({
          pro: p.pro,
          isExactMatch: p.isExactMatch,
        })),
        lastname: r.customer.lastname,
        request: r,
        service: r.service,
      })
    }

    if (addSpecials.length) {
      const profiles = await Profile.find({
        _id: { $in: addSpecials },
      }).populate('pro')

      emailNewRequest({
        profiles: profiles.map(profile => ({
          pro: profile.pro,
          isExactMatch: addSpecialIsExactMatch[profile._id.toString()],
        })),
        lastname: r.customer.lastname,
        request: r,
        service: r.service,
      })
    }
  }
}

// 1日経過してパスが多いリクエストにメールを送る
async function sendManyPass() {

  const start = moment().subtract({hours: 24, minutes: 5})
  const end = moment().subtract(24, 'hours')

  const requests = await Request.find({
    status: 'open',
    createdAt: {
      $gt: start.toDate(),
      $lt: end.toDate(),
    },
    'meets.1': {$exists: false},
    'passed.2': {$exists: true},
    flowType: { $ne: FlowTypes.PPC },
  }).populate({
    path: 'service',
  }).populate({
    path: 'customer',
  })

  for (const r of requests) {
    emailManyPass({
      user: r.customer,
      request: r,
    })
  }
}

// 4日経過して見積もりがないリクエストにメールを送る
async function sendNoMeet() {

  const start = moment().subtract({hours: timeNumbers.requestExpireHour, minutes: 5})
  const end = moment().subtract(timeNumbers.requestExpireHour, 'hours')

  const requests = await Request.find({
    status: 'open',
    createdAt: {
      $gt: start.toDate(),
      $lt: end.toDate(),
    },
    interview: {$size: 0},
    'meets.0': {$exists: false}, // meetsが0
    'sent.2': {$exists: true}, // sentが3以上
    flowType: { $ne: FlowTypes.PPC },
  }).populate({
    path: 'service',
  }).populate({
    path: 'customer',
  })

  for (const r of requests) {
    emailNoMeet({
      user: r.customer,
      request: r,
    })
  }
}

// 2日, 4日, 1週間, 2週間、1ヶ月経過してopenのままのユーザーにリマインドを送る
async function remindMeets(req) {

  const duration = req.body.duration
  const days = req.body.days
  const start = moment().subtract(24 * days + duration, 'hours')
  const end = moment().subtract(24 * days, 'hours')

  const requests = await Request.find({
    status: 'open',
    createdAt: {
      $gt: start.toDate(),
      $lt: end.toDate(),
    },
    'meets.0': {$exists: true}, // meetsがある
    flowType: { $ne: FlowTypes.PPC },
  }).populate({
    path: 'customer',
  }).populate({
    path: 'service',
    select: 'name providerName',
  })

  for (const r of requests) {
    const meets = await Meet
      .find({_id: {$in: r.meets}})
      .select({
        pro: 1,
        chats: {$slice: -1},
        status: 1,
      })
      .populate({
        path: 'pro',
      })
      .populate({
        path: 'chats',
        select: 'createdAt',
      })
    const notExcluded = meets.filter(m => m.status !== 'exclude')
    if (notExcluded.length > 0) {
      emailRemindMeets({
        user: r.customer,
        request: r,
        notExcluded,
        days,
      })
    }
    if (notExcluded.length !== meets.length && (days === 2 || days === 4)
      && notExcluded.filter(m => moment(m.chats[0].createdAt).isAfter(moment().subtract(1, 'days'))).length === 0) {
      for (const m of notExcluded) {
        emailRemindMeetsPro({
          user: m.pro,
          request: r,
          notExcluded,
          meetId: m._id,
          meets,
        })
      }
    }
  }
}

/**
 * @function remindMeetEnd クチコミ依頼のリマインドする
 * @param {Object} req
 *   @param {Object} req.body
 *     @param {int} req.body.days 何日前に送られたクチコミ依頼をリマインドするか
 */
async function remindMeetEnd(req) {
  const days = parseInt(req.body.days)
  const start = moment().subtract((days + 1), 'days')
  const end = moment().subtract(days, 'days')

  const meetEnds = await MailLog.aggregate([
    {
      $match: {
        template: 'emailMeetEnd',
        meet: {$exists: true},
      },
    },
    { $sort: { createdAt: 1 } },
    {
      $group: { // use first meet because if not reviewd, email will be sent every 2 days
        _id: '$meet',
        meet: { $first: '$meet' },
        firstCreatedAt: { $first: '$createdAt' },
      },
    },
    {
      $match: {
        firstCreatedAt: {
          $gt: start.toDate(),
          $lt: end.toDate(),
        },
      },
    },
    { $lookup: { from: 'meets', localField: 'meet', foreignField: '_id', as: 'meet' } },
    { $unwind: '$meet' },
    {
      $match: {
        'meet.status': 'done',
        'meet.review': {$exists: false},
      },
    },
    { $lookup: { from: 'requests', localField: 'meet.request', foreignField: '_id', as: 'request' } },
    { $unwind: '$request' },
    { $lookup: { from: 'users', localField: 'meet.customer', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
    { $lookup: { from: 'profiles', localField: 'meet.profile', foreignField: '_id', as: 'profile' } },
    { $unwind: '$profile' },
    {
      $project: {
        meet: '$meet',
        request: '$request',
        user: '$customer',
        proName: '$profile.name',
      },
    },
  ])

  for (const meetEnd of meetEnds) {
    meetEnd.meet.id = meetEnd.meet._id
    meetEnd.request.id = meetEnd.request._id
    meetEnd.user.id = meetEnd.user._id
    emailMeetEnd(meetEnd)
  }
}

// プロに定期リマインドメール
async function dailyRemind() {

  const users = await User.find({
    pro: true,
    deactivate: {$ne: true},
  })

  for (const user of users) {
    let [ pendingMeets, meets, hired, schedules ] = await Promise.all([
      Meet.find({
        pro: user.id,
        status: 'waiting',
        archive: {$ne: true},
        proResponseStatus: 'tbd',
      })
      .select('request')
      .populate({
        path: 'request',
        match: {
          status: 'open',
          sent: {$in: user.profiles},
          'meets.4': { $exists: false }, // meets.length < 5
          createdAt: {$gt: moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() },
          'passed.profile': {$nin: user.profiles},
          interview: { $ne: 'admin' },
        },
      }),
      Meet.find({
        pro: user.id,
        status: 'waiting',
        archive: {$ne: true},
        proResponseStatus: { $nin: [ 'inReview', 'tbd', 'decline' ] },
      }).populate({
        path: 'request',
      }).populate({
        path: 'chats',
      }),
      Meet.find({
        pro: user.id,
        status: 'progress',
        archive: {$ne: true},
      }).populate({
        path: 'chats',
      }),
      Schedule.find({
        user: user.id,
        type: {$ne: 'block'},
        status: 'pending',
        endTime: {
          $gt: new Date(),
        },
      }),
    ])

    // 未返信のご指名依頼がある(期限切れでない、５人埋まっていない)
    const requests = pendingMeets.filter(m => m.request).map(m => m.request)
    const hasTbdRequest = requests.length > 0
    // 依頼者からの未読メッセージがある
    meets = meets.filter(m => m.request.status === 'open' && m.chats.filter(c => c.user.equals(m.customer) && !c.system && !c.read).length > 0)
    hired = hired.filter(m => m.chats.filter(c => c.user.equals(m.customer) && !c.system && !c.read).length > 0)
    const hasUnreadMsg = meets.length > 0 || hired.length > 0
    // 未返信のスケジュールがある
    const hasUnreplySchedule = schedules.length > 0

    if (hasTbdRequest || hasUnreadMsg || hasUnreplySchedule) {
      emailDailyRemind({ user, requests, meets, hired, schedules })
    }
  }
}

// 予約のリマインド
async function bookingRemind() {

  const schedules = await Schedule.find({
    status: 'accept',
    type: { $ne: 'block' },
    startTime: {
      $gt: moment().endOf('date').toDate(),
      $lt: moment().add(1, 'days').endOf('date').toDate(),
    },
  }).populate({
    path: 'user',
  })

  for (const schedule of schedules) {
    const meet = await Meet
      .findOne({_id: schedule.meet})
      .populate(['pro', 'customer', 'service', 'profile'])

    emailBookingRemind({ user: meet.pro, schedule, meet })
    emailBookingRemind({ user: meet.customer, schedule, meet })
  }
}

async function remindProfile(req) {

  const days = req.body.days
  const start = moment().subtract(days, 'days')
  const end = moment().subtract(days + 1, 'days')
  const users = await User.find({
    pro: true,
    createdAt: {
      $gt: end.toDate(),
      $lt: start.toDate(),
    },
    'profiles.0': { $exists: true }, // profiles.length > 0
    suspend: { $exists: false },
  }).populate({
    path: 'profiles',
  })
  const toRemind = []
  for (const u of users) {
    if (u.profiles.length > 1) u.profiles.sort((a, b) => b.score - a.score)
    if (u.profiles[0].score < 15) toRemind.push(u)
  }
  toRemind.forEach(user => emailRemindProfile({ user }))
}

async function refundPoints() {

  const meets = await Meet.find({
    createdAt: {
      $lt: moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate(),
    },
    read: {$ne: true}, // 未読
    refund: {$ne: true}, // 返金してない
  })

  for (const meet of meets) {
    await refundPoint(meet.id)
  }
}

async function updateFinishedJobs(req) {

  const schedules = await Schedule.aggregate([{
    $match: {
      type: 'job',
      status: 'accept',
      endTime: {
        $gte: moment().subtract(1, 'days').startOf('date').toDate(),
        $lt: moment().subtract(1, 'days').endOf('date').toDate(),
      },
    },
  }, {
    $lookup: {
      from: 'meets',
      localField: 'meet',
      foreignField: '_id',
      as: 'meet',
    },
  }, {
    $unwind: '$meet',
  }, {
    $match: {
      'meet.status': 'progress',
    },
  }])

  for (const schedule of schedules) {
    const preTrackInfo = {
      status: schedule.meet.status,
      archive: schedule.meet.archive,
    }

    const chat = await Chat.create({user: schedule.user, system: true, text: '依頼が完了しました'})
    const updateData = {
      $set: {
        status: 'done',
      },
      $push: {
        chats: chat.id,
      },
    }

    const meet = await Meet.findByIdAndUpdate(schedule.meet, updateData)
      .populate(['customer', 'profile', 'request', 'service'])

    req.userData = dummyUser()
    BigQueryInsert(req, {
      event_type: 'meet_done',
      event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.id, meet_id: meet.id, prev: preTrackInfo }),
    })

    emailMeetEnd({user: meet.customer, proName: meet.profile.name, request: meet.request, meet})

  }
}

async function retryPushMessage() {

  const keys = await redis.keysAsync(`${linemsg}*`)
  if (!keys || keys.length === 0) return

  for (const key of keys) {
    const data = await redis.getAsync(key)
    if (!data) continue
    const params = JSON.parse(data)
    let error = null
    await linebot.post('/message/push', params)
        .catch(err => {
          error = `LINE API リトライエラー ${err.message} ${data}`
        })
    if (error) {
      console.error(error)
      return
    }
    // 送信成功したらkeyを消す
    await redis.delAsync(key)
  }
}

async function locationServiceDaemonV2(req, res) {
  const categories = await Category.find().select('_id key')

  res.json(null)
  for (const category of categories) {
    console.time(`locationServiceDaemonV2:${category.key}`)
    await runGenerateLocationServices(category)
    console.timeEnd(`locationServiceDaemonV2:${category.key}`)
  }
}

async function locationServiceDaemon(req) {

  console.time('locationServiceDaemon')

  // LocationService
  const profiles = await Profile.find({
    hideProfile: {$ne: true},
    suspend: {$exists: false},
    deactivate: {$ne: true},
    description: {$exists: true, $ne: ''},
  })
  .select('services prefecture city loc createdAt')
  .lean()

  const tmp = {}
  const setLocationProfile = (profile, location) => {
    for (const service of profile.services) {
      if (tmp[`${service}_${location.path}`]) {
        tmp[`${service}_${location.path}`].profiles.push(profile._id)
        tmp[`${service}_${location.path}`].count += 1
      } else {
        tmp[`${service}_${location.path}`] = {
          service,
          key: location.key,
          name: location.name,
          parentKey: location.parentKey,
          parentName: location.parentName,
          path: location.path,
          keyPath: location.keyPath,
          profiles: [profile._id],
          count: 1,
          createdAt: profile.createdAt,
        }
      }
    }
  }

  // 各プロフィールが住所一致、地域半径の場合にSP生成
  for (const profile of profiles) {
    const excludeLocations = []
    const locationSelect = 'parentKey parentName key name path keyPath'
    // 住所一致
    const [addressCityLocation, addressPrefLocation] = await Promise.all([
      Location.findOne({
        parentName: profile.prefecture,
        name: {
          $regex: new RegExp(`^${profile.city}$`.replace(/ケ|ヶ/, '[ケ|ヶ]')),
        },
        isPublished: true,
        $or: [{group: {$exists: false}}, {group: {$size: 0}}],
      })
      .select(locationSelect)
      .lean(),
      Location.findOne({
        name: profile.prefecture,
        parentKey: 'japan',
        isPublished: true,
      })
      .select(locationSelect)
      .lean(),
    ])

    if (!addressCityLocation) {
      console.error('cityが見つからないprofile:', profile._id)
      continue
    }
    if (!addressPrefLocation) {
      console.error('prefが見つからないprofile:', profile._id)
      continue
    }

    setLocationProfile(profile, addressCityLocation)
    excludeLocations.push(addressCityLocation.path)

    setLocationProfile(profile, addressPrefLocation)
    excludeLocations.push(addressPrefLocation.path)

    // 地域半径内
    const nearLocations = await Location.aggregate([
      {
        $geoNear: {
          spherical: true,
          near: profile.loc,
          distanceField: 'way',
          limit: 100,
        },
      },
      {
        $match: {
          isPublished: true,
          $or: [{group: {$exists: false}}, {group: {$size: 0}}],
        },
      },
      {
        $project: {
          id: '$_id',
          parentKey: '$parentKey',
          parentName: '$parentName',
          key: '$key',
          name: '$name',
          path: '$path',
          keyPath: '$keyPath',
          diff: { $subtract: [ '$distance', '$way' ] },
        },
      },
      {
        $match: {
          diff: { $gt: 0 },
        },
      },
    ])

    for (const location of nearLocations) {
      if (addressCityLocation.path === location.path || addressPrefLocation.path === location.path) {
        continue
      }
      setLocationProfile(profile, location)
    }
  }

  // 統合地域の取得
  const groupLocations = await Location.find({
    isPublished: true,
    group: {$exists: true, $not: {$size: 0}},
  })
  .select('parentKey parentName key name path keyPath group')
  .populate({path: 'group', select: 'path loc distance'})
  .lean()

  const setGroupLocationProfile = (profile, groupLocation) => {
    for (const service of profile.services) {
      // groupのLocationに含まれていたら統合地域にも追加
      if (tmp[`${service}_${groupLocation.path}`]) {
        tmp[`${service}_${groupLocation.path}`].profiles.push(profile._id)
        tmp[`${service}_${groupLocation.path}`].count += 1
      } else {
        tmp[`${service}_${groupLocation.path}`] = {
          service,
          key: groupLocation.key,
          name: groupLocation.name,
          parentKey: groupLocation.parentKey,
          parentName: groupLocation.parentName,
          path: groupLocation.path,
          keyPath: groupLocation.keyPath,
          isGroup: true,
          profiles: [profile._id],
          count: 1,
          createdAt: profile.createdAt,
        }
      }
    }
  }

  // 統合地域内に含まれているかの判定
  for (const profile of profiles) {
    if (!profile.services || profile.services.length === 0) continue
    for (const groupLocation of groupLocations) {
      for (const group of groupLocation.group) {
        // group地域に含まれていたら統合地域にも追加
        if (tmp[`${profile.services[0]}_${group.path}`]) {
          setGroupLocationProfile(profile, groupLocation)
          break
        // group地域が非公開の場合でも統合地域には含める
        } else {
          // group地域半径内
          const distance = getDistance(profile.loc, group.loc) * 1000
          if (distance < group.distance) {
            setGroupLocationProfile(profile, groupLocation)
            break
          }
        }
      }
    }
  }

  const prefectureList = Object.keys(prefectures).join('|')
  const [categoryLeads, categoryServices, locationCities] = await Promise.all([
    // カテゴリ別Lead
    Lead.aggregate([
      {
        $match: {
          category: {$exists: true},
          description: {$exists: true, $ne: ''},
        },
      },
      {
        $project: {
          id: '$_id',
          address: '$address',
          category: '$category',
          description: '$description',
          createdAt: '$createdAt',
        },
      },
      {
        $group: {
          _id: '$category',
          category: { $first: '$category' },
          items: {
            $push: {
              id: '$_id',
              address: '$address',
              description: '$description',
              createdAt: '$createdAt',
            },
          },
        },
      },
    ]),
    // サービスのカテゴリ
    Service.aggregate([
      {
        $project: {
          tags: {$slice: ['$tags', 1]},
        },
      },
      {
        $unwind: '$tags',
      },
      {
        $group: {
          _id: '$tags',
          category: {$first: '$tags'},
          services: {$push: '$_id'},
        },
      },
    ]),
    // 都道府県直下の市区町村一覧取得
    Location.aggregate([
      {
        $match: {
          parentName: new RegExp(`^(${prefectureList})`),
          isPublished: true,
          $or: [{group: {$exists: false}}, {group: {$size: 0}}],
        },
      },
      {
        $project: {
          parentKey: '$parentKey',
          parentName: '$parentName',
          key: '$key',
          name: '$name',
          path: '$path',
          keyPath: '$keyPath',
        },
      },
      {
        $group: {
          _id: '$parentKey',
          parentKey: {$first: '$parentKey'},
          parentName: {$first: '$parentName'},
          cities: {
            $push: {
              key: '$key',
              name: '$name',
              path: '$path',
              keyPath: '$keyPath',
            },
          },
        },
      },
    ]),
  ])

  const categoryServiceList = {}
  for (const categoryService of categoryServices) {
    categoryServiceList[categoryService.category] = categoryService.services
  }
  const cityList = {}
  for (const locationCity of locationCities) {
    cityList[locationCity.parentName] = locationCity.cities.map(c => c.name).join('|')
  }

  const setLocationLead = (lead, location) => {
    for (const service of lead.services) {
      if (tmp[`${service}_${location.path}`]) {
        if (tmp[`${service}_${location.path}`].count > 24) continue // 24以上はSPに表示しないのでデータとして保存しない
        if (!tmp[`${service}_${location.path}`].leads) tmp[`${service}_${location.path}`].leads = []
        tmp[`${service}_${location.path}`].leads.push(lead.id)
        tmp[`${service}_${location.path}`].count += 1
      } else {
        tmp[`${service}_${location.path}`] = {
          service,
          key: location.key,
          name: location.name,
          parentKey: location.parentKey,
          parentName: location.parentName,
          path: location.path,
          keyPath: location.keyPath,
          leads: [lead.id],
          count: 1,
          createdAt: lead.createdAt,
        }
      }
    }
  }

  // 各見込み顧客が住所一致の場合にカテゴリに含まれるすべてのサービスのSP生成
  for (const categoryLead of categoryLeads) {
    const category = categoryLead.category
    const leads = categoryLead.items

    if (!categoryServiceList[category]) continue

    for (const lead of leads) {
      // 都道府県
      const matchPrefecture = lead.address.match(new RegExp(`^(${prefectureList})`))
      if (!matchPrefecture) continue
      const prefecture = matchPrefecture[1]
      // 市区町村
      if (!cityList[prefecture]) continue
      const matchCity = lead.address.substr(prefecture.length).match(new RegExp(`^(${cityList[prefecture]})`))
      if (!matchCity) continue
      const city = matchCity[1]

      lead.services = categoryServiceList[category]
      const locationSelect = 'parentKey parentName key name path keyPath'
      // 住所一致
      const [addressCityLocation, addressPrefLocation] = await Promise.all([
        Location.findOne({
          parentName: prefecture,
          name: {
            $regex: new RegExp(`^${city}$`.replace(/ケ|ヶ/, '[ケ|ヶ]')),
          },
          isPublished: true,
          $or: [{group: {$exists: false}}, {group: {$size: 0}}],
        })
        .select(locationSelect)
        .lean(),
        Location.findOne({
          name: prefecture,
          parentKey: 'japan',
          isPublished: true,
        })
        .select(locationSelect)
        .lean(),
      ])

      if (addressCityLocation) {
        setLocationLead(lead, addressCityLocation)
      }
      if (addressPrefLocation) {
        setLocationLead(lead, addressPrefLocation)
      }
    }
  }

  const datas: any[] = Object.values(tmp)
  try {
    const bulk = LocationService.collection.initializeOrderedBulkOp()
    // TODO: rollback オプションは移行完了。安定稼働に入ったら消す
    const { removeAll, rollback } = req.body
    if (removeAll === 'true' || rollback === 'true') {
      bulk.find({}).remove()
    }
    for (const d of datas) {
      if (rollback === 'true') {
        bulk.insert(d)
      } else {
        const findData = {
          service: d.service._id,
          key: d.key,
          name: d.name,
          parentKey: d.parentKey,
          parentName: d.parentName,
          path: d.path,
          keyPath: d.keyPath,
          isGroup: !!d.isGroup,
        }
        bulk.find(findData).upsert().updateOne({$set: d})
      }
    }

    await new Promise((resolve) => {
      bulk.execute((err, result) => {
        resolve(result)
      })
    })
  } catch (e) {
    console.log(e)
  }
  console.timeEnd('locationServiceDaemon')
}

async function proStats() {
  const users = await User.find({pro: true}).select('pro')

  for (const user of users) {
    // calling save will update the user's pro stats
    await user.save()
  }
}

async function checkExpirePoints() {
  expirePoints()
}

async function checkNoticeExpire() {
  noticeExpire()
}

async function reportInsights() {

  // 成績のいいプロを抽出
  const stats = await ProStat.find({
    returnOnInvestmentLastMonth: {
      $gt: 5,
    },
  }).populate({
    path: 'pro',
  })

  // メール送信
  for (const stat of stats) {
    const [ meets, profiles ] = await Promise.all([
      Meet
      .find({ pro: stat.pro.id })
      .select('createdAt request')
      .populate({
        path: 'request',
        select: 'createdAt',
      }),
      Profile
      .find({pro: stat.pro.id})
      .select('averageRating reviews'),
    ])

    const hourToMeet = meets.length === 0 ? 0 :
      meets.reduce((sum, m) => sum + (m.createdAt - m.request.createdAt) / 3600000, 0) / meets.length
    const averageRating = profiles.length === 0 ? 0 :
      profiles.reduce((sum, p) => sum + (p.averageRating || 0), 0) / profiles.length
    const reviewCount = profiles.reduce((sum, p) => sum + p.reviews.length, 0)
    emailReportInsights({
      user: stat.pro,
      stat,
      hourToMeet,
      averageRating,
      reviewCount,
    })
  }
}

async function searchConsoleCheck() {
  search()
}

let isRunning = false
async function checkLeadEmail() {

  if (isRunning) return

  isRunning = true
  const leads = await Lead.find({checked: {$ne: true}})
  const check = async () => {
    const lead = leads.shift()
    try {
      const exists = await emailCheckExist(lead.email)
      await Lead.findByIdAndUpdate(lead.id, {$set: {bounce: !exists, checked: true}})
    } catch (e) {
      console.error(e)
    }

    if (leads.length) {
      check()
    } else {
      isRunning = false
    }
  }
  if (leads.length) {
    check()
  } else {
    isRunning = false
  }
}

async function setMeetEstimation() {
  const services = await Service.find().select('_id')
  for (const s of services) {
    s.calcMeetEstimation().then(meetEstimation =>
      saveMeetEstimation(s.id, meetEstimation)
    )
  }
}

async function pointBack() {
  let startOfLastMonth
  if (moment().isSame(moment('2019-05-05'), 'day')) { // only for May (April's consumed point). WILL BE REMOVED!
    startOfLastMonth = moment('2019-04-15').startOf('day').toDate()
  } else {
    startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate()
  }
  const startOfThisMonth = moment().startOf('month').toDate()
  earnPoint({start: startOfLastMonth, end: startOfThisMonth})
}
