export {}
const config = require('config')
const moment = require('moment')
const cheerio = require('cheerio')
const { Profile, Review, Request, Lead, Meet, Service, User, ProStat, Category, ProAnswer, ProService, LineProfile, BlackList } = require('../models')
const { shortIdToMongoId, oidIncludes } = require('../lib/mongoid')
const { getTemplate, emailReviewRequest, emailAdminEditProfile, emailAdminSuspendProfile, emailReviewDone, emailSignupAsPro, emailReplyReview, emailOnBoarding, templateReplacer } = require('../lib/email')
const { shuffle, emailCheckExist, regexpEscaper, compObjRefs, slack } = require('../lib/util')
const requestsForNewPro = require('../lib/matching/newPro')
const sendgrid = require('../lib/sendgrid')
const { removeEmail } = require('../lib/deactivate')
const { googleMaps } = require('../lib/google')
const intercom = require('../lib/intercom')
const epsilon = require('../lib/epsilon')
const { decrypt } = require('../lib/encrypter')
import { getTrends } from './services'
const { handleCSTaskLicence } = require('./cstasks')
const { BigQueryInsert } = require('./bigquery')
const { searchConditions, csEmailTemplates, prefectures } = require('@smooosy/config')

const { fetchRecommendArticleList } = require('./articles')

module.exports = {
  index,
  show,
  showForReview,
  create,
  update,
  review,
  replyReview,
  requestReview,
  reviewEmailTemplate,
  pickup,
  showForInsight,
  near,
  profilePage,
  deactivate,
  suspend,
  resume,
  // admin
  indexForAdmin,
  locationIndexForAdmin,
  showForAdmin,
  showReceiveForAdmin,
  updateForAdmin,
  deactivateForAdmin,
  updateReviewForAdmin,
  deleteReviewForAdmin,
  listCsEmailTemplatesForAdmin,
  sendEmailForAdmin,
  // function
  exportSendGrid,
  findServicesInOtherProfiles,
}

async function index(req, res) {
  const profiles = await Profile
    .find({
      pro: req.user.id,
      deactivate: {$ne: true},
    })
    .populate({path: 'services'})

  res.json(profiles)
}

async function show(req, res) {
  if (req.params.id.length == 16) {
    req.params.id = shortIdToMongoId(req.params.id)
  } else if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).json({message: 'not found'})
  }

  let select = '-score'
  let selectPro = 'imageUpdatedAt identification schedule'
  if (req.user && req.user.profiles.indexOf(req.params.id) !== -1) {
    selectPro += ' phone email'
  } else {
    select += ' -templates -loc'
  }
  let profile = await Profile
    .findOne({
      _id: req.params.id,
      deactivate: {$ne: true},
    })
    .select(select)
    .populate({path: 'services'})
    .populate({path: 'media'})
    .populate({
      path: 'reviews',
      options: {sort: {createdAt: -1}},
      populate: {
        path: 'service',
        model: 'Service',
        select: 'name',
      },
    })
    .populate({
      path: 'pro',
      select: selectPro,
    })
    .populate('licences.licence')
  if (profile === null) return res.status(404).json({message: 'not found'})

  profile = profile.toObject()
  const category = await Category.findOne({name: profile.category}).select('key name')
  if (category) profile.categoryKey = category.key
  if (req.user && req.user.profiles.indexOf(req.params.id) !== -1) {
    const meetsLength = await Meet.count({profile: profile.id})
    profile.meetsLength = meetsLength
  }

  res.json(profile)
}

async function showForReview(req, res) {
  const profile = await Profile.findById(req.params.profileId)
    .select('averageRating name reviews')
    .populate({
      path: 'reviews',
      options: {
        sort: '-createdAt',
      },
    })
  if (profile === null) return res.status(404).json({message: 'not found'})
  res.json(profile)
}

