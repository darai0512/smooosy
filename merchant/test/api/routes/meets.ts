export {}
const test = require('ava')
const supertest = require('supertest')
const moment = require('moment')
const proxyquire =  require('proxyquire')
const sinon = require('sinon')

const points = require('../../../src/api/routes/points')
sinon.stub(points, 'consumePoint')

const rewire = require('rewire')
const server = require('../../../src/api/server')
const uuidv4 = require('uuid/v4')
const { ObjectId } = require('mongodb')
const { Profile, ProService, Service, User, Request, Meet, Chat } = require('../../../src/api/models')
const { discountPoint } = require('../../../src/api/routes/points')

const { generateServiceUserProfile, postProcess, sleep, createServiceData, locations } = require('../helpers/testutil')
const { MeetStatusType, rolloutDates } = require('@smooosy/config')
const runTestCases = require('../models/helpers/runTestCases')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)

  t.context.request = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    sent: [t.context.profile.id],
  })
  const chat = await Chat.create({
    user: t.context.pro.id,
    text: 'よろしくお願いします',
    read: false,
  })
  t.context.meet = await Meet.create({
    status: 'waiting',
    request: t.context.request.id,
    service: t.context.service.id,
    customer: t.context.user.id,
    pro: t.context.pro.id,
    profile: t.context.profile.id,
    chats: [chat.id],
    price: 10000,
    priceType: 'fixed',
    point: 0,
  })
  t.context.request.meets[t.context.meet.id]
  await t.context.request.save()

  const uid = uuidv4()
  t.context.anonymousUser = await User.create({
    lastname: '匿名',
    email: `test4_${uid}@smooosy.com`,
    token: 'token4',
    bounce: true, // メールを送らない
  })
})

test.after.always(async () => {
  await postProcess()
})

test('ユーザーが届いた応募にアクセスすると応募が既読になる', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 見積もり閲覧
  const res = await supertest(server)
    .get(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 200)
  t.is(res.body.id, meet.id)

  await sleep(1000)

  const m = await Meet.findById(meet.id).populate('request')
  t.is(m.read, true)
  t.is(MeetStatusType.getMeetStatus(m), MeetStatusType.READ)
})

