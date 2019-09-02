const test = require('ava')
const { ObjectID } = require('mongodb')
const uuidv4 = require('uuid/v4')
const { Service, Request, Profile, User } = require('../../../src/api/models')

const { generateServiceUserProfile, generateMeet } = require('../../api/helpers/testutil')

test('Service model', async t => {
  const id = new ObjectID()
  const service = await Service.create({
    _id: id,
    name: 'service1',
  })

  t.is(service.name, 'service1')
  t.is(service.tags.length, 0)
  t.is(service.priority, 0)
  t.is(service.queries.length, 0)
  t.is(service.enabled, false)
  t.is(service.providerName, 'プロ')
  t.is(service.image, 'https://dev.smooosy.com/img/services/noimage.png?')

  const now = new Date()
  service.imageUpdatedAt = now
  t.is(service.image, `https://dev.smooosy.com/img/services/${id}.jpg?${now.getTime()}`)
})

test('10以上の依頼があるサービスのmeetEstimationが計算される', async t => {
  await generateServiceUserProfile(t)
  const userGenerate = () => {
    const uuid = uuidv4()
    return User.create({
      lastname: `user1_${uuid}`,
      email: `test1_${uuid}@smooosy.com`,
      token: `token1_${uuid}`,
      bounce: true,
    })
  }
  const requestGenerate = (user) => {
    return Request.create({
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
    })
  }

  const { service, pro, profile } = t.context
  const pro2 = await userGenerate()
  const profile2 = await Profile.create({
    name: `テスト事業者_${uuidv4()}`,
    services: [service.id],
    loc: {
      type: 'Point',
      coordinates: [
        139.7387178,
        35.6710366,
      ],
    },
    description: 'aaaaa',
    pro: pro2.id,
  })
  pro2.pro = true
  pro.profiles = [profile2]
  await pro.save()

  const requests = await Promise.all([
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
    userGenerate().then(user => requestGenerate(user)),
  ])
  // 2 meets for each request
  for (let r of requests) {
    t.context.request = r
    t.context.pro = pro
    t.context.profile = profile
    await generateMeet(t, {
      params: {
        requestId: r.id,
      },
      body: {
        profile: profile.id,
        price: 10000,
        priceType: 'fixed',
        chat: 'よろしくお願いします！',
        files: [],
      },
      user: pro,
    })
    t.context.pro = pro2
    t.context.profile = profile2
    await generateMeet(t, {
      params: {
        requestId: r.id,
      },
      body: {
        profile: profile2.id,
        price: 10000,
        priceType: 'fixed',
        chat: 'よろしくお願いします！',
        files: [],
      },
      user: pro2,
    })
  }
  // ------------------ end of prepare ------------------
  const estimation = await service.calcMeetEstimation()
  t.not(estimation.timeToFirstMeet.from, '1時間')
  t.not(estimation.timeToFirstMeet.to, '5時間')
  // Median and Q3 are both 2, but 'from' and 'to' become diffrent
  t.is(estimation.estimatedMeetCount.from, 2)
  t.is(estimation.estimatedMeetCount.to, 3)
})