async function create(req, res) {
  const { phone, requestId, sentEmail, questions, services } = req.body
  const { source, content, utm_name, utm_term } = req.body
  const userId = req.user.id

  req.body.pro = userId
  const profiles = await Profile.find({pro: userId})
  const isFirstProfile = profiles.length === 0
  const myServices = [].concat(...profiles.map(p => p.services.map(s => s.toString())))
  req.body.services = services.filter(s => !myServices.includes(s))

  const servicesWithTags = await Service.find({_id: {$in: req.body.services}}).select('tags')
  const categories = await Category.find().select('name')
  let mainCategory = null
  let mainCount = 0
  for (const c of categories) {
    const count = servicesWithTags.filter(s => s.tags.indexOf(c.name) !== -1).length
    if (mainCount < count) {
      mainCategory = c
      mainCount = count
    }
  }

  if (mainCategory) {
    req.body.signupCategory = mainCategory
  }

  const blackList = await BlackList.exists({target: 'instance_id', type: 'exact', text: req.userData.instance_id, enabled: true})
  if (blackList) {
    req.body.suspend = 'admin'
  }
  let profile = await Profile.create(req.body)
  profile = await profile.calcScore()
  const $set: any = {pro: true}
  if (phone) {
    $set.phone = phone.replace(/\-/g, '')
  }
  const user = await User.findByIdAndUpdate(userId, {$set, $addToSet: {profiles: profile.id}})

  for (const service of req.body.services) {
    await ProService.create({
      user: userId,
      profile: profile.id,
      service,
      jobRequirements: [],
      priceValues: [],
      loc: profile.loc,
      address: profile.address,
      prefecture: profile.prefecture,
      city: profile.city,
      distance: profile.distance,
    })
  }

  if (isFirstProfile) {
    emailSignupAsPro({user, profileId: profile.id})

    const event: any = { questions: questions || '' }
    if (source) event.utm_source = source
    if (content) event.utm_content = content
    if (questions) event.utm_medium = questions
    if (utm_name) event.utm_name = utm_name
    if (utm_term) event.utm_term = utm_term
    req.user = user
    req.userData.user_id = userId
    BigQueryInsert(req, {
      event_type: 'signup_pro',
      event: JSON.stringify(event),
    })

    // 案件引っ掛けプロ
    if (requestId) {
      await Request.findByIdAndUpdate(requestId, {$addToSet: {sent: profile.id}})
    } else if (!profile.suspend) {
      // matching
      await requestsForNewPro(profile)
    }

    const emailList = [ user.email ]
    if (sentEmail) emailList.push(sentEmail)
    await Lead.update({
      $or: [
        { email: {$in: emailList} },
        { name: profile.name, address: new RegExp(`^${profile.prefecture}`)},
      ],
    }, {registered: true}, {multi: true})
  }

  const populated = await Profile
    .findOne({_id: profile._id})
    .select('-score')
    .populate({path: 'services'})
    .populate({path: 'media'})
    .populate({
      path: 'pro',
      select: 'imageUpdatedAt identification phone email',
    })

  res.json(populated)

  if (blackList) {
    await slack({message: `ブラックリストのプロが再登録しました。\nhttps://smooosy.com/tools/#/stats/pros/${profile._id.toString()}`, room: 'cs'})
  }
}

async function update(req, res) {
  let profile = await Profile.findOne({_id: req.params.id, pro: req.user.id})
  if (profile === null) return res.status(404).json({message: 'not found'})

  delete req.body.averageRating
  delete req.body.reviews
  delete req.body.score
  delete req.body.suspend

  // null => DELETE
  // [] => DELETE
  // [ null ] => DELETE
  // [ 'id1', 'id2', null ] => [ 'id1', 'id2' ]
  req.body.services = req.body.services || []
  req.body.services = req.body.services.filter(s => s)
  if (req.body.services.length === 0) {
    delete req.body.services
  }

  const prevServices = profile.services.map(ps => ps.toString())
  profile = await Profile.findByIdAndUpdate(profile.id, {$set: req.body})
  profile = await profile.calcScore()

  // do not allow to duplicate services among profiles
  if (req.body.services) {
    const duplicated = await Profile.find({
      pro: req.user.id,
      _id: {$ne: profile.id},
      services: {$in: profile.services},
    })
    for (const p of duplicated) {
      p.services = p.services.filter(s => profile.services.indexOf(s) === -1)
      await Profile.findByIdAndUpdate(p.id, {$set: {services: p.services}})
      await profile.calcScore()
    }

    const { newServices, inOtherProfile, inSameProfile } = await findServicesInOtherProfiles(req.user._id, profile._id, req.body.services)

    for (const service of inSameProfile) {
      await ProService.findOneAndUpdate({user: req.user._id, service}, {$set: {disabled: false}})
    }
    for (const service of inOtherProfile) {
      // 付け替えが必要なサービス
      await ProService.findOneAndUpdate({user: req.user.id, service}, {$set: {profile: profile._id, disabled: false}})
    }
    for (const service of newServices) {
      // 新規にProServiceに追加すべきサービス
      await ProService.create({
        user: req.user.id,
        profile: profile.id,
        service,
        jobRequirements: [],
        priceValues: [],
        loc: profile.loc,
        address: profile.address,
        prefecture: profile.prefecture,
        city: profile.city,
        distance: profile.distance,
      })
    }

    for (const ps of prevServices) {
      // 削除が必要なサービス(prevServicesにのみに存在する)
      if (!req.body.services.includes(ps)) {
        await ProService.findOneAndUpdate({user: req.user.id, service: ps}, {$set: {disabled: true}})
      }
    }
  }

  if (req.body.loc) {
    await ProAnswer.update(
      { profile: profile.id },
      { $set: { loc: req.body.loc, prefecture: profile.prefecture } },
    )
    await ProService.updateLocations({
      userId: req.user.id,
      profileId: profile.id,
      origin: req.body.loc,
      distance: profile.distance,
    })
  }

  await handleCSTaskLicence({profile})
  await show(req, res)
}

