export {}
const test = require('ava')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const moment = require('moment')

const { Schedule, Meet } = require('../../../src/api/models')
const { generateServiceUserProfile, generateRequestViaModel, generateMeet, postProcess } = require('../helpers/testutil')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  await generateRequestViaModel(t)

  await generateMeet(t, {
    params: {
      requestId: t.context.request.id,
    },
    body: {
      profile: t.context.profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
      files: [],
    },
    user: t.context.pro,
  })
})

test.after.always(async () => {
  await postProcess()
})

test('create job request by customer', async t => {
  await t.context.meet.update({$set: {status: 'waiting'}})
  await t.context.request.update({$set: {status: 'open'}})

  const res = await supertest(server)
    .post('/api/schedules')
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send({
      type: 'job',
      status: 'pending',
      meet: t.context.meet.id,
      user: t.context.user.id,
      info: {
        address: '赤坂',
        owner: t.context.pro.id,
      },
      startTime: moment(),
      endTime: moment(),
    })
    .expect(200)

  t.is(res.body.type, 'job')
  t.is(res.body.status, 'pending')

  const m = await Meet.findById(res.body.meet.id).populate('chats')
  t.is(m.status, 'waiting')
  t.is(m.hiredAt, undefined)

  const c = m.chats[m.chats.length - 1]
  t.is(c.user.toString(), t.context.user.id)
  t.is(c.type, 'booking')
})

test('create job accept by pro', async t => {
  await t.context.meet.update({$set: {status: 'waiting'}})
  await t.context.request.update({$set: {status: 'open'}})

  const res = await supertest(server)
    .post('/api/schedules')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .send({
      type: 'job',
      status: 'accept',
      meet: t.context.meet.id,
      user: t.context.pro.id,
      info: {
        address: '赤坂',
        owner: t.context.pro.id,
      },
      startTime: moment(),
      endTime: moment(),
    })
    .expect(200)

  t.is(res.body.type, 'job')
  t.is(res.body.status, 'accept')

  const m = await Meet.findById(res.body.meet).populate('chats')
  // NOTE: 事業者側から意図しない動作をしたという申告が懸念されるため、自動成約は一旦コメントアウト
  //       仕事の日程が認知されたら戻すのを検討
  // t.is(m.status, 'progress')
  // t.not(m.hiredAt, undefined)

  const c = m.chats[m.chats.length - 1]
  t.is(c.user.toString(), t.context.pro.id)
  t.is(c.type, 'booking')
  t.is(c.booking.schedule.toString(), res.body.id)
  t.is(c.booking.action, 'accept')

  // c = m.chats[m.chats.length - 1]
  // t.is(c.user.toString(), t.context.pro.id)
  // t.is(c.text, `${t.context.profile.name}様が仕事の日程を確定しました`)
  // t.true(c.system)
  //
  // const r = await Request.findById(m.request)
  // t.is(r.status, 'close')
})

test('update with accept by pro', async t => {
  const schedule = await Schedule.create({
    user: t.context.user.id,
    type: 'job',
    status: 'pending',
    meet: t.context.meet.id,
    info: {
      owner: t.context.user,
    },
  })

  await t.context.meet.update({$set: {status: 'waiting'}})
  await t.context.request.update({$set: {status: 'open'}})

  const res = await supertest(server)
    .put(`/api/schedules/${schedule.id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .send({
      status: 'accept',
      info: {
        address: '赤坂',
      },
    })
    .expect(200)

  t.is(res.body.type, 'job')
  t.is(res.body.status, 'accept')

  const m = await Meet.findById(schedule.meet).populate('chats')
  // NOTE: 事業者側から意図しない動作をしたという申告が懸念されるため、自動成約は一旦コメントアウト
  //       仕事の日程が認知されたら戻すのを検討
  // t.is(m.status, 'progress')
  // t.not(m.hiredAt, undefined)

  const c = m.chats[m.chats.length - 1]
  t.is(c.user.toString(), t.context.pro.id)
  t.is(c.type, 'booking')
  t.is(c.booking.schedule.toString(), schedule.id)
  t.is(c.booking.action, 'accept')

  // c = m.chats[m.chats.length - 1]
  // t.is(c.user.toString(), t.context.pro.id)
  // t.is(c.text, `${t.context.profile.name}様が仕事の日程を確定しました`)
  // t.true(c.system)
  //
  // const r = await Request.findById(m.request)
  // t.is(r.status, 'close')
})
