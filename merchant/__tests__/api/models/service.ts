export {}
const { ObjectID } = require('mongodb')
const { Service } = require('../../../src/api/models')
const geo = require('../../__fixtures__/api/models/geo')
const { createMeet } = require('../../__fixtures__/api/models/meet')
const { createProfile } = require('../../__fixtures__/api/models/profile')
const { createRequest } = require('../../__fixtures__/api/models/request')
const { createService } = require('../../__fixtures__/api/models/service')
const { createUser } = require('../../__fixtures__/api/models/user')

test('Service model', async () => {
  const id = ObjectID()
  const service = await Service.create({
    _id: id,
    name: 'service1',
  })

  expect(service.name).toBe('service1')
  expect(service.tags.length).toBe(0)
  expect(service.priority).toBe(0)
  expect(service.queries.length).toBe(0)
  expect(service.enabled).toBe(false)
  expect(service.providerName).toBe('プロ')
  expect(service.image).toBe('https://dev.smooosy.com/img/services/noimage.png?')

  const now = new Date()
  service.imageUpdatedAt = now
  expect(service.image).toBe(`https://dev.smooosy.com/img/services/${id}.jpg?${now.getTime()}`)
})

test('10以上の依頼があるサービスのmeetEstimationが計算される', async () => {
  const service = await createService()
  const pro = await createUser({pro: true})
  const profile = await createProfile({
    loc: geo.points.tokyo,
    services: [ service ],
    pro,
  })

  const pro2 = await createUser({pro: true})
  const profile2 = await createProfile({
    loc: geo.points.tokyo,
    services: [ service ],
    pro: pro2,
  })

  const requests = await Promise.all([
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
    createUser().then(user => createRequest({customer: user, service})),
  ])
  // 2 meets for each request
  for (const r of requests) {
    await createMeet({
      service,
      pro,
      profile,
      request: r,
    })

    await createMeet({
      service,
      pro: pro2,
      profile: profile2,
      request: r,
    })
  }
  // ------------------ end of prepare ------------------
  const estimation = await service.calcMeetEstimation()
  expect(estimation.timeToFirstMeet.from).not.toBe('1時間')
  expect(estimation.timeToFirstMeet.to).not.toBe('5時間')
  // Median and Q3 are both 2, but 'from' and 'to' become diffrent
  expect(estimation.estimatedMeetCount.from).toBe(2)
  expect(estimation.estimatedMeetCount.to).toBe(3)
})
