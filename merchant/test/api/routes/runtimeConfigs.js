const test = require('ava')
const moment = require('moment')
const supertest = require('supertest')

const server = require('../../../src/api/server')
const { RuntimeConfig } = require('../../../src/api/models')
const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
})

test.after.always(async () => {
  await postProcess()
})

test('getActiveRuntimeConfigsForUser', async t => {
  // doesn't match - not enabled
  await RuntimeConfig.create({
    isEnabled: false,
    name: 'disabled',
    priority: 1,
    rollout: { start: 0, end: 100 },
  })

  // doesn't match - start date in future
  await RuntimeConfig.create({
    isEnabled: true,
    name: 'start_date_in_future',
    priority: 1,
    rollout: { start: 0, end: 100 },
    startAt: moment().add(1, 'day'),
  })

  // doesn't match - end date in past
  await RuntimeConfig.create({
    isEnabled: true,
    name: 'end_date_in_past',
    priority: 1,
    rollout: { start: 0, end: 100 },
    endAt: moment().subtract(1, 'day'),
  })

  const matchingNoServiceConfig = await RuntimeConfig.create({
    isEnabled: true,
    name: 'no_service',
    priority: 1,
    rollout: { start: 0, end: 100 },
  })

  const matchingServiceConfig = await RuntimeConfig.create({
    isEnabled: true,
    name: 'service',
    priority: 1,
    rollout: { start: 0, end: 100 },
    services: [ t.context.service ],
  })

  // doesn't match - end date in past
  const matchingDateConfig = await RuntimeConfig.create({
    isEnabled: true,
    name: 'start_date_1_minute_ago',
    priority: 1,
    rollout: { start: 0, end: 100 },
    startAt: moment().subtract(1, 'minute'),
  })

  const adminConfig = await RuntimeConfig.create({
    admin: true,
    isEnabled: true,
    name: 'admin_config',
    priority: 1,
    rollout: { start: 0, end: 100 },
  })

  const res = await supertest(server)
    .get('/api/runtimeConfigs/active')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .set('x-smooosy', `{"user_id": "${t.context.pro.id}", "instance_id": "foo"}`)

  t.is(res.status, 200)
  t.truthy(res.body.find(rc => rc.name === matchingNoServiceConfig.name))
  t.truthy(res.body.find(rc => rc.name === matchingServiceConfig.name))
  t.truthy(res.body.find(rc => rc.name === matchingDateConfig.name))
  t.false(res.body.some(rc => rc.name === adminConfig.name))
  t.is(res.body.length, 3)
})
