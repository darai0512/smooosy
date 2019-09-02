const { Experiment, Category, Chat, Crawl, Faq, Feedback, FormattedRequest, Keyword, Lead, LineProfile, Location, LocationService, MailLog, RuntimeConfig, Media, Meet, MeetTemplate, Memo, Notice, PointBalance, PointBought, PointTransaction, ProAnswer, ProQuestion, ProService, Profile, SearchCondition, ProStat, Query, Request, Review, Schedule, Scraping, SearchKeyword, SearchKeywordRanking, Service, ServiceArea, Townpage, User } = require('../../../src/api/models')
const supertest = require('supertest')
const {ObjectId} = require('mongodb')
const uuidv4 = require('uuid/v4')
const server = require('../../../src/api/server')
const createMeet = require('../../../src/api/routes/meets').create
const { addLimitedPoint } = require('../../../src/api/routes/points')

const locations = {
  tokyo: {
    type: 'Point',
    coordinates: [
      139.7387178,
      35.6710366,
    ],
  },
  tokyoNogizaka: {
    type: 'Point',
    coordinates: [
      139.726605,
      35.668173,
    ],
  },
  sapporo: {
    type: 'Point',
    coordinates: [
      141.3354806,
      43.0595074,
    ],
  },
  saitama: {
    type: 'Point',
    coordinates: [
      139.5088397,
      35.9154916,
    ],
  },
  okinawa: {
    type: 'Point',
    coordinates: [
      127.7025012,
      26.1201911,
    ],
  },
}

const queries = {
  matchMoreBase: {
    tags: [],
    prices: [],
    type: 'singular',
    text: 'basePriceQuestion',
    summary: 'summary',
    options: [{
      unit: '',
      skipQueryIds: [],
      text: 'option1',
      usedForPro: true,
    }, {
      unit: '',
      skipQueryIds: [],
      text: 'option2',
      usedForPro: true,
    }],
    priceFactorType: 'base',
    proText: 'baseQuestion',
    usedForPro: true,
  },
}

const priceValues = {
  single: (query) => {
    return query.options.map((o, idx) => ({
      answers: [o._id],
      requestConditions: [],
      type: query.priceFactorType,
      value: 10000 * (idx + 1),
    }))
  },
}

const requestDescription = {
  selectNFromQuery: (n, query) => ({
    ...query,
    query: query._id,
    answers: query.options.map((o, idx) => ({
      ...o,
      option: o._id,
      checked: idx === n,
    })),
  }),
}

module.exports = {
  requiredParam,
  sleep,
  createServiceData,
  createDataSet,
  createTokyoPro,
  createSpecialProAtOkinawa,
  generateServiceUserProfile,
  generateRequestViaModel,
  generateRequestWithSingularOptionQuery,
  generateRequest,
  generateMeet,
  generateCandidateLocations,
  addProServiceToContext,
  locations,
  postProcess,
  queries,
  priceValues,
  requestDescription,
}

function requiredParam(param, name) {
  if (!param) {
    throw new Error(name + ': required param')
  }
}

function sleep(duration = 500) {
  return new Promise(resolve => setTimeout(resolve, duration))
}

function createServiceData(id, uid) {
  return {
    '_id': id,
    'name': 'テストサービス',
    'queries': [],
    'tags': [
      `カテゴリ名_${uid}`,
    ],
    'description': 'テストサービスの説明',
    'imageUpdatedAt': new Date(),
    'enabled': true,
    'providerName': 'テストサービス',
    'priority': 80,
    'pageTitle': 'テストサービスのタイトル',
    'pageDescription': 'テストサービスページの説明',
    'key': `test-service${id}_${uid}`,
    'pickupMedia': [],
    'basePoint': 5,
    'priceComment': '<div style="font-size: 13px;white-space:initial;">\nSMOOOSYでの見積もり価格の分布です。\n<br /><br />\n<b>価格を左右する要素：</b>\n<br /><br />\n<ol>\n<li><b>撮影時間の長さ</b>（メイクシーン・挙式・披露宴・二次会のどれを撮影するのかによって価格が変動します）</li>\n<li><b>オプション</b>（ビデオ撮影、エンドロール、アルバム作成があると価格が大きく変わります）</li>\n<li><b>撮影時期</b>（春や秋、週末はハイシーズンとなります）</li>\n</div>',
    'interview': false,
    'needMoreInfo': false,
    'similarServices': [],
    'wpId': 11,
    pageInformation: [
      {
        type: 'text',
        column: 2,
        title: 'タイトル',
        text: 'テキスト',
      },
      {
        type: 'text',
        column: 2,
        title: 'タイトル',
        text: 'テキスト',
      },
    ],
  }
}

