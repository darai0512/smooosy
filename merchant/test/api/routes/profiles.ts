export {}
const test = require('ava')
const supertest = require('supertest')
const sinon = require('sinon')
const nock = require('nock')
const moment = require('moment')
const { ObjectId } = require('mongodb')
const email = require('../../../src/api/lib/email')
const { oidIncludes } = require('../../../src/api/lib/mongoid')
// 運営サスペンドのメール
sinon.spy(email, 'emailAdminSuspendProfile')

const server = require('../../../src/api/server')
const uuidv4 = require('uuid/v4')
const { findServicesInOtherProfiles } = require('../../../src/api/routes/profiles')
const { User, Profile, ProStat, ProService, ProAnswer, ProQuestion, Request, Service, Lead, Licence, CSTask } = require('../../../src/api/models')
const { generateServiceUserProfile, generateRequestViaModel, generateMeet, postProcess, createServiceData } = require('../helpers/testutil')

const runTestCases = require('../models/helpers/runTestCases')

test.beforeEach(async t => {
  await generateServiceUserProfile(t, {excludeModels: ['proService']})
  t.context.newProfileData = {
    'services': [
      t.context.service.id,
    ],
    'visiting': true,
    'visited': true,
    'loc': {
      'type': 'Point',
      'coordinates': [
        139.73607779999998,
        35.6757238,
      ],
    },
    'address': '東京都港区赤坂',
    'prefecture': '東京都',
    'city': '港区',
    'name': 'テスト事業者',
  }

  const uid = uuidv4()
  t.context.newUserData = {
    'email': `pro_${uid}@smooosy.com`,
    'password': 'aaaaaa',
    'lastname': '姓',
    'firstname': '名',
    'phone': '00011112222',
    'bounce': true, // メール送信させない
  }
  t.context.newProData = Object.assign({}, t.context.newUserData, {
    'pro': true,
    'profile': t.context.newProfileData,
  })
  t.context.header = JSON.stringify({
    instance_id: 'instance_id',
    user_type: 2,
  })

  t.context.proQuestion = await ProQuestion.create({
    text: 'テスト質問',
    tags: ['テスト'],
    isPublished: true,
    proAnswers: [],
  })
})

test.afterEach.always(() => {
  email.emailAdminSuspendProfile.resetHistory()
})

test.after.always(async () => {
  await postProcess()
  email.emailAdminSuspendProfile.restore()
})

test('既存ユーザーがプロ登録できる', async t => {
  const newUserData = t.context.newUserData
  const newProfileData = t.context.newProfileData

  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newUserData)
    .expect(200)
  let u = await User.findOne({email: newUserData.email})
  if (!u) {
    t.fail('ユーザーが見つかりません')
    return
  }
  t.false(u.pro)

  const res = await supertest(server)
    .post('/api/profiles')
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${u.token}`)
    .send(newProfileData)
    .expect(200)

  u = await User.findOne({email: newUserData.email})
  t.true(u.pro)

  const p = await Profile.findById(res.body.id)
  t.is(p.pro.toString(), u._id.toString())
  t.is(p.name, 'テスト事業者')
})


test('あんかけで、既存ユーザーがプロ登録できる', async t => {
  const newUserData = t.context.newUserData
  const newProfileData = t.context.newProfileData

  // create data for あんかけ
  await generateRequestViaModel(t)
  const lead = await Lead.create({email: newUserData.email, services: [t.context.service.id]})

  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newUserData)
    .expect(200)
  let u = await User.findOne({email: newUserData.email})
  if (!u) {
    t.fail('ユーザーが見つかりません')
    return
  }
  t.false(u.pro)

  newProfileData.requestId = t.context.request._id.toString()
  newProfileData.sentEmail = newUserData.email
  const res = await supertest(server)
    .post('/api/profiles')
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${u.token}`)
    .send(newProfileData)
    .expect(200)

  u = await User.findOne({email: newUserData.email})
  t.true(u.pro)
  const p = await Profile.findById(res.body.id)
  t.is(p.pro.toString(), u._id.toString())
  t.is(p.name, 'テスト事業者')

  // あんかけチェック
  const r = await Request.findById(t.context.request.id)
  const sentIds = r.sent.map(s => s._id.toString())
  t.true(sentIds.includes(p._id.toString()))
  const l = await Lead.findById(lead.id)
  t.true(l.registered)
})

