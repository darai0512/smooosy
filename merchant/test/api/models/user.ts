export {}
const test = require('ava')
const { ObjectID } = require('mongodb')
const moment = require('moment')
const uuidv4 = require('uuid/v4')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const { User, Request, ProAnswer, Notice, Media } = require('../../../src/api/models')
const { generateServiceUserProfile, generateRequest, generateMeet } = require('../helpers/testutil')

test('User model', async t => {
  const uid = uuidv4()
  const id = new ObjectID()
  const user = await User.create({
    _id: id,
    lastname: `user1_${uid}`,
    email: `test1_${uid}@smooosy.com`,
  })

  t.is(user.lastname, `user1_${uid}`)
  t.is(user.email, `test1_${uid}@smooosy.com`)
  t.is(typeof user.shortId, 'string')
  t.is(user.image, 'https://dev.smooosy.com/img/users/anonymous.png?')

  const now = new Date()
  user.imageUpdatedAt = now
  t.is(user.image, `https://dev.smooosy.com/img/users/${id}.jpg?${now.getTime()}`)

  // transform
  t.is(user.toJSON().password, false)

  const created = await User.findById(user.id)
  t.not(created, null)
})

test('User method', async t => {
  const uid = uuidv4()
  const pass = 'pass'
  const user = new User({
    lastname: `user2_${uid}`,
    email: `test2_${uid}@smooosy.com`,
    password: pass,
    token: User.generateToken(),
  })
  user.password = User.cipher(pass, user.email)

  t.is(user.verify(pass), true)
  t.is(user.token.length, 32)

  // transform
  t.is(user.toJSON().password, true)
})

test('条件を満たさないと退会出来ない', async t => {
  await generateServiceUserProfile(t)
  const { user, pro, profile, service } = t.context

  t.is(await user.isDeactivatable(), true)

  const requestReq: any = {
    customer: user.id,
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': '依頼その1',
        },
      ],
    }],
    interview: [],
  }
  await generateRequest(t, requestReq, user.token)

  // 期限が切れていない依頼は応募が0でも退会できない
  t.is(await user.isDeactivatable(), false)

  let { request } = t.context
  const meetReq = {
    params: {
      requestId: request.id,
    },
    body: {
      profile: profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
      files: [],
    },
    user: pro,
  }
  await generateMeet(t, meetReq)
  request.createdAt = moment().subtract(100, 'hour')
  await request.save()

  // openかつ応募がある場合は期限切れでも退会できない
  t.is(await user.isDeactivatable(), false)

  await Request.update({_id: request.id}, {status: 'close', hiredAt: new Date()})
  // 成約して直後も退会できない
  t.is(await user.isDeactivatable(), false)

  request = await Request.findById(request.id)
  request.createdAt = moment().subtract(40, 'day')
  await request.save()
  // 成約の場合、1ヶ月たつと退会できる
  t.is(await user.isDeactivatable(), true)

  requestReq.createdAt = moment().subtract(100, 'hour')
  await generateRequest(t, requestReq)
  // 期限切れでmeetが0なら退会可能
  t.is(await user.isDeactivatable(), true)
})

test('退会時に各種個人情報を消す', async t => {
  await generateServiceUserProfile(t)
  const { pro } = t.context
  t.is(await pro.isDeactivatable(), true)

  // 退会処理
  await supertest(server)
    .delete('/api/users/@me')
    .set('Authorization', `Bearer ${pro.token}`)
    .expect(200)

  const deativateUser = await User.findOne({_id: pro.id})
    .populate({path: 'profiles'})

  // userがdeactivateになっているか
  t.is(deativateUser.deactivate, true)

  // プロの回答を非公開
  const proAnswers = await ProAnswer.count({profile: {$in: pro.profiles}, isPublished: true})
  t.is(proAnswers, 0)

  // payjpのIDが空になっているか？
  t.is(deativateUser.payjpId, undefined)

  // プロフィールをdeactivate
  for (const profile of deativateUser.profiles) {
    t.is(profile.deactivate, true)
  }

  // 通知を削除
  const notices = await Notice.count({user: pro.id})
  t.is(notices, 0)

  // 画像が削除されているか
  const media = await Media.count({user: pro.id})
  t.is(media, 0)

  // ユーザ本人確認の削除
  t.is(deativateUser.identification.status, undefined)
  t.is(deativateUser.identification.invalidReason, undefined)
  t.is(deativateUser.identification.image.length, 0)
})

test('user.passwordがuser.idとパスワードから生成される', async t => {
  const uuid = uuidv4()
  const userData = {
    lastname: `user_${uuid}`,
    email: `test_${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)
  const user = await User.findOne({email: userData.email}).lean()
  t.true(user.password === User.cipher(userData.password, user._id.toString()))
})