test('プロが送信済み応募にアクセスできる', async t => {
  const pro = t.context.pro
  const meet = t.context.meet

  // 見積もり閲覧
  const res = await supertest(server)
    .get(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${pro.token}`)

  t.is(res.status, 200)
  t.is(res.body.id, meet.id)
})

test('ユーザーが別のユーザーの応募にアクセスすると403になる', async t => {
  const user = t.context.anonymousUser
  const meet = t.context.meet

  // 見積もり閲覧
  const res = await supertest(server)
    .get(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .catch(err => console.log(err))

  t.is(res.status, 403)
  t.is(res.body.message, 'user mismatch')
})

test('ユーザーが検討中に更新', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 見積もり閲覧
  let res = await supertest(server)
    .get(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 200)
  t.is(res.body.id, meet.id)

  // 検討中に更新
  res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      remindMessage: '検討中にしました',
      remindReason: 'price',
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id).populate('request')
  t.is(MeetStatusType.getMeetStatus(m), MeetStatusType.RESPONDED)
})

test('ユーザがプロを雇った', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 成約に更新
  const res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'progress',
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id)
  t.is(m.status, 'progress')
  t.not(m.hiredAt, undefined)
})

test('プロが成約を押した', async t => {
  const pro = t.context.pro
  const meet = t.context.meet

  // 成約に更新
  const res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send({
      status: 'progress',
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id)
  t.is(m.status, 'progress')
  t.not(m.hiredAt, undefined)
})

test('ユーザが成約前にレビューをした', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 完了に更新
  const res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'done',
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id)
  t.is(m.status, 'done')
  t.not(m.hiredAt, undefined)
})

test('ユーザが成約してレビューした', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 成約に更新
  let res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'progress',
    })

  t.is(res.status, 200)

  let m = await Meet.findById(meet.id)
  t.is(m.status, 'progress')
  t.not(m.hiredAt, undefined)

  // 完了に更新
  res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'done',
    })

  t.is(res.status, 200)

  m = await Meet.findById(meet.id)
  t.is(m.status, 'done')
  t.not(m.hiredAt, undefined)
})

test('ユーザがプロを除外した', async t => {
  const user = t.context.user
  const meet = t.context.meet

  const excludeReason = '除外です'
  // 除外に更新
  const res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      excludeReason,
      status: 'exclude',
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id)
  t.is(m.status, 'exclude')
  t.is(m.excludeReason, excludeReason)
})

test('ユーザが成約状態から未成約に戻した', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 成約に更新
  let res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'progress',
    })

  t.is(res.status, 200)

  let m = await Meet.findById(meet.id)
  t.is(m.status, 'progress')
  t.not(m.hiredAt, undefined)

  // 未成約に更新
  res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'waiting',
    })

  t.is(res.status, 200)

  m = await Meet.findById(meet.id)
  t.is(m.status, 'waiting')
  t.is(m.hiredAt, undefined)
})

test('ユーザが完了状態から未成約に戻した', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 見積もり閲覧
  let res = await supertest(server)
    .get(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 200)
  t.is(res.body.id, meet.id)

  // 完了に更新
  res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'done',
    })

  t.is(res.status, 200)

  let m = await Meet.findById(meet.id)
  t.is(m.status, 'done')
  t.not(m.hiredAt, undefined)

  // 未成約に更新
  res = await supertest(server)
    .put(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      status: 'waiting',
    })

  t.is(res.status, 200)

  m = await Meet.findById(meet.id)
  t.is(m.status, 'waiting')
  t.is(m.hiredAt, undefined)
})

test('ユーザーが応募に対してクチコミを投稿できる', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // クチコミ投稿
  const res = await supertest(server)
    .post(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      rating: 5,
      user: user.id,
      username: user.lastname,
      text: 'ありがとうございました',
      thanks: true,
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id).populate('request')
  t.is(MeetStatusType.getMeetStatus(m), 'hired')
})

test('ユーザーが応募に対してQA形式のクチコミを投稿できる', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 100 chars
  const episode = 'hogehogeです'.repeat(10)
  const decision = 'fugafugaです'.repeat(10)
  const evaluation = 'hogefugaだよ'.repeat(10)

  // クチコミ投稿
  const res = await supertest(server)
    .post(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      rating: 5,
      user: user.id,
      username: user.lastname,
      thanks: true,
      details: [
        { title: '依頼した背景', answer:  episode },
        { title: '選んだ決め手', answer: decision },
        { title: '仕事内容', answer: evaluation },
      ],
    })

  t.is(res.status, 200)

  const m = await Meet.findById(meet.id).populate('request, review')
  t.is(MeetStatusType.getMeetStatus(m), 'hired')
  t.is(m.review.details[0].title, '仕事内容')
  t.is(m.review.details[0].answer, evaluation)
  t.is(m.review.details[1].title, '依頼した背景')
  t.is(m.review.details[1].answer, episode)
  t.is(m.review.details[2].title, '選んだ決め手')
  t.is(m.review.details[2].answer, decision)
  t.is(m.review.text, `${evaluation}
依頼した背景は、${episode}
選んだ決め手は、${decision}`)
})

test('ユーザーが応募に対してQA形式のクチコミ投稿で、情報が足りない場合 400 Bad Request になる', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // クチコミ投稿
  const res = await supertest(server)
    .post(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      rating: 5,
      user: user.id,
      username: user.lastname,
      thanks: true,
      details: [
        { title: '依頼した背景', answer: '' },
      ],
    })

  t.is(res.status, 400)
})

test('ユーザーが応募に対してQA形式のクチコミ投稿で、文字数が足りない場合 400 Bad になる', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // クチコミ投稿
  const res = await supertest(server)
    .post(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      rating: 5,
      user: user.id,
      username: user.lastname,
      thanks: true,
      details: [
        // 99 chars
        { title: '依頼した背景', answer: 'A'.repeat(99) },
      ],
    })

  t.is(res.status, 400)
})

test('ユーザーが応募に対してQA形式のクチコミを追記できる', async t => {
  const user = t.context.user
  const meet = t.context.meet

  // 100 chars
  const episode = 'hogehogeです'.repeat(10)
  const decision = 'fugafugaです'.repeat(10)
  const evaluation = 'hogefugaだよ'.repeat(10)

  // クチコミ投稿：仕事内容
  let res = await supertest(server)
    .post(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      rating: 5,
      user: user.id,
      username: user.lastname,
      thanks: true,
      details: [
        { title: '仕事内容', answer: evaluation },
      ],
    })

  t.is(res.status, 200)

  let m = await Meet.findById(meet.id).populate('review')
  t.deepEqual(res.body.review, JSON.parse(JSON.stringify(m.review)))
  t.is(m.review.details[0].title, '仕事内容')
  t.is(m.review.details[0].answer, evaluation)
  t.is(m.review.text, evaluation)

  // クチコミ追記：選んだ決め手
  res = await supertest(server)
    .put(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      details: [
        { title: '選んだ決め手', answer: decision },
      ],
    })

  m = await Meet.findById(meet.id).populate('review')
  t.deepEqual(res.body.review, JSON.parse(JSON.stringify(m.review)))
  t.is(m.review.details[0].title, '仕事内容')
  t.is(m.review.details[0].answer, evaluation)
  t.is(m.review.details[1].title, '選んだ決め手')
  t.is(m.review.details[1].answer, decision)
  t.is(m.review.text, `${evaluation}
選んだ決め手は、${decision}`)

  // クチコミ追記：選んだ決め手
  res = await supertest(server)
    .put(`/api/meets/${meet.id}/review`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      details: [
        { title: '依頼した背景', answer: episode },
      ],
    })

  m = await Meet.findById(meet.id).populate('review')
  t.deepEqual(res.body.review, JSON.parse(JSON.stringify(m.review)))
  t.is(m.review.details[0].title, '仕事内容')
  t.is(m.review.details[0].answer, evaluation)
  t.is(m.review.details[1].title, '依頼した背景')
  t.is(m.review.details[1].answer, episode)
  t.is(m.review.details[2].title, '選んだ決め手')
  t.is(m.review.details[2].answer, decision)
  t.is(m.review.text, `${evaluation}
依頼した背景は、${episode}
選んだ決め手は、${decision}`)
})

test('友達紹介されているプロが見積もりした場合、sendMeetフラグがtrueになる', async t => {
  const user = t.context.user
  const profile = t.context.profile

  const referUser = await User.create({
    lastname: '匿名',
    email: 'test5@smooosy.com',
    token: 'token5',
    pro: true,
    bounce: true, // メールを送らない
  })

  // 紹介元のプロ
  await User.findByIdAndUpdate(user.id, {$set: {refer: {user: referUser.id, sendMeet: false, hasActiveCard: true}}})

  // 見積もり
  const res = await supertest(server)
    .post(`/api/requests/${t.context.request.id}/meets`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      chat: 'お願いします',
      files: [],
      price: 1000,
      priceType: 'fixed',
      profile: profile.id,
    })

  t.is(res.status, 200)

  const updateUser = await User.findById(user.id)
  t.is(updateUser.refer.user.toString(), referUser.id.toString())
  t.is(updateUser.refer.sendMeet, true)
})


test('toolsで成約に設定したら依頼が閉じ、未成約に戻すと依頼がopenになる', async t => {
  const { meet, adminUser } = t.context

  // waiting => progress
  let res = await supertest(server)
    .put(`/api/admin/meets/${meet.id}`)
    .set('Authorization', `Bearer ${adminUser.token}`)
    .send({
      status: 'progress',
    })
  t.is(res.status, 200)

  let r = await Request.findById(t.context.request.id)
  t.is(r.status, 'close')

  // progress => waiting
  res = await supertest(server)
    .put(`/api/admin/meets/${meet.id}`)
    .set('Authorization', `Bearer ${adminUser.token}`)
    .send({
      status: 'waiting',
    })
  t.is(res.status, 200)

  r = await Request.findById(t.context.request.id)
  t.is(r.status, 'open')
})

test('ユーザーが返事をするとchatStatusがresponded', async t => {
  const user = t.context.user
  let meet = t.context.meet

  // 見積もり閲覧
  await supertest(server)
    .get(`/api/meets/${meet.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .expect(200)

  // 返事
  await supertest(server)
    .post('/api/chats')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      meetId: meet.id,
      text: '返事です',
    })
  meet = await Meet.findById(meet.id)
  t.is(meet.chatStatus, MeetStatusType.RESPONDED)
})

