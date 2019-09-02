export {}
const test = require('ava')
const nock = require('nock')
const sinon = require('sinon')
const email = require('../../../src/api/lib/email')
const util = require('../../../src/api/lib/util')
// 依頼マッチのメール
sinon.spy(email, 'emailNewRequest')
// 見積もりが付かなかったメール
sinon.spy(email, 'emailNoMeet')
// 朝リマインドメール
sinon.spy(email, 'emailDailyRemind')
// 仕事完了 & クチコミ依頼
sinon.stub(email, 'emailMeetEnd')
sinon.spy(util, 'slack')

const { ObjectID } = require('mongodb')
const moment = require('moment')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const { Request, Meet, Chat, Profile, MailLog, Schedule, Contact } = require('../../../src/api/models')
const { generateServiceUserProfile, generateRequestViaModel, generateMeet, postProcess } = require('../helpers/testutil')
const { sendRequestToLocalPro, checkMediaDeadImage, sendNoMeet, dailyRemind, remindMeetEnd, updateFinishedJobs } = require('../../../src/api/routes/jobs')
const { matchingBuckets } = require('../../../src/api/lib/matching/buckets')
const { wpOrigin, timeNumbers, FlowTypes } = require('@smooosy/config')
const token = 'jobToken'

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
})

test.afterEach.always(async () => {
  await postProcess()
  email.emailNewRequest.resetHistory()
  email.emailNoMeet.resetHistory()
  email.emailMeetEnd.resetHistory()
  util.slack.resetHistory()
})

test.after(() => {
  email.emailNewRequest.restore()
  email.emailNoMeet.restore()
  email.emailMeetEnd.restore()
  util.slack.restore()
})

test('scheduleサーバからのリクエストtokenが正しいか検証する', async t => {
  await generateRequestViaModel(t)

  const res = await supertest(server)
    .post('/api/jobs/sendRequestToLocalPro')
    .set('Authorization', `Bearer ${token}`)

  t.is(res.status, 200)
})

test.serial('依頼がspecialSentにマッチする', async t => {
  // specialSentをもつ依頼
  let r = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    loc: t.context.locations.tokyo,
    // Sapporo pro that would not normally be matched
    specialSent: [t.context.profile2.id],
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    createdAt: moment().subtract({minute: 10}),
    matchParams: { showExactMatch: true },
  })

  // マッチさせる
  await sendRequestToLocalPro()

  // マッチを確認
  r = await Request.findOne({
    _id: r.id,
    sent: t.context.profile.id,
  })
  t.truthy(r)

  const contact = await Contact.findOne({
    request: r.id,
    proService: t.context.proService2.id,
  })

  t.true(contact.isExactMatch)
  t.is(contact.matchingBucket, matchingBuckets.MATCHED_BY_USER)

  //メール送信関数が実行される
  t.true(email.emailNewRequest.called)
})

test.serial('すでにマッチしているspecialSentにはマッチしない', async t => {
  // specialSentにすでにマッチされている
  let r = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    specialSent: [t.context.profile.id],
    sent: [t.context.profile.id],
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    createdAt: moment().subtract({minute: 10}),
  })

  await Profile.deleteOne({ _id: t.context.profile2.id })

  // マッチさせる
  await sendRequestToLocalPro()

  // マッチを確認
  r = await Request.findOne({
    _id: r.id,
    sent: t.context.profile.id,
  })

  t.truthy(r)

  //メール送信関数が実行されない
  t.false(email.emailNewRequest.called)
})

test.serial('すでに応募しているspecialSentにはマッチしない', async t => {
  // specialSentのプロがすでに応募している
  let r = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    specialSent: [t.context.profile.id],
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    createdAt: moment().subtract({minute: 10}),
  })
  const chat = await Chat.create({
    user: t.context.pro.id,
    text: 'こんにちは',
  })
  const meet = await Meet.create({
    customer: t.context.user.id,
    pro: t.context.pro.id,
    profile: t.context.profile.id,
    service: t.context.service.id,
    request: r.id,
    price: 8000,
    priceType: 'fixed',
    chats: [chat.id],
  })
  r.meets = [meet.id]
  await r.save()
  await Profile.deleteOne({ _id: t.context.profile2.id })

  // マッチさせる
  await sendRequestToLocalPro()

  // マッチしないのを確認
  r = await Request.findOne({
    _id: r.id,
    sent: t.context.profile.id,
  })

  t.falsy(r)

  //メール送信関数が実行されない
  t.false(email.emailNewRequest.called)
})