async function review(req, res) {
  let profile = await Profile.findById(req.params.id)
  if (profile === null) return res.status(404).json({message: 'not found'})

  req.body.profile = profile.id
  const review = await Review.create(req.body)

  profile = await Profile.findByIdAndUpdate(profile.id, {$push: {reviews: review.id}})
  profile = await profile.calcScore()

  profile = await Profile.findById(profile.id).populate('pro reviews')
  emailReviewDone({user: profile.pro, lastname: review.username, profileId: profile.id})
  res.send()
}

async function replyReview(req, res) {
  const review = await Review.findById(req.params.id)
    .populate({path: 'user', select: 'lastname email'})
    .populate({path: 'meet', select: 'request'})
    .populate({path: 'profile', select: 'name'})
  const user = req.user

  if (!review || user.profiles.indexOf(review.profile.id) === -1) return res.status(404).json({message: 'not found'})

  if (req.body.reply) {
    await Review.findByIdAndUpdate(review.id, {$set: {reply: req.body.reply}})
  }
  if (review.user) {
    emailReplyReview({user: review.user, profile: review.profile, meet: review.meet})
  }
  res.send()
}

const { renderReviewRequest } = require('../ssr/renderParts')
async function requestReview(req, res) {
  const pro = req.user
  const profile = await Profile
    .findOne({_id: req.params.id, pro: req.user.id})
    .select('shortId name')
  if (profile === null) return res.status(404).json({message: 'not found'})

  const existEmails = []
  for (const email of req.body.emails) {
    const exists = await emailCheckExist(email, true)
    if (exists) existEmails.push(email)
  }

  const text = req.body.text
  const mailTemplate = await getTemplate('emailReviewRequest')
  if (mailTemplate === null) return res.status(404).json({message: 'template not found'})

  const $ = cheerio.load(mailTemplate.html_content)

  const reviewHtml = renderReviewRequest({profile, pro, text})
  const replacer = {
    profileName: profile.name,
    profileShortId: profile.shortId,
  }
  $('#reviewRequestMessage').html(reviewHtml)
  const html = templateReplacer($.html(), replacer)
  emailReviewRequest(existEmails, profile, html)

  BigQueryInsert(req, {
    event_type: 'review_request',
    event: JSON.stringify({
      profile_id: profile.id,
      email_count: existEmails.length,
    }),
  })

  res.json({})
}

async function reviewEmailTemplate(req, res) {
  const mailTemplate = await getTemplate('emailReviewRequest')
  if (mailTemplate === null) return res.status(404).json({message: 'template not found'})

  const profile = await Profile.findOne({_id: req.params.id, pro: req.user.id}).select('name shortId')
  if (profile === null) return res.status(404).json({message: 'not found'})

  const $ = cheerio.load(mailTemplate.html_content)
  const text = $('#reviewRequestMessage').text()
  res.json(text)
}

async function pickup(req, res) {
  let profiles = []
  if (req.query.category) {
    const services = await Service
      .find({
        tags: req.query.category,
      })

    profiles = await Profile
      .find({
        suspend: {$exists: false},
        deactivate: {$ne: true},
        hideProfile: {$ne: true},
        description: /^[\s\S]{100,}$/, // description.length >= 100
        services: { $in: services.map(s => s.id) },
      })
      .select('name address description averageRating')
      .sort({ score: -1 })
      .populate({
        path: 'pro',
        select: 'imageUpdatedAt identification',
      })
      .populate({
        path: 'reviews',
      })
      .limit(12)
  }

  profiles = profiles.filter(p => p.pro.imageUpdatedAt)

  if (profiles.length < 12) {
    const pickup = await Profile
      .find({
        _id: {
          $in: config.get('pickup'),
          $nin: profiles.map(p => p.id),
        },
        suspend: {$exists: false},
        deactivate: {$ne: true},
      })
      .select('name address description averageRating')
      .populate({
        path: 'pro',
        select: 'imageUpdatedAt identification',
      })
      .populate({
        path: 'reviews',
      })

    profiles.push(...pickup)
  }

  res.json(shuffle(profiles))
}