test('ご指名依頼を引き受ける', async t => {
  const pro = t.context.pro
  let meet = t.context.meet
  meet.proResponseStatus = 'tbd'
  await meet.save()

  await supertest(server)
    .post(`/api/meets/${meet.id}/accept`)
    .set('Authorization', `Bearer ${pro.token}`)
    .expect(200)

  meet = await Meet.findById(meet.id)
  t.is(meet.proResponseStatus, 'accept')
})

test('ご指名依頼を辞退する', async t => {
  const pro = t.context.pro
  let meet = t.context.meet
  meet.proResponseStatus = 'tbd'
  await meet.save()

  await supertest(server)
    .post(`/api/meets/${meet.id}/decline`)
    .set('Authorization', `Bearer ${pro.token}`)
    .expect(200)

  meet = await Meet.findById(meet.id)
  t.is(meet.proResponseStatus, 'decline')
})

test('Don\'t trust point of pendingMeet and re-calculate on demand', async t => {
  const pendingMeet = await Meet.create({
    status: 'waiting',
    proResponseStatus: 'tbd',
    request: t.context.request.id,
    service: t.context.service.id,
    customer: t.context.user.id,
    pro: t.context.pro2.id,
    profile: t.context.profile2.id,
    chats: [],
    price: 10000,
    priceType: 'fixed',
    point: 999, // Don't use this point
  })
  await User.findByIdAndUpdate(t.context.pro2.id, {$set: {hasActiveCard: true}})
  await Request.findByIdAndUpdate(
    t.context.request,
    { $addToSet: { pendingMeets: pendingMeet._id } }
  )

  let res = await supertest(server)
    .get(`/api/pros/meets/${pendingMeet._id}`)
    .set('Authorization', `Bearer ${t.context.pro2.token}`)

  t.is(res.status, 200)
  t.is(res.body.point, 0) // discounted

  // accept by pro
  res = await supertest(server)
    .post(`/api/meets/${pendingMeet._id}/accept`)
    .set('Authorization', `Bearer ${t.context.pro2.token}`)

  t.is(res.status, 200)
  const meet = await Meet.findById(pendingMeet._id)
  t.is(meet.proResponseStatus, 'accept')
  t.is(meet.point, 0)
})