test.serial('SMOOOSYメディア記事の死んでいるプロ画像を探す', async t => {

  const mediaId = 9999999
  const relatedMediaId = 10000000
  const resourcePath = 'https://smooosy.com/img'
  const deadImgId = '5a9e7d3edb0030202863c6dd'
  const mediaListResponse = [
    {
      'id': mediaId,
      'jetpack-related-posts': [
        {
          'id': relatedMediaId,
        },
      ],
    },
  ]

  const mediaResponse = {
    content: {
      rendered: `
{
  "id": ${mediaId},
  "content": {
    "rendered": "<figure id=\"attachment_8188\" class=\"wp-caption aligncenter\"><img class=\"wp-image-8188\" src=\"${resourcePath}/users/${deadImgId}.jpg\" /><figcaption class=\"wp-caption-text\"><strong>個人事業主は屋号で口座を開設できる！</strong></figcaption></figure>"
  }
}
      `,
    },
  }


  const emptyGIF = require('fs').readFileSync(`${__dirname}/../../../src/api/assets/empty.gif`, 'utf8')

  nock(wpOrigin)
    .get('/wp-json/custom/v1/posts')
    .reply(200, mediaListResponse)

  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, mediaResponse)

  nock(resourcePath)
    .get(`/users/${deadImgId}.jpg`)
    .reply(200, emptyGIF)


  // 実行する
  await checkMediaDeadImage()

  // 該当している画像があればslack通知
  t.true(util.slack.called)
})

test.serial('マッチ人数が2人だとemailNoMeetが送られない', async t => {
  // マッチが2人の依頼
  const r = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    specialSent: [t.context.profile.id],
    sent: [
      new ObjectID(), new ObjectID(),
    ],
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    createdAt: moment().subtract({day: 4}),
  })

  // emailNoMeetを送る
  await sendNoMeet()

  t.false(email.emailNoMeet.called)

  // マッチを3人に増やす
  r.sent.push(new ObjectID())
  await r.save()

  // emailNoMeetを送る
  await sendNoMeet()

  t.true(email.emailNoMeet.called)
})



const dailyRemindTest = {
  testcases: [
    {
      title: '期限内で５名以下のご指名依頼がある場合はリマインドメールが送られる',
      request: (t) => ({
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
        createdAt: moment().subtract({minute: 10}).toDate(),
        sent: [t.context.profile.id],
        interview: [],
        flowType: FlowTypes.PPC,
      }),
      meet: (t, request) => ({
        pro: t.context.pro.id,
        profile: t.context.profile.id,
        customer: t.context.user.id,
        request: request.id,
        service: t.context.service.id,
        priceType: 'tbd',
        read: true,
        price: 0,
        isCreatedByUser: true,
        status: 'waiting',
        proResponseStatus: 'tbd',
      }),
      result: true,
    },
    {
      title: '５名のご指名依頼がある場合はリマインドメールが送られない',
      request: (t) => ({
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
        createdAt: moment().subtract({minute: 10}).toDate(),
        sent: [t.context.profile.id],
        interview: [],
        meets: [new ObjectID(), new ObjectID(), new ObjectID(), new ObjectID(), new ObjectID()], // ５名
        flowType: FlowTypes.PPC,
      }),
      meet: (t, request) => ({
        pro: t.context.pro.id,
        profile: t.context.profile.id,
        customer: t.context.user.id,
        request: request.id,
        service: t.context.service.id,
        priceType: 'tbd',
        read: true,
        price: 0,
        isCreatedByUser: true,
        status: 'waiting',
        proResponseStatus: 'tbd',
      }),
      result: false,
    },
    {
      title: '期限切れはリマインドメールが送られない',
      request: (t) => ({
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
        createdAt: moment().subtract(timeNumbers.requestExpireHour + 1, 'hours').toDate(), // 期限切れ
        sent: [t.context.profile.id],
        interview: [],
        flowType: FlowTypes.PPC,
      }),
      meet: (t, request) => ({
        pro: t.context.pro.id,
        profile: t.context.profile.id,
        customer: t.context.user.id,
        request: request.id,
        service: t.context.service.id,
        priceType: 'tbd',
        read: true,
        price: 0,
        isCreatedByUser: true,
        status: 'waiting',
        proResponseStatus: 'tbd',
      }),
      result: false,
    },
    {
      title: 'パスの場合はリマインドメールが送られない',
      request: (t) => ({
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
        createdAt: moment().subtract({minute: 10}).toDate(),
        sent: [t.context.profile.id],
        interview: [],
        passed: [{profile: t.context.profile.id}], // パス
        flowType: FlowTypes.PPC,
      }),
      meet: (t, request) => ({
        pro: t.context.pro.id,
        profile: t.context.profile.id,
        customer: t.context.user.id,
        request: request.id,
        service: t.context.service.id,
        priceType: 'tbd',
        read: true,
        price: 0,
        isCreatedByUser: true,
        status: 'waiting',
        proResponseStatus: 'tbd',
      }),
      result: false,
    },
    {
      title: '運営停止の依頼はリマインドメールに含めない',
      request: (t) => ({
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
        createdAt: moment().subtract({minute: 10}).toDate(),
        sent: [t.context.profile.id],
        interview: ['admin'], // 運営停止
        flowType: FlowTypes.PPC,
      }),
      meet: (t, request) => ({
        pro: t.context.pro.id,
        profile: t.context.profile.id,
        customer: t.context.user.id,
        request: request.id,
        service: t.context.service.id,
        priceType: 'tbd',
        read: true,
        price: 0,
        isCreatedByUser: true,
        status: 'waiting',
        proResponseStatus: 'tbd',
      }),
      result: false,
    },
  ],
}