function createDataSet() {
  const uid = uuidv4()
  const serviceId = ObjectId()
  const service2Id = ObjectId()
  const service3Id = ObjectId()
  const dataSet = {
    category: {
      name: `カテゴリ名_${uid}`,
      key: `categoryName_${uid}`,
      parent: 'event',
    },
    query: {
      'type': 'textarea',
      'text': 'その他の要望やメッセージをご記入ください ※詳細をご記入いただくと見積もりが届きやすくなります',
      'summary': 'プロの方へのメッセージ',
      'options': [{
        text: 'Foo',
        price: 5,
        point: 10,
      }],
      'tags': [],
    },
    query2: {
      type: 'singular',
      text: '撮影場所',
      summary: 'singularQuery',
      usedForPro: true,
      options: [{
        text: 'singularOption1',
        price: 5,
        point: 10,
        usedForPro: true,
      }, {
        text: 'singularOption2',
        price: 6,
        point: 12,
        usedForPro: true,
      }],
      tags: [],
    },
    service: createServiceData(serviceId, uid),
    service2: createServiceData(service2Id, uid),
    service3: createServiceData(service3Id, uid),
    profile: {
      name: 'Akasaka pro with meet rate of 0.4',
      services: [],
      loc: locations.tokyo,
      description: 'aaaaa',
    },
    profile2: {
      name: 'Sapporo pro with meet rate of 0.5',
      services: [],
      loc: locations.sapporo,
      description: 'bbbb',
    },
    user: {
      lastname: `user1_${uid}`,
      email: `test1_${uid}@smooosy.com`,
      token: `token1_${uid}`,
      bounce: true, // メールを送らない
    },
    admin: {
      lastname: `admin1_${uid}`,
      email: `admin_${uid}@smooosy.com`,
      admin: 10,
      token: `adminToken_${uid}`,
      bounce: true,
    },
    pro: {
      lastname: `user2_${uid}`,
      email: `test2_${uid}@smooosy.com`,
      token: `token2_${uid}`,
      pro: true,
      profiles: [],
      bounce: true, // メールを送らない
    },
    pro2: {
      lastname: `user3_${uid}`,
      email: `test3_${uid}@smooosy.com`,
      token: `token3_${uid}`,
      pro: true,
      profiles: [],
      bounce: true, // メールを送らない
    },
    proStat: {
      meetRateLast3Months: 0.4,
      serviceMeetRateLast3Months: 0.8,
    },
    proStat2: {
      meetRateLast3Months: 0.5,
      serviceMeetRateLast3Months: 0.0001,
    },
    proServicesQuery: {
      serviceId,
      location: locations.tokyo,
    },
  }

  dataSet.tokyoProServices = [dataSet.proService]
  dataSet.hokkaidoProServices = [dataSet.proService2]

  return dataSet
}