async function showForInsight(req, res) {
  const userId = req.user.id
  const profileId = req.params.id

  const profile = await Profile.findById(profileId)
    .select('reviewCount averageRating')
  if (profile === null) return res.status(404).json({message: 'not found'})

  const [ proAnswerCount, meets ] = await Promise.all([
    ProAnswer.countDocuments({
      profile: profileId,
      pro: userId,
    }),
    Meet.find({
      pro: userId,
      profile: profileId,
      createdAt: {
        $gt: moment().subtract(6, 'month').toDate(),
        $lt: moment().subtract(4, 'days').toDate(),
      },
    }).populate({
      path: 'request',
      select: 'createdAt',
    }),
  ])
  const ymd = (t => moment(t).format('YYYYMMDD'))
  // 日をまたぐと、深夜の営業時間外分が加算され、値が大きくなるため filter
  const responseTimesInDay = meets.filter(m => ymd(m.createdAt) === ymd(m.request.createdAt))
    .map(m => m.createdAt - m.request.createdAt)
  const averageTimeToMeet = responseTimesInDay.length === 0 ? null :
    Math.round(responseTimesInDay.reduce((sum, t) => sum + t, 0) / responseTimesInDay.length / 1000 / 60)

  res.json({
    reviewCount: profile.reviewCount,
    averageRating: profile.averageRating,
    proAnswerCount,
    averageTimeToMeet,
  })
}

async function near(req, res) {
  let lat = req.query.lat
  let lng = req.query.lng

  if (req.query.zip) {
    const result = await googleMaps().geocode({address: req.query.zip})
    if (!result) return res.json({count: 0})

    let countryIndex = null
    result.address_components.map((a, i) => {
      if (a.short_name === 'JP' && a.types.indexOf('country') !== -1) countryIndex = i
    })

    if (countryIndex === null) return res.json({count: 0})

    const latlng = result.geometry.location || {}
    lat = latlng.lat
    lng = latlng.lng
  }

  if (!lat || !lng) return res.status(400).json({message: 'parameter error'})

  const query: any = {
    services: req.query.service,
    suspend: {$exists: false},
    deactivate: {$ne: true},
    loc: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(lng),
            parseFloat(lat),
          ],
        },
        $maxDistance: 60 * 1000,
      },
    },
  }
  if (req.user) {
    query.pro = { $ne: req.user.id }
  }

  let count = await Profile.find(query).count()
  count += Math.floor(Math.abs(lat + lng) * 100) % 5 + 3 // 底上げ

  res.json({count})
}

async function profilePage(req, res) {
  if (req.params.id.length == 16) {
    req.params.id = shortIdToMongoId(req.params.id)
  } else if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).json({message: 'not found'})
  }

  const select = '-score -templates -loc'
  const selectPro = 'imageUpdatedAt identification schedule lastAccessedAt'
  let profile = await Profile
    .findOne({
      _id: req.params.id,
      deactivate: {$ne: true},
    })
    .select(select)
    .populate({
      path: 'services',
      populate: {
        path: 'proQuestions',
        match: {isPublished: true},
        select: {text: 1, isPublished: 1, proAnswers: 1 },
        populate: {
          path: 'proAnswers',
          match: { profile: req.params.id },
          select: 'profile text',
        },
      },
    })
    .populate({path: 'media'})
    .populate({
      path: 'reviews',
      options: {sort: {createdAt: -1}},
      populate: {
        path: 'service',
        model: 'Service',
        select: 'name',
      },
    })
    .populate({
      path: 'pro',
      select: selectPro,
    })
    .populate('licences.licence')
  if (profile === null) return res.status(404).json({message: 'not found'})

  let recommends = []
  if (profile.services.length > 0) {
    const service = await profile.services[0]
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
      .execPopulate()
    const duplicate = {}
    recommends = [...service.similarServices, ...service.recommendServices].filter(s => {
      if (duplicate[s.key]) return false
      duplicate[s.key] = s
      return true
    })
    .slice(0, 8)
    .map(s => ({key: s.key, name: s.name}))
  }

  profile = profile.toObject()
  const category = await Category.findOne({name: profile.category}).select('key name wpId')
  // サービス単位に質問を並び替える
  profile.services.sort((a, b) => a.key < b.key)
  // サービスのプロ向け質問を配列に格納
  const proQuestionIds = {}
  profile.proQuestions = profile.services.reduce((services, service) => {
    return service.proQuestions && service.proQuestions.length > 0 ?
    [...services, ...service.proQuestions.reduce((proQuestions, proQuestion) => {
      if (proQuestionIds[proQuestion.id]) {
        return proQuestions
      }
      proQuestionIds[proQuestion.id] = true
      return [...proQuestions, {
        service: service.id,
        id: proQuestion.id,
        text: proQuestion.text,
        isPublished: proQuestion.isPublished,
        answer: proQuestion.proAnswers.length > 0 ? proQuestion.proAnswers[0].text : undefined,
      }]
    }, [])]
    : services
  }, [])
  if (category) profile.categoryKey = category.key
  if (req.user && req.user.profiles.indexOf(req.params.id) !== -1) {
    const meetsLength = await Meet.count({profile: profile.id})
    profile.meetsLength = meetsLength
  }
  profile.recommends = recommends
  profile.trends = await getTrends()

  if (profile.services.length > 0 && req.query.serviceId) {
    const service = profile.services.find(s => s.id === req.query.serviceId && s.enabled)
    if (service) {
      const proService = await ProService.findOne({profile: profile.id, service: service.id}).select('description accomplishment advantage')
      if (proService) {
        profile.description = proService.description || profile.description
        profile.accomplishment = proService.accomplishment || profile.accomplishment
        profile.advantage = proService.advantage || profile.advantage
      }
    }
  }

  if (category && profile.prefecture) {
    const { articles: recommendArticles } = await fetchRecommendArticleList({category: category.wpId, pref: prefectures[profile.prefecture] || 'all', per_page: 4})
    profile.recommendArticles = recommendArticles
  }

  res.json(profile)
}