test('レビューをした時にProfileのreviewsとaverageRatingが更新される', async t => {
  const profile = t.context.profile
  await supertest(server)
    .post(`/api/profiles/${profile.id}/review`)
    .send({rating: 3, username: 'hoge'})
    .expect(200)

  const p = await Profile.findById(profile.id)
  t.is(p.reviews.length, 1)
  t.is(p.averageRating, 3)
})

test('プロ登録時にproStatが作成される', async t => {
  const newUserData = t.context.newUserData
  const newProData = t.context.newProData
  // signup
  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newUserData)
    .expect(200)

  const user = await User.findOne({email: newUserData.email})
  if (!user) {
    t.fail('ユーザが見つかりません')
    return
  }

  await supertest(server)
    .post('/api/profiles')
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${user.token}`)
    .send({...newProData, name: 'test', services: [t.context.service.id], loc: {type: 'Point', coordinates: [0, 0]}})
    .expect(200)

  const proStat = await ProStat.findOne({email: newProData.email})
  t.true(proStat !== null)
})

test('プロ登録時にproServiceが作成される', async t => {
  const newProData = t.context.newUserData
  const newProfileData = t.context.newProfileData

  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newProData)
    .expect(200)

  const u = await User.findOne({email: newProData.email})

  // profiles
  await supertest(server)
    .post('/api/profiles')
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${u.token}`)
    .send(newProfileData)
    .expect(200)

  const user = await User.findOne({email: newProData.email}).populate('profiles')
  const proService = await ProService.findOne({profile: {$in: user.profiles.map(p => p.id)}})
  t.true(proService !== null)
})

test('プロのユーザ更新時にproStatが更新される', async t => {
  const newUserData = t.context.newUserData
  const newProData = t.context.newProData
  // signup
  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newUserData)
    .expect(200)

  const user = await User.findOne({email: newUserData.email})
  if (!user) {
    t.fail('ユーザが見つかりません')
    return
  }

  await supertest(server)
    .post('/api/profiles')
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${user.token}`)
    .send({...newProData, name: 'test', services: [t.context.service.id], loc: {type: 'Point', coordinates: [0, 0]}})
    .expect(200)

  const pro = await User.findOne({email: newProData.email, pro: true})
  if (!pro) {
    t.fail('プロが見つかりません')
    return
  }

  // 電話番号更新
  user.phone = '00022223333'
  // update
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({phone: user.phone})
    .expect(200)

  const proStat = await ProStat.findOne({email: user.email})
  t.is(proStat.phone, user.phone)
})

test('プロ登録時にcategoryが設定される', async t => {
  const newUserData = t.context.newUserData
  const newProData = t.context.newProData
  // signup
  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newUserData)
    .expect(200)

  const user = await User.findOne({email: newUserData.email})

  await supertest(server)
    .post('/api/profiles',)
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${user.token}`)
    .send({...newProData, name: 'test', services: [t.context.service.id], loc: {type: 'Point', coordinates: [0, 0]}})
    .expect(200)

  const pro = await User.findOne({email: newProData.email}).populate('profiles')

  t.is(pro.profiles[0].category, t.context.category.name)
})