async function generateServiceUserProfile(t, options = {}) {
  t.context.scenario = {}

  const dataSet = (options && options.dataSet) || createDataSet()
  t.context.category = await Category.create(dataSet.category)
  t.context.textarea = await Query.create(dataSet.query)
  t.context.singular = await Query.create(dataSet.query2)
  t.context.locations = locations

  t.context.service = await Service.create(dataSet.service)
  t.context.service.queries = [t.context.singular.id]
  await t.context.service.save()

  t.context.scenario.services = {
    photoService: t.context.service,
  }

  t.context.service2 = await Service.create(dataSet.service2)
  t.context.service2.queries = [t.context.textarea.id]
  await t.context.service2.save()

  t.context.service3 = await Service.create(dataSet.service3)
  t.context.service3.queries = [t.context.textarea.id]
  await t.context.service3.save()

  t.context.profile = await Profile.create({...dataSet.profile, signupCategory: t.context.category})
  t.context.profile2 = await Profile.create({...dataSet.profile2, signupCategory: t.context.category})

  t.context.user = await User.create(dataSet.user)
  t.context.adminUser = await User.create(dataSet.admin)

  let res = await createPro({
    proData: dataSet.pro,
    profile: t.context.profile,
    service: t.context.service,
    proStatData: dataSet.proStat,
    query: t.context.singular,
    options,
  })
  t.context.pro = res.pro
  t.context.proStat = res.proStat
  t.context.proService = res.proService

  t.context.scenario.pros = {
    akasakaGoodPhotoPro: {
      user: t.context.pro,
      profile: t.context.profile,
      proService: t.context.proService,
      proStat: t.context.proStat,
    },
  }

  res = await createPro({
    proData: dataSet.pro2,
    profile: t.context.profile2,
    service: t.context.service,
    proStatData: dataSet.proStat2,
    query: t.context.textarea,
    options,
  })
  t.context.pro2 = res.pro
  t.context.proStat2 = res.proStat
  t.context.proService2 = res.proService
}

async function createTokyoPro({ query, service, profileDescription }) {
  const tokyoProData = {
    lastname: 'tokyo_pro',
    email: `tokyo_pro${Date.now()}@smooosy.com`,
    token: 'token_tokyo_pro',
    pro: true,
    profiles: [],
    bounce: true, // メールを送らない
  }

  const profileData = {
    name: 'tokyo pro service',
    services: [],
    loc: locations.tokyo,
    description: profileDescription || 'This is a test profile for a Tokyo-based pro',
  }

  return createPro({
    proData: tokyoProData,
    profile: await Profile.create(profileData),
    service,
    query,
    proStatData: {},
  })
}

async function createSpecialProAtOkinawa({service}) {
  const proData = {
    lastname: 'ベアーズ',
    email: `bears_${Date.now()}@smooosy.com`,
    token: 'bears',
    pro: true,
    profiles: [],
    bounce: true, // メールを送らない
  }

  const profileData = {
    _id: '5d1e2c4ee1bea82868399b5a', // ベアーズ
    name: 'ベアーズ',
    services: [],
    loc: locations.okinawa,
    description: 'ベアーズです',
  }

  return createPro({
    proData,
    profile: await Profile.create(profileData),
    service,
    proStatData: {},
  })
}

async function createPro({
  proData, profile, service, proStatData, query, options = {},
}) {
  const pro = await User.create(proData)

  pro.profiles = [profile.id]
  profile.services = [service.id]
  profile.pro = pro.id

  await Promise.all([
    await pro.save(),
    await service.save(),
    await profile.save(),
  ])

  // Pro stats are automatically created/updated when we create/save a pro.
  // This must be run after saving pro or else it will be overwritten.
  const proStat = await ProStat.findOneAndUpdate(
    { pro: pro._id },
    {
      $set: {
        ...proStatData,
        profiles: [profile.id],
        byService: [{
          service: service.id,
          byLookbackDate: [{
            lookbackDate: 'last3Months',
            meetRate: proStatData.serviceMeetRateLast3Months,
          }],
        }],
      },
    }
  )

  let proService = undefined

  if (!options.excludeModels || !options.excludeModels.includes('proService')) {
    proService = await ProService.create({
      user: pro.id,
      profile: profile.id,
      service: service.id,
      loc: profile.loc,
      distance: 50000,
      jobRequirements: query ? [{
        query: query.id,
        answers: [query.options[0].id],
      }] : [],
    })
  }

  return {pro, profile, proStat, proService}
}

// requires `generateServiceUserProfile` to be run before
async function generateRequestViaModel(t) {
  t.context.requestBody = {
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    loc: locations.tokyo,
    description: [
      {
        answers: [{ text: 'お願いします' }],
        type: 'textarea',
        label: 'プロの方へのメッセージ',
      },
      {
        type: 'calendar',
        subType: 'duration',
        label: '日時',
        answers: [
          {
            date: '2018-08-17T15:00:00.000Z',
            start: '10:00',
            end: '翌日1:00',
            text: '2018年8月18日（土）  10:00から翌日1:00まで',
          },
        ],
      },
      {
        query: t.context.singular._id,
        usedForPro: true,
        type: t.context.singular.type,
        answers: [{
          option: t.context.singular.options[0]._id,
          usedForPro: true,
          checked: true,
        }],
      },
    ],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
  }

  t.context.request = await Request.create(t.context.requestBody)
  await t.context.request.populate({
    path: 'service',
    populate: { path: 'queries' },
    options: { lean: true },
  }).execPopulate()
}