async function indexForAdmin(req, res) {
  const { condition } = req.body

  const profConditions: any = {}

  // ----------- proStat condition -----------
  const rangeFunction = ({data, type}) => {
    const condition: any = {}
    const func = {
      dateRange: (date, point) => moment(date)[point]('day').toDate(),
      numberRange: num => Number(num),
      percentRange: num => Number(num) / 100,
    }[type]
    if (data[0]) {
      condition.$gte = func(data[0], 'startOf')
    }
    if (data[1]) {
      condition.$lte = func(data[1], 'endOf')
    }
    return condition
  }

  const proStatConditions = {}
  const types = searchConditions.types
  for (const cond of condition.filter(c => c.name !== 'availableRequest')) {
    if (cond.data.length) {
      if ([types.NUMBER_RANGE, types.PERCENT_RANGE, types.DATE_RANGE].includes(cond.type)) {
        proStatConditions[cond.name] = rangeFunction(cond)
      } else if (cond.type === types.REGEXP) {
        proStatConditions[cond.name] = { $regex: regexpEscaper(cond.data[0]), $options: cond.name === 'email' ? 'i' : '' }
      } else if (cond.type === types.RATE) {
        if (cond.data[0] === '増加') {
          proStatConditions[cond.name] = { $eq: true }
        } else {
          proStatConditions[cond.name] = { $eq: false }
        }
      } else if (cond.type === types.SELECT) {
        proStatConditions[cond.name] = { $in: cond.data }
      }
    }
  }

  if (Object.keys(proStatConditions).length) {
    const statProfiles = await ProStat.find(proStatConditions).distinct('profiles')
    profConditions._id = { $in: statProfiles }
  }

  // ----------- profile condition -----------
  const serviceIds = []
  const category = condition.find(cond => cond.type === 'category')
  if (category) {
    const service = await Service.find({'tags.0': category.data}).distinct('_id')
    serviceIds.push(...service)
  }
  const services = condition.find(cond => cond.type === 'service')
  if (services) {
    serviceIds.push(...services.data)
  }
  if (serviceIds.length) {
    profConditions.services = { $in: serviceIds }
  }

  let profiles = await Profile
    .find(profConditions)
    .select('name address deactivate suspend score mainScore licences category services url')
    .sort({createdAt: -1})
    .populate({
      path: 'pro',
      select: 'email lastname phone identification imageUpdatedAt',
    })
    .lean({virtuals: true})

  // ----------- request condition -----------
  const available = condition.find(c => c.name === 'availableRequest')
  if (available) {
    const allAvailable = await Request
      .find({
        status: 'open',
        createdAt: {$gt: moment().subtract(4, 'days').toDate()},
      })
      .select('sent passed.profile')
      .lean()
      .then(reqs => {
        const profiles = {}
        for (const r of reqs) {
          for (const s of r.sent) {
            const id = s.toString()
            if (id in profiles) {
              profiles[id] += 1
            } else {
              profiles[id] = 1
            }
          }
          for (const p of r.passed) {
            // passedにいるならsentには必ずいるので存在確認しない
            profiles[p.profile.toString()] -= 1
          }
        }
        return profiles
      })

    profiles = profiles.filter(p => {
      const count = allAvailable[p.id]
      return (!available.data[0] || count >= available.data[0]) &&
             (!available.data[1] || count <= available.data[1])
    })
  }

  res.json(profiles)
}