test('calcCurrentPoint returns meet\'s point based on current request, meet and pro', async t => {
  const pendingMeet = await Meet.create({
    status: 'waiting',
    proResponseStatus: 'tbd',
    request: t.context.request.id,
    service: t.context.service.id,
    customer: t.context.user.id,
    pro: t.context.pro2.id,
    profile: t.context.profile2.id,
    chats: [],
    price: 10000,
    priceType: 'fixed',
    point: 999, // Don't use this point
  })
  await User.findByIdAndUpdate(t.context.pro2.id, {$set: {hasActiveCard: true}})
  const request = await Request.findByIdAndUpdate(
    t.context.request,
    { $addToSet: { pendingMeets: pendingMeet._id } }
  )

  const meets = rewire('../../../src/api/routes/meets')
  const calcCurrentPoint = meets.__get__('calcCurrentPoint')

  const result = await calcCurrentPoint({meet: pendingMeet, request, proId: pendingMeet.pro._id})
  const point = result.point
  t.is(point, 0)
})

test('302 is responded from showForPro when pro in specialSent', async t => {
  const meet = t.context.meet
  await Request.findByIdAndUpdate(t.context.request._id, {$push: {specialSent: meet.profile}})
  const res = await supertest(server)
    .get(`/api/pros/requests/${t.context.request._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)

  t.is(res.status, 302)
})

test('302 is responded from create when already created a meet', async t => {
  const res = await supertest(server)
    .post(`/api/requests/${t.context.request._id}/meets`)
    .send({
      request: t.context.request.id,
      service: t.context.service.id,
      customer: t.context.user.id,
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      price: 10000,
      priceType: 'fixed',
    })
    .set('Authorization', `Bearer ${t.context.pro.token}`)
  t.is(res.status, 302)
})

// in beforeEach, always one meet is created before running a testCase
// TODO: Delete these tests after finishing credit card campaign
const testCase = [{
  nonSerial: true,
  name: 'point become 1 on car-category-service and matchmore pro',
  modifier: async (t) => {
    const carServiceData = createServiceData(ObjectId(), uuidv4())
    carServiceData.tags = ['車検・修理']
    carServiceData.matchMoreEditable = true
    const carService = await Service.create(carServiceData)
    t.context.targetService = carService._id
  },
  conditions: {
    proService: {setupLocation: true, setupJobRequirements: true, setupPriceValues: true},
    user: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}},
  },
  expectations: async () => {
    return {
      meetPoint: 1,
    }
  },
}, {
  nonSerial: true,
  name: 'point become 1 on car-category-service and matchmore pro and 0-point-request',
  modifier: async (t) => {
    const carServiceData = createServiceData(ObjectId(), uuidv4())
    carServiceData.tags = ['車検・修理']
    carServiceData.matchMoreEditable = true
    const carService = await Service.create(carServiceData)
    t.context.targetService = carService._id
  },
  conditions: {
    request: {point: 0},
    proService: {setupLocation: true, setupJobRequirements: true, setupPriceValues: true},
    user: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}},
  },
  expectations: async () => {
    return {
      meetPoint: 0,
    }
  },
}, {
  nonSerial: true,
  name: 'point doesn\'t become 1 on car-category-service and non-matchMoreEditable and matchmore pro and 0-point-request',
  modifier: async (t) => {
    const carServiceData = createServiceData(ObjectId(), uuidv4())
    carServiceData.tags = ['車検・修理']
    carServiceData.matchMoreEditable = false
    const carService = await Service.create(carServiceData)
    t.context.targetService = carService._id
  },
  conditions: {
    request: {point: 10},
    proService: {setupLocation: true, setupJobRequirements: true, setupPriceValues: true},
    user: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}},
  },
  expectations: async t => {
    const result = await discountPoint({
      meetsCount: 1,
      hiredCount: 0,
      point: 10,
      autoAccepted: false,
      serviceId: t.context.targetService,
      proId: t.context.pro._id,
    })
    return {
      meetPoint: result.point,
    }
  },
}, {
  nonSerial: true,
  name: 'point doesn\'t become 1 on car-cateogry-service and non-matchmore pro',
  modifier: async (t) => {
    const carServiceData = createServiceData(ObjectId(), uuidv4())
    carServiceData.tags = ['車検・修理']
    carServiceData.matchMoreEditable = true
    const carService = await Service.create(carServiceData)
    t.context.targetService = carService._id
  },
  conditions: {
    proService: {setupLocation: true, setupJobRequirements: true, setupPriceValues: false},
    user: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}},
  },
  expectations: async t => {
    const result = await discountPoint({
      meetsCount: 1,
      hiredCount: 0,
      point: 10,
      autoAccepted: false,
      serviceId: t.context.targetService,
      proId: t.context.pro._id,
    })
    return {
      meetPoint: result.point,
    }
  },
}, {
  nonSerial: true,
  name: 'point doesn\'t become 1 on non-car-cateogry-service and matchmore pro',
  modifier: async (t) => {
    const carServiceData = createServiceData(ObjectId(), uuidv4())
    carServiceData.tags = ['non-car']
    carServiceData.matchMoreEditable = true
    const carService = await Service.create(carServiceData)
    t.context.targetService = carService._id
  },
  conditions: {
    proService: {setupLocation: true, setupJobRequirements: true, setupPriceValues: true},
    user: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}},
  },
  expectations: async t => {
    const result = await discountPoint({
      meetsCount: 1,
      hiredCount: 0,
      point: 10,
      autoAccepted: false,
      serviceId: t.context.targetService,
      proId: t.context.pro._id,
    })
    return {
      meetPoint: result.point,
    }
  },
}, {
  nonSerial: true,
  name: 'point doesn\'t become 1 on non-car-cateogry-service and non-matchmore pro',
  modifier: async (t) => {
    const carServiceData = createServiceData(ObjectId(), uuidv4())
    carServiceData.tags = ['non-car']
    carServiceData.matchMoreEditable = true
    const carService = await Service.create(carServiceData)
    t.context.targetService = carService._id
  },
  conditions: {
    proService: {setupLocation: true, setupJobRequirements: true, setupPriceValues: false},
    user: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}},
  },
  expectations: async t => {
    const result = await discountPoint({
      meetsCount: 1,
      hiredCount: 0,
      point: 10,
      autoAccepted: false,
      serviceId: t.context.targetService,
      proId: t.context.pro._id,
    })
    return {
      meetPoint: result.point,
    }
  },
}]

const createMatchMoreMeet = async (t, tc) => {
  if (tc.modifier) {
    await tc.modifier(t)
  }
  const targetService = t.context.targetService._id
  // add service and create proService
  await supertest(server)
    .put(`/api/profiles/${t.context.profile._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .send({services: [targetService._id]})
    .expect(200)

  // update user and proservice to become a target of creditcard campaign
  await User.findByIdAndUpdate(t.context.profile.pro, {$set: tc.conditions.user})
  await ProService.findOneAndUpdate({profile: t.context.profile._id, service: targetService._id}, {$set: tc.conditions.proService}).lean()

  // request created
  const body = {
    service: targetService._id,
    loc: { coordinates: [ 139.56231318417963, 35.72383805086727 ], type: 'Point' },
    description: [{
      type: 'calendar',
      answers: [{
        date: moment().add(10, 'day').toDate(),
        start: 10,
      }],
    }, {
      type: 'textarea',
      label: 'プロの方へのメッセージ',
      answers: [{
        type: 'textarea',
        label: 'プロの方へのメッセージ',
        answers: [
          {
            text: '',
          },
        ],
      }],
    }],
  }

  const res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send(body)
    .expect(200)
  await Request.findByIdAndUpdate(res.body._id, {$set: tc.conditions.request || {point: 10}}).lean()

  // create matchmore meet
  await supertest(server)
    .post(`/api/requests/${res.body._id}/meetsByUser`)
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send([t.context.profile._id])
    .expect(200)
  const meet = await Meet.findOne({request: res.body._id, profile: t.context.profile._id}).lean()
  const expectations = await tc.expectations(t)
  t.is(meet.point, expectations.meetPoint)
}

// Only run while doing credit card campaign
// TODO: Delete this after finishing matchmore campaign
if (moment().isSameOrAfter(rolloutDates.enableMatchMoreCampaign)
&& moment().isSameOrBefore(rolloutDates.disableMatchMoreCampaign)) {
  runTestCases(test, testCase, createMatchMoreMeet)
}

const testCases = [{
  name: 'case: [0, 0] meet.point is not more than meet.request.point',
  meet: 0,
  request: 0,
}, {
  name: 'case: [0, 1] meet.point is not more than meet.request.point',
  meet: 0,
  request: 1,
}, {
  name: 'case: [1, 0] meet.point is not more than meet.request.point',
  meet: 1,
  request: 0,
}, {
  name: 'case: [1, 1] meet.point is not more than meet.request.point',
  meet: 1,
  request: 1,
}, {
  name: 'case: [1, 2] meet.point is not more than meet.request.point',
  meet: 1,
  request: 2,
}, {
  name: 'case: [2, 1] meet.point is not more than meet.request.point',
  meet: 2,
  request: 1,
}]

const pointCheckTest = async (t, tc) => {
  await Meet.findByIdAndUpdate(t.context.meet._id, {$set: {point: tc.meet}})
  await Request.findByIdAndUpdate(t.context.request._id, {$set: {point: tc.request}, $push: {meets: t.context.meet._id}})

  const res = await supertest(server)
    .get(`/api/pros/meets/${t.context.meet._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  const meet = res.body
  t.true(meet.point <= meet.request.point)
}

runTestCases(test, testCases, pointCheckTest)

const meetLengthTestCases = [{
  name: '6th promo pro with 5 promo meets',
  promos: [true, true, true, true, true, true],
  expects: [200, 200, 200, 200, 200, 400],
}, {
  name: '6th non-promo pro with 5 promo meets',
  promos: [true, true, true, true, true, false],
  expects: [200, 200, 200, 200, 200, 400],
}, {
  name: '6th promo pro with 4 promo meets and 1 non-promo meet',
  promos: [true, true, true, true, false, true],
  expects: [200, 200, 200, 200, 200, 200],
}, {
  name: '6th non-promo pro with 4 promo meets and 1 non-promo meet',
  promos: [true, true, true, true, false, false],
  expects: [200, 200, 200, 200, 200, 200],
}]

const meetLengthTest = async (t, tc) => {
  const req = await Request.findById(t.context.request._id)
  req.loc = locations.tokyo
  await req.save()

  for (let i = 0; i < tc.promos.length; i++) {
    const uid = uuidv4()
    const pro = await User.create({
      lastname: `user2_${uid}`,
      email: `test2_${uid}@smooosy.com`,
      token: `token2_${uid}`,
      pro: true,
      profiles: [],
      schedule: {
        dayOff: new Array(7).fill(false),
        startTime: 1,
        endTime: 23,
      },
      bounce: true, // メールを送らない
    })
    const profile = await Profile.create({
      name: `pro_${uid}`,
      services: [t.context.service._id],
      loc: locations.tokyo,
      description: 'aaaaa',
      pro: pro._id,
    })
    pro.profiles.push(profile._id)
    await pro.save()
    await ProService.create({
      user: pro._id,
      service: t.context.service._id,
      profile: profile._id,
      loc: locations.tokyo,
      setupLocation: true,
      setupJobRequirements: true,
      setupPriceValues: true,
      isPromoted: tc.promos[i],
    })
    const res = await supertest(server)
      .post(`/api/requests/${req._id}/meetsByUser`)
      .send([profile._id])
      .set('Authorization', `Bearer ${t.context.user.token}`)

    t.is(tc.expects[i], res.status)
  }
}

runTestCases(test, meetLengthTestCases, meetLengthTest)

const releaseTestCases = [{
  name: '6th meets to be tbd with 5 meets',
}]

const releaseTest = async (t) => {
  let req = await Request.findById(t.context.request._id)
  req.loc = locations.tokyo
  req.interview = ['admin']
  await req.save()

  const release = proxyquire('../../../src/api/lib/meets/release', {
    '../../routes/points': {
      consumePoints: async function() {
        return null
      },
      buyPoints: async function() {
        return null
      },
    },
  })
  for (let i = 0; i < 6; i++) {
    const uid = uuidv4()
    const pro = await User.create({
      lastname: `user2_${uid}`,
      email: `test2_${uid}@smooosy.com`,
      token: `token2_${uid}`,
      pro: true,
      profiles: [],
      schedule: {
        dayOff: new Array(7).fill(false),
        startTime: 1,
        endTime: 23,
      },
      bounce: true, // メールを送らない
    })
    const profile = await Profile.create({
      name: `pro_${uid}`,
      services: [t.context.service._id],
      loc: locations.tokyo,
      description: 'aaaaa',
      pro: pro._id,
    })
    pro.profiles.push(profile._id)
    await pro.save()
    await ProService.create({
      user: pro._id,
      service: t.context.service._id,
      profile: profile._id,
      loc: locations.tokyo,
      setupLocation: true,
      setupJobRequirements: true,
      setupPriceValues: true,
      setupBudget: true,
      budget: 50,
      isPromoted: true,
    })
    let meet
    if (i !== 5) {
      const res = await supertest(server)
        .post(`/api/requests/${req._id}/meetsByUser`)
        .send([profile._id])
        .set('Authorization', `Bearer ${t.context.user.token}`)
        .expect(200)
      meet = res.body[0]
    } else {
      const excessive = await Meet.create({
        request: req._id,
        service: t.context.service._id,
        customer: t.context.user._id,
        profile: profile._id,
        pro: t.context.pro._id,
        proResponseStatus: 'inReview',
        status: 'waiting',
        isExactMatch: true,
        point: 1,
        price: 1,
      })
      meet = excessive
      await Request.updateOne({_id: req._id}, {$push: {pendingMeets: excessive._id}})
    }
    await release({meetId: meet._id})
    meet = await Meet.findById(meet._id)
    req = await Request.findById(req._id)
    t.is(meet.proResponseStatus, i === 5 ? 'tbd' : 'autoAccept')
    t.true(req.meets.length <= 5)
  }
}

runTestCases(test, releaseTestCases, releaseTest)