async function generateRequestWithSingularOptionQuery(t) {
  const service = await Service.findById(t.context.service.id).populate('queries')

  const query = service.queries[0]

  const data = {
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    loc: locations.tokyo,
    description: [
      {
        query: query.id,
        answers: [{
          option: query.options[0]._id.toString(),
          checked: true,
        }],
        type: 'singular',
        label: 'プロの方へのメッセージ',
      },
    ],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
  }

  const request = await Request.create(data)
  await request.populate({
    path: 'service',
    populate: { path: 'queries' },
  }).execPopulate()

  return request
}

async function generateRequest(t, requestBody, token) {
  // 依頼作成
  token = token || t.context.user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(requestBody)

  //ポイント計算などのため少し間を開ける
  await sleep(100)
  t.context.request = await Request.findById(res.body.id)
}

async function generateMeet(t, requestBody) {
  const pro = t.context.pro
  const request = t.context.request
    // 強制マッチ
  const profile = t.context.profile
  const r = await Request.findById(request.id)
  r.sent = [profile.id]
  await r.save()


  const today = new Date()
    // ポイント獲得
  addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 10,
    expiredAt: today.setDate(today.getDate() + 1),
    type: 'limited',
  })

    // プロが見積もり送信
  let meet
  const res = {json: data => meet = data}
  await createMeet(requestBody, res)
  t.context.meet = await Meet.findById(meet.id)
  t.context.request = await Request.findById(request.id)
}

async function generateCandidateLocations(t) {
  const tokyo = new Location({
    loc: locations.tokyo,
    depth: 1,
    key: 'tokyo',
    keyPath: 'japan,tokyo',
    name: 'tokyo',
    parentKey: 'japan',
    parentName: 'japan',
    path: 'japan,tokyo',
    isPublished: true,
  })

  const saitama = new Location({
    loc: locations.saitama,
    depth: 1,
    key: 'saitama',
    keyPath: 'japan,saitama',
    name: 'saitama',
    parentKey: 'japan',
    parentName: 'japan',
    path: 'japan,saitama',
    isPublished: true,
  })

  t.context.targetLocations = {
    tokyo,
    saitama,
  }

  await Promise.all([ tokyo.save(), saitama.save() ])
}

async function addProServiceToContext(name, context, modifiers, proStatData) {
  let { proService } = await createTokyoPro({
    service: context.service,
    query: context.singular,
    proStatData,
    profileDescription: name,
  })
  proService = await proService.populate('user').execPopulate()
  proService = await proService.populate('profile').execPopulate()
  const proStat = await ProStat.findOne({ pro: proService.user._id })
  if (modifiers) {
    modifiers(proService, proStat)
  }
  await proService.save()
  await proService.profile.save()
  await proService.user.save()
  await proStat.save()
  context[name] = proService
}

async function postProcess() {
  await Category.remove()
  await Chat.remove()
  await Crawl.remove()
  await Experiment.remove()
  await Faq.remove()
  await Feedback.remove()
  await FormattedRequest.remove()
  await Keyword.remove()
  await Lead.remove()
  await LineProfile.remove()
  await Location.remove()
  await LocationService.remove()
  await MailLog.remove()
  await RuntimeConfig.remove()
  await Media.remove()
  await Meet.remove()
  await MeetTemplate.remove()
  await Memo.remove()
  await Notice.remove()
  await PointBalance.remove()
  await PointBought.remove()
  await PointTransaction.remove()
  await ProAnswer.remove()
  await ProQuestion.remove()
  await ProService.remove()
  await Profile.remove()
  await SearchCondition.remove()
  await ProStat.remove()
  await Query.remove()
  await Request.remove()
  await Review.remove()
  await Schedule.remove()
  await Scraping.remove()
  await SearchKeyword.remove()
  await SearchKeywordRanking.remove()
  await Service.remove()
  await ServiceArea.remove()
  await Townpage.remove()
  await User.remove()
}