async function locationIndexForAdmin(req, res) {

  let locationProfiles = []
  if (req.query.locations) {

    const promise = []
    for (const key in req.query.locations) {
      const { lat, lng, distance } = req.query.locations[key]

      promise.push(Profile.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [
                parseFloat(lng),
                parseFloat(lat),
              ],
            },
            distanceField: 'way',
            maxDistance: parseInt(distance, 10),
            spherical: true,
            limit: 3000,
          },
        },
        { $match: { deactivate: {$ne: true} } },
        { $project: {_id: 1} },
      ]))
    }
    const profileLists = await Promise.all(promise)
    const idList = profileLists.reduce((sum, current) => sum.concat(current.map(c => c._id)), [])

    locationProfiles = await Profile.aggregate([
      { $match: { _id: { $in: idList } } },
      { $group: {
        _id: '$category',
        category: { $last: '$category'},
        profiles: {
          $push: {
            id: '$_id',
            services: '$services',
            loc: '$loc',
            name: '$name',
          },
        },
        count: { $sum: 1 },
      }},
      { $sort: { count: -1 } },
    ])

  }

  res.json(locationProfiles)
}

async function showForAdmin(req, res) {
  const profile = await Profile
    .findOne({
      _id: req.params.id,
    }).populate({
      path: 'services',
      select: 'name tags category matchMoreEditable showJobRequirements',
    }).populate({
      path: 'signupCategory',
      select: 'key name',
    }).populate({
      path: 'reviews',
      options: {sort: {createdAt: -1}},
      populate: {
        path: 'service',
        model: 'Service',
        select: 'name',
      },
    })
    .populate({
      path: 'pro',
      populate: {
        path: 'profiles',
        model: 'Profile',
        select: 'name suspend',
      },
    })
    .populate('stat licences.licence media')
    .lean({virtuals: true})
  if (profile === null) return res.status(404).json({message: 'not found'})

  profile.pro.lineProfile = await LineProfile.findOne({userId: profile.pro.lineId})
  profile.category = await Category.findOne({name: profile.category}).select('key name').lean({virtuals: true}) || {}

  const categoryIds = profile.services.map(s => s.category)
  if (profile.signupCategory) categoryIds.push(profile.signupCategory._id)
  profile.categories = await Category.find({_id: {$in: categoryIds}}).select('key name').lean({virtuals: true})

  try {
    // intercomへのリンクを取得
    const intercomInfo = await intercom.users.find({user_id: profile.pro.id}).then(res => res.body)
    profile.pro.intercomURL = `https://app.intercom.io/a/apps/${intercomInfo.app_id}/users/${intercomInfo.id}`
    profile.pro.userAgent = intercomInfo.user_agent_data
    profile.pro.sessionCount = intercomInfo.session_count
    profile.pro.lastSeenIp = intercomInfo.last_seen_ip
    profile.pro.locationData = intercomInfo.location_data

    // コンビニ決済状況を取得
    const waiting = profile.pro.conveniCode.find(c => c.status === 'waiting')
    if (waiting) {
      profile.pro.conveniInfo = await epsilon.getOrderInfo({trans_code: decrypt(waiting.code)})
        .then(epsilon.filterConveniResponse).catch(() => {})
    }
  } catch (e) {
    // empty
  }

  res.json(profile)
}

async function showReceiveForAdmin(req, res) {
  const [ requests, meets ] = await Promise.all([
    Request
    .find({
      sent: req.params.id,
    })
    .select('status deleted service customer createdAt point')
    .sort({createdAt: -1})
    .populate({
      path: 'service',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    })
    .lean({virtuals: true}),
    Meet
    .find({
      profile: req.params.id,
    })
    .select('status request service customer read hiredAt point refund chatStatus')
    .sort({createdAt: -1})
    .populate({
      path: 'request',
      select: 'status deleted createdAt',
    })
    .populate({
      path: 'service',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    })
    .populate({
      path: 'chats',
      select: 'user read',
    })
    .lean({virtuals: true}),
  ])

  const receive = [...requests, ...meets.map(m => ({
    ...m,
    id: m.request.id,
    createdAt: m.request.createdAt,
  }))].sort((a, b) => b.createdAt - a.createdAt)
  res.json(receive)
}