for (const testcase of dailyRemindTest.testcases) {
  test.serial(testcase.title, async t => {
    // 依頼作成
    const request = await Request.create(testcase.request(t))
    if (testcase.meet) await Meet.create(testcase.meet(t, request))

    await dailyRemind()

    // メール送信関数が実行される or されない
    const judge = testcase.result ? t.true : t.false
    judge(email.emailDailyRemind.called)
    email.emailDailyRemind.resetHistory()

  })
}

test.serial('remindMeetEnd - OK', async t => {
  await generateRequestViaModel(t)
  await generateMeet(t, {
    params: {
      requestId: t.context.request.id,
    },
    body: {
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
    },
    user: t.context.pro,
  })
  t.context.meet.status = 'done'
  await t.context.meet.save()

  await MailLog.create({
    template: 'emailMeetEnd',
    meet: t.context.meet.id,
    createdAt: moment().subtract({day: 2, hour: 1}),
  })

  const req = {
    body: {
      days: 2,
    },
  }

  await remindMeetEnd(req)
  t.true(email.emailMeetEnd.called)
})

test.serial('remindMeetEnd - OK: only send first createdAt', async t => {
  await generateRequestViaModel(t)
  await generateMeet(t, {
    params: {
      requestId: t.context.request.id,
    },
    body: {
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
    },
    user: t.context.pro,
  })

  t.context.meet.status = 'done'
  await t.context.meet.save()

  await MailLog.create({
    template: 'emailMeetEnd',
    meet: t.context.meet._id,
    createdAt: moment().subtract({day: 4, hour: 1}),
  })
  await MailLog.create({
    template: 'emailMeetEnd',
    meet: t.context.meet._id,
    createdAt: moment().subtract({day: 2, hour: 1}),
  })

  const req = {
    body: {
      days: 2,
    },
  }

  await remindMeetEnd(req)
  t.true(email.emailMeetEnd.notCalled)
})

test.serial('updateFinishedJobs: OK', async t => {
  await generateRequestViaModel(t)
  t.context.request.createdAt = moment().subtract({minute: 10})
  await t.context.request.save()
  await generateMeet(t, {
    params: {
      requestId: t.context.request.id,
    },
    body: {
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
    },
    user: t.context.pro,
  })

  t.context.meet.status = 'progress'
  await t.context.meet.save()

  await Schedule.create({
    user: t.context.pro.id,
    type: 'job',
    status: 'accept',
    meet: t.context.meet.id,
    startTime: moment().subtract(2, 'days').toDate(),
    endTime: moment().subtract(1, 'days').startOf('date').toDate(),
  })

  const req = {}
  await updateFinishedJobs(req)

  const meet = await Meet.findById(t.context.meet.id)
    .populate('chats')
  t.is(meet.status, 'done')

  const chat = meet.chats[meet.chats.length - 1]
  t.true(chat.system)
  t.is(chat.text, '依頼が完了しました')
})