test('プロフィールのdeactivateができる', async t => {
  const newUserData = t.context.newUserData
  const newProData = t.context.newProData
  // signup
  await supertest(server)
    .post('/api/signup')
    .set('x-smooosy', t.context.header)
    .send(newUserData)
    .expect(200)

  const user = await User.findOne({email: newUserData.email})

  await supertest(server)
    .post('/api/profiles')
    .set('x-smooosy', t.context.header)
    .set('Authorization', `Bearer ${user.token}`)
    .send({...newProData, name: 'test', services: [t.context.service.id], loc: {type: 'Point', coordinates: [0, 0]}})
    .expect(200)

  let pro = await User.findOne({email: newProData.email, pro: true})
  const profileId = pro.profiles[0]

  // mock sendgrid API for removeEmail
  nock('https://api.sendgrid.com')
    .get(`/v3/contactdb/recipients/search?email=${encodeURIComponent(newProData.email)}`)
    .reply(200)

  await supertest(server)
    .delete(`/api/profiles/${profileId}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .expect(200)

  pro = await User.findById(pro.id)
  t.is(pro.profiles.length, 0)

  const profile = await Profile.findById(profileId)
  t.is(profile.deactivate, true)

  nock.cleanAll()
})

test('他人のプロフィールはdeactivateができない', async t => {
  const pro = await User.findOne({email: t.context.pro.email})
  const profileId = pro.profiles[0]

  await supertest(server)
    .delete(`/api/profiles/${profileId}`)
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .expect(404)

  const user = await User.findById(pro.id)
  t.is(user.profiles.length, 1)

  const profile = await Profile.findById(profileId)
  t.is(profile.deactivate, undefined)
})

test('adminはプロフィールのdeactivateができる', async t => {
  // need 2 profiles to delete, so create new profile
  let oldProfile = t.context.profile

  const newProfileData = t.context.newProfileData
  newProfileData.pro = t.context.pro.id
  const newService = await Service.create({
    'name': 'テストサービス2',
    'description': 'テストサービス2の説明',
    'key': 'test-service2',
  })
  newProfileData.services = [newService.id]
  let newProfile = await Profile.create(newProfileData)
  let user = await User.findByIdAndUpdate(t.context.pro.id, {$push: {profiles: newProfile.id}})

  const expectedServices = [...newProfile.services, ...oldProfile.services]

  // exec
  const admin = t.context.adminUser
  await supertest(server)
    .delete(`/api/admin/profiles/${oldProfile.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .expect(200)

  user = await User.findById(user.id)
  t.is(user.profiles.length, 1)
  t.is(user.profiles[0].toString(), newProfile.id)

  oldProfile = await Profile.findById(oldProfile.id)
  t.is(oldProfile.deactivate, true)
  t.is(oldProfile.services.length, 0)

  newProfile = await Profile.findById(newProfile.id)
  t.is(newProfile.deactivate, undefined)
  t.deepEqual(Array.from(newProfile.services.toObject()), expectedServices)
})

test('プロフィールが１つの場合は削除できない', async t => {
  const profileId = t.context.profile.id
  const admin = t.context.adminUser
  await supertest(server)
    .delete(`/api/admin/profiles/${profileId}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .expect(400)

  const user = await User.findById(t.context.pro.id)
  t.is(user.profiles.length, 1)

  const profile = await Profile.findById(profileId)
  t.is(profile.deactivate, undefined)
})

test.serial('資格の登録をするとCSタスクが作成される', async t => {
  const licence = await Licence.create({key: 'licence', name: 'ライセンス'})
  const profile = t.context.profile
  const pro = t.context.pro
  const data = {
    licences: [{
      status: 'pending',
      licence: licence.id,
    }],
  }
  await supertest(server)
    .put(`/api/profiles/${profile.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(data)
    .expect(200)

  const count = await CSTask.countDocuments({type: 'licence', profile: profile.id})
  t.is(count, 1)
})

test('サイレントサスペンドができる', async t => {
  await supertest(server)
    .put(`/api/admin/profiles/${t.context.profile.id}`)
    .set('Authorization', `Bearer ${t.context.adminUser.token}`)
    .send({
      suspend: ['admin'],
    })
    .expect(200)

  const profile = await Profile.findById(t.context.profile.id)
  t.is(profile.suspend, 'admin')

  //メール送信関数が実行されない
  t.false(email.emailAdminSuspendProfile.called)
})

test('プロフィールサスペンドができる', async t => {
  const pro = t.context.pro
  const exProfile = await Profile.create({
    name: `テスト事業者_${uuidv4()}`,
    services: [],
    loc: t.context.locations.tokyo,
    description: 'bbbb',
    pro: pro.id,
  })
  await User.findByIdAndUpdate(pro.id, {$addToSet: {profiles: exProfile.id}})

  const ids = [t.context.profile.id, exProfile.id]

  await supertest(server)
    .put('/api/profiles/suspend')
    .set('Authorization', `Bearer ${pro.token}`)
    .send(ids)

  const profiles = await Profile.find({pro: t.context.pro.id})
  t.is(profiles.length, 2)
  for (const profile of profiles) {
    t.is(profile.suspend, '一時休止')
  }
})

test('プロフィール復活ができる', async t => {
  const pro = t.context.pro
  const exProfile = await Profile.create({
    name: `テスト事業者_${uuidv4()}`,
    services: [],
    loc: t.context.locations.tokyo,
    description: 'bbbb',
    pro: pro.id,
  })
  await User.findByIdAndUpdate(pro.id, {$addToSet: {profiles: exProfile.id}})

  const ids = [t.context.profile.id, exProfile.id]

  await supertest(server)
    .put('/api/profiles/suspend')
    .set('Authorization', `Bearer ${pro.token}`)
    .send(ids)

  await supertest(server)
    .put(`/api/profiles/resume/${t.context.profile.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(ids)

  const profiles = await Profile.find({pro: t.context.pro.id})
  t.is(profiles.length, 2)
  for (const profile of profiles) {
    t.is(profile.suspend, undefined)
  }
})

test.serial('プロフィールの更新時にProServiceが存在しない場合に作成する', async t => {
  const profile = t.context.profile
  const pro = t.context.pro
  const data = {
    services: [
      t.context.service.id,
    ],
  }
  await supertest(server)
    .put(`/api/profiles/${profile.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(data)
    .expect(200)

  const proService = await ProService.findOne({service: t.context.service.id})
  t.true(proService !== null)
})

test.serial('プロフィールの更新時にサービスが外された場合にProServiceがdisabledになる', async t => {

  const profile = t.context.profile
  const pro = t.context.pro
  let data = {
    services: [
      t.context.service.id,
      t.context.service2.id,
    ],
  }
  await supertest(server)
    .put(`/api/profiles/${profile.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(data)
    .expect(200)

  data = {
    services: [
      t.context.service.id,
    ],
  }

  await supertest(server)
    .put(`/api/profiles/${profile.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(data)
    .expect(200)

  const proService2 = await ProService.findOne({service: t.context.service2.id})
  t.true(proService2.disabled)
})


test.serial('プロフィールの更新時に別のプロフィールからサービスを付け替えた場合にProServiceも付け替える', async t => {

  const pro = t.context.pro
  const profile = t.context.profile
  const newProfileData = t.context.newProfileData
  newProfileData.pro = pro.id
  newProfileData.services = [t.context.service3.id]
  const profile2 = await Profile.create(newProfileData)
  const data = {
    services: [
      t.context.service.id,
      t.context.service2.id,
    ],
  }
  const data2 = {
    services: [
      t.context.service3.id,
      t.context.service.id,
    ],
  }

  await supertest(server)
    .put(`/api/profiles/${profile.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(data)
    .expect(200)

  let proService = await ProService.findOne({service: t.context.service.id})
  t.true(proService.profile.toString() === profile.id)

  await supertest(server)
    .put(`/api/profiles/${profile2.id}`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send(data2)
    .expect(200)

  // 紐づけが変わる
  proService = await ProService.findOne({service: t.context.service.id})
  t.true(proService.profile.toString() === profile2.id)
})

const showForInsightTestCases = [
  {
    name: 'profile showForInsight: OK no data',
    expected: {
      status: 200,
      body: {
        averageRating: 0,
        averageTimeToMeet: null,
        proAnswerCount: 0,
        reviewCount: 0,
      },
    },
  },
  {
    name: 'profile showForInsight: OK reviewCount,averageRating',
    modifiers: async function(t) {
      const context = t.context
      context.profile.reviewCount = 3
      context.profile.averageRating = 4.99
      await context.profile.save()
    },
    expected: {
      status: 200,
      body: {
        averageRating: 4.99,
        averageTimeToMeet: null,
        proAnswerCount: 0,
        reviewCount: 3,
      },
    },
  },
  {
    name: 'profile showForInsight: OK proAnswerCount',
    modifiers: async function(t) {
      const context = t.context
      await ProAnswer.create({
        proQuestion: context.proQuestion,
        profile: context.profile,
        pro: context.pro,
        isPublished: true,
        loc: context.locations.tokyo,
      })
    },
    expected: {
      status: 200,
      body: {
        averageRating: 0,
        averageTimeToMeet: null,
        proAnswerCount: 1,
        reviewCount: 0,
      },
    },
  },
  {
    name: 'profile showForInsight: OK averageTimeToMeet',
    modifiers: async function(t) {
      const context = t.context
      const requests = []
      const meets = []
      for (let i = 0; i < 5; i++) {
        await generateRequestViaModel(t)
        requests[i] = t.context.request

        await generateMeet(t, {
          params: {
            requestId: requests[i].id,
          },
          body: {
            pro: context.pro.id,
            profile: context.profile.id,
            price: 10000,
            priceType: 'fixed',
            chat: 'よろしくお願いします！',
          },
          user: context.pro,
        })
        meets[i] = t.context.meet
      }

      const now = moment().startOf('day')
      // OK: 30 min
      requests[0].createdAt = moment(now).subtract({days: 4, hours: 1})
      meets[0].createdAt = moment(requests[0].createdAt).add(30, 'minutes')

      // OK: 60 min
      requests[1].createdAt = moment(now).subtract({months: 6, days: -2})
      meets[1].createdAt = moment(requests[1].createdAt).add(60, 'minutes')

      // NG: in 4 days
      requests[2].createdAt = moment(now).subtract({days: 3})
      meets[2].createdAt = moment(requests[2].createdAt).add(35, 'minutes')

      // NG: before 6 months
      requests[3].createdAt = moment(now).subtract({months: 6, days: 1})
      meets[3].createdAt = moment(requests[3].createdAt).add(35, 'minutes')

      // NG: meet YYYYMMDD != request YYYYMMDD
      requests[4].createdAt = moment(now).subtract({days: 6})
      meets[4].createdAt = moment(requests[4].createdAt).add({days: 1, minutes: 35})

      for (let i = 0; i < 5; i++) {
        await requests[i].save()
        await meets[i].save()
      }
    },
    expected: {
      status: 200,
      body: {
        averageRating: 0,
        averageTimeToMeet: 45,
        proAnswerCount: 0,
        reviewCount: 0,
      },
    },
  },
  {
    name: 'profile showForInsight: 404 profile not found',
    modifiers: async function(t) {
      const context = t.context
      context.profile = {
        id: 'xxxxx',
      }
    },
    expected: {
      status: 404,
      body: {
        message: 'not found',
      },
    },
  },
]

async function runRequestsForNewProTestRunner(t, tc) {
  // run modifiers on input
  if (tc.modifiers) {
    await tc.modifiers(t)
  }

  const res = await supertest(server)
    .get(`/api/profiles/${t.context.profile.id}/insights`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(tc.expected.status)

  t.deepEqual(res.body, tc.expected.body)
}

runTestCases(test, showForInsightTestCases, runRequestsForNewProTestRunner)

test('profile update: handling proService correctly when new service is updated by admin.', async t => {
  const profile = t.context.profile
  const newService = await Service.create(createServiceData(ObjectId(), uuidv4()))
  await supertest(server)
    .put(`/api/admin/profiles/${profile._id}`)
    .set('Authorization', `Bearer ${t.context.adminUser.token}`)
    .send({
      services: [...profile.services, newService._id],
    })
    .expect(200)

  const ps = await ProService.countDocuments({user: profile.pro, profile: profile._id, service: newService._id})
  t.is(ps, 1)
})

test('profile update: handling proService correctly when profile.services is updated by admin.', async t => {
  const profile = t.context.profile
  const newProfile = await Profile.create({
    name: uuidv4(),
    pro: profile.pro,
    services: [],
    loc: {
      type: 'Point',
      coordinates: [
        139.73607779999998,
        35.6757238,
      ],
    },
  })
  await supertest(server)
    .put(`/api/admin/profiles/${newProfile._id}`)
    .set('Authorization', `Bearer ${t.context.adminUser.token}`)
    .send({
      services: [profile.services[0]],
    })
    .expect(200)

  const zero = await ProService.countDocuments({user: profile.pro, profile: profile._id, service: profile.services[0]})
  const one = await ProService.countDocuments({user: profile.pro, profile: newProfile._id, service: profile.services[0]})
  t.is(zero, 0)
  t.is(one, 1)
})

test('unit test: findServicesInOtherProfiles', async t => {
  const createProService = (user, profile, service) => ({
    user,
    profile: profile._id,
    service,
    loc: profile.loc,
    budget: 0,
  })
  const newService = await Service.create(createServiceData(ObjectId(), uuidv4()))
  const newService2 = await Service.create(createServiceData(ObjectId(), uuidv4()))
  const newService3 = await Service.create(createServiceData(ObjectId(), uuidv4()))
  const newProfile = await Profile.create({
    name: uuidv4(),
    pro: t.context.profile.pro,
    services: [],
    loc: {
      type: 'Point',
      coordinates: [
        139.73607779999998,
        35.6757238,
      ],
    },
  })
  t.context.profile = await Profile.findByIdAndUpdate(t.context.profile._id, {$push: {services: newService}})
  await ProService.create(createProService(t.context.pro, t.context.profile, t.context.profile.services[0]))
  await ProService.create(createProService(t.context.pro, t.context.profile, newService))
  await ProService.create(createProService(t.context.pro, newProfile, newService2))

  const {
    newServices,
    inSameProfile,
    inOtherProfile,
  } = await findServicesInOtherProfiles(t.context.pro._id, t.context.profile._id, [...t.context.profile.services, newService2._id, newService3._id])

  t.true(oidIncludes(newServices, newService3._id))
  t.true(oidIncludes(inOtherProfile, newService2._id))
  t.false(oidIncludes(inSameProfile, newService2._id))
  t.is(inSameProfile.length, t.context.profile.services.length)
  t.true(t.context.profile.services.every(s => oidIncludes(inSameProfile, s)))
})