async function updateForAdmin(req, res) {
  let profile = await Profile.findOne({_id: req.params.id})
  if (profile === null) return res.status(404).json({message: 'not found'})

  if (req.body.updatedAt && !moment(req.body.updatedAt).isSame(profile.updatedAt)) {
    return res.status(409).json({message: 'updatedAt mismatch'})
  }

  const reason = req.body.reason
  delete req.body.reason

  const update: any = {$set: req.body}
  let suspend = update.$set.suspend
  if (suspend === 'recover') {
    delete update.$set.suspend
    update.$unset = {suspend: true}
    suspend = undefined
  } else if (suspend) {
    update.$set.suspend = suspend.join(',')
  }

  const prevServices = profile.services

  profile = await Profile.findByIdAndUpdate(profile.id, update)
  profile = await profile.calcScore()

  // deleted services
  const deleted = prevServices.filter(s => !profile.services.some(ps => compObjRefs(s, ps)))
  await ProService.update(
    { profile: profile._id, service: { $in: deleted } },
    { disabled: true },
    { multi: true }
  )

  const { newServices, inOtherProfile, inSameProfile } = await findServicesInOtherProfiles(profile.pro._id, profile._id, profile.services)
  for (const s of inSameProfile) {
    await ProService.findOneAndUpdate({user: profile.pro._id, service: s}, {$set: {disabled: false}})
  }
  // 付け替えが必要なサービス
  for (const s of inOtherProfile) {
    await ProService.findOneAndUpdate({user: profile.pro._id, service: s}, {$set: {profile: profile._id, disabled: false}})
  }
  // 新しいサービス
  for (const s of newServices) {
    await ProService.create({
      user: profile.pro,
      profile: profile._id,
      service: s,
      jobRequirements: [],
      priceValues: [],
      loc: profile.loc,
      address: profile.address,
      prefecture: profile.prefecture,
      city: profile.city,
      distance: profile.distance,
    })
  }

  if (req.body.distance) {
    await ProService.updateLocations({
      userId: profile.pro,
      profileId: profile._id,
      origin: profile.loc,
      distance: req.body.distance,
    })
  }

  await showForAdmin(req, res)

  const populated = await Profile
    .findOne({_id: profile._id})
    .populate({path: 'pro'})

  if (reason && reason.length) {
    emailAdminEditProfile({user: populated.pro, profile: populated, reason})
  }
  if (suspend && !suspend.includes('admin')) {
    emailAdminSuspendProfile({user: populated.pro, profile: populated, suspend})
  }

  // remove email
  const user = await User.findOne({_id: populated.pro})
  await deleteSendGrid(user)
  await handleCSTaskLicence({profile})
}

async function deactivateForAdmin(req, res) {
  const deactivateProfile = await Profile.findById(req.params.id).select('services pro').lean()
  const migrateProfile = await Profile.findOne({
    _id: {$ne: req.params.id},
    pro: deactivateProfile.pro,
    deactivate: {$ne: true},
  }).select('_id').lean()

  if (!deactivateProfile) return res.status(404).json({message: 'not found'})
  if (!migrateProfile) return res.status(400).json({message: '最低１つ以上のプロフィールを残す必要があります'})

  await Profile.findByIdAndUpdate(migrateProfile._id, {$addToSet: {services: deactivateProfile.services}})
  await Profile.findByIdAndUpdate(deactivateProfile._id, {$set: {
    services: [],
    deactivate: true,
  }})

  // ProService
  await ProService.updateMany({profile: deactivateProfile._id}, {$set: {profile: migrateProfile._id}})

  // remove from user.profiles
  await User.findByIdAndUpdate(deactivateProfile.pro, {$pull: {profiles: deactivateProfile._id}})

  await showForAdmin(req, res)
}

async function updateReviewForAdmin(req, res) {
  const review = await Review.findOne({_id: req.params.id})
  if (review === null) return res.status(404).json({message: 'not found'})

  await Review.findByIdAndUpdate(review.id, {$set: req.body})
  let profile = await Profile.findById(review.profile)
  profile = await profile.calcScore()
  showForAdmin({params: {id: profile.id}}, res)
}

async function deleteReviewForAdmin(req, res) {
  const review = await Review.findById(req.params.id)
  if (review === null) return res.status(404).json({message: 'not found'})
  let profile = await Profile.findById(review.profile)
  if (profile === null) return res.status(404).json({message: 'not found'})

  await Review.findByIdAndRemove(review.id)
  profile = await Profile.findByIdAndUpdate(profile.id, {$pull: {reviews: review.id}})
  await Meet.findOneAndUpdate({review: review.id}, {$unset: {review: 1}})
  await profile.calcScore()

  showForAdmin({params: {id: profile.id}}, res)
}

async function exportSendGrid(req, res) {
  if (process.env.NODE_ENV !== 'production') {
    return res.status(400).json({message: 'productionで実行してください'})
  }

  const profiles = await Profile.find({
    _id: { $in: req.body.profiles },
  })
  .select('suspend deactivate name category mainScore tags createdAt url prefecture')
  .populate({
    path: 'services',
    select: 'tags',
  })
  .populate({
    path: 'pro',
    select: 'email lastname firstname inboundLink bounce',
  })
  const exporting = []
  for (const p of profiles) {
    if (p.pro.bounce || p.suspend || p.deactivate) {
      continue
    }

    const ignore_count = await Request.count({sent: p.id})
    const meet_count = await Meet.count({profile: p.id})
    const hired_count = await Meet.count({profile: p.id, hiredAt: {$exists: true}})

    exporting.push({
      email: p.pro.email,
      last_name: p.pro.lastname,
      first_name: p.pro.firstname,
      company: p.name,
      score: p.mainScore || 0,
      created: moment(p.createdAt).unix(),
      has_url: `${!!p.url}`,
      has_link: `${!!p.pro.inboundLink}`,
      stopped: 'false',
      smooosy_category: p.category,
      state: p.prefecture,
      user_type: 'pro',
      request_receive_count: ignore_count + meet_count,
      meet_count,
      hired_count,
    })
  }

  // see: https://sendgrid.com/docs/API_Reference/Web_API_v3/Marketing_Campaigns/contactdb.html#Update-Recipient-PATCH
  const [response] = await sendgrid.get().request({
    method: 'PATCH',
    url: '/v3/contactdb/recipients',
    body: exporting,
  })

  res.json(response.body)
}

