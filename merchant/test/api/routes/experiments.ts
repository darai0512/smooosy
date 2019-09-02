export {}
const test = require('ava')
const moment = require('moment')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const { postProcess } = require('../helpers/testutil')
const { adminUser, experiment } = require('../models/helpers/testutil').fixtureGenerators
const { User, Experiment } = require('../../../src/api/models')

test.afterEach.always(postProcess)

const context: any = {}

test.before(async () => {
  context.admin = await User.create(adminUser())
})

test.serial('create an experiment', async t => {
  const res = await supertest(server)
    .post('/api/admin/experiments')
    .set('Authorization', `Bearer ${context.admin.token}`)
    .send(experiment.valid())

  t.is(res.statusCode, 200)
})

test.serial('get active experiments for a user', async t => {
  const exp = experiment.valid()
  exp.startAt = moment().toDate()
  exp.endAt = moment().add(1, 'week').toDate()
  await Experiment.create(exp)

  const mmHeaders = {
    instance_id: '12345',
    user_type: 2,
    platform: {
      os: {
        family: 'iOS',
      },
      device: 'Safari',
    },
  }

  const res = await supertest(server)
    .get('/api/experiments/active')
    .set('x-smooosy', JSON.stringify(mmHeaders))

  t.is(res.statusCode, 200)
  t.is(res.body.length, 1)
})

test.serial('does not throw 500 with instance_id', async t => {
  const exp = experiment.valid()
  exp.startAt = moment().toDate()
  exp.endAt = moment().add(1, 'week').toDate()
  await Experiment.create(exp)

  const res = await supertest(server)
    .get('/api/experiments/active')

  t.is(res.statusCode, 200)
  t.is(res.body.length, 0)
})