async function deleteSendGrid(user) {
  const nonSuspendedProfiles = await Profile.countDocuments({
    pro: user.id,
    suspend: {$exists: false},
    deactivate: {$ne: true},
  })
  if (nonSuspendedProfiles === 0) {
    return removeEmail(user.email)
  }
}

async function deactivate(req, res) {
  let profile = await Profile.findOne({_id: req.params.id, pro: req.user.id})
  if (profile === null) return res.status(404).json({message: 'not found'})
  profile = await Profile.findByIdAndUpdate(profile.id, {$set: {deactivate: true}})

  let user = await User.findOne({_id: profile.pro})
  if (user === null) return res.status(404).json({message: 'not found'})
  user = await User.findByIdAndUpdate(user.id, {$pull: {profiles: profile.id}})

  await deleteSendGrid(user)

  res.json(user)
}

async function suspend(req, res) {
  const suspends = req.body

  await Profile.update(
    {_id: {$in: suspends}, pro: req.user.id, suspend: {$exists: false}}, // 運営サスペンドのプロフィールは休止にできない
    {$set: {suspend: '一時休止'}},
    {multi: true}
  )
  await deleteSendGrid(req.user)

  res.json({})
}

async function resume(req, res) {
  const resumes = req.body

  await Profile.update(
    {_id: {$in: resumes}, pro: req.user.id, suspend: '一時休止'},
    {$unset: {suspend: true}},
    {multi: true}
  )

  await show(req, res)
}

async function listCsEmailTemplatesForAdmin(req, res) {
  const admin = req.user

  const profileId = req.params.id
  const profile = await Profile.findOne({_id: profileId}).select('name shortId').populate('pro')
  if (profile === null) return res.status(404).json({message: 'not found'})

  const replacer = {
    profileName: profile.name,
    profileShortId: profile.shortId,
    userFirstName: profile.pro.firstname || '',
    userLastName: profile.pro.lastname,
    userEmail: profile.pro.email,
    adminLastName: admin.lastname,
  }

  const mailTemplates: any = await Promise.all(csEmailTemplates.map(c =>
    getTemplate(c.key)
      .then(data => {
        return {
          ...c,
          data,
        }
      })
  ))
  if (mailTemplates.find(m => m.data === null)) return res.status(404).json({message: 'template not found'})

  const data = mailTemplates.map(mailTemplate => {
    // スペース含む空白行が複数入り、改行が複数入ってしまうので削除
    const $ = cheerio.load(mailTemplate.data.html_content)
    // sendgrid が自動的に style を挿入する場合があり、部分的に異なる style になってしまう
    // 現状太文字と link だけ使えれば良いため削除する
    const html = $('#body').html().replace(new RegExp(' style="[^"]*"', 'g'), '').trim()
    return {
      key: mailTemplate.key,
      title: mailTemplate.title,
      subject: templateReplacer(mailTemplate.data.subject, replacer),
      html: templateReplacer(html, replacer),
      text: templateReplacer($('#body').text().trim(), replacer),
    }
  })

  res.json(data)
}

async function sendEmailForAdmin(req, res) {
  const profileId = req.params.id
  const admin = req.user
  const { from, email, template, subject, html } = req.body

  const profile = await Profile.findOne({_id: profileId})
    .populate('pro')
  if (profile === null) return res.status(404).json({message: 'not found'})

  const mailTemplate = await getTemplate(template)
  if (mailTemplate === null) return res.status(404).json({message: 'template not found'})

  const $ = cheerio.load(mailTemplate.html_content)
  $('#body').html(html)

  emailOnBoarding(from, email, profile, admin, subject, $.html(), template)
  res.json({})
}

async function findServicesInOtherProfiles(userId, profileId, services) {
  const ps = await ProService.find({user: userId, service: {$in: services}}).select('service profile').lean()
  const allServices = ps.map(p => p.service)
  const newServices = services.filter(s => !oidIncludes(allServices, s))
  const inOtherProfile = ps.filter(s => !compObjRefs(profileId, s.profile)).map(s => s.service.toString())
  const inSameProfile = ps.filter(s => compObjRefs(profileId, s.profile)).map(s => s.service.toString())
  return { newServices, inOtherProfile, inSameProfile }
}
