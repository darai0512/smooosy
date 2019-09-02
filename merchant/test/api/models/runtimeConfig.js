const test = require('ava')
const {ObjectId} = require('mongodb')

const { RuntimeConfig, Service } = require('../../../src/api/models')
const ModelTestRunner = require('./helpers/modelTestRunner')
const { createServiceData, postProcess } = require('../helpers/testutil')



test.afterEach(async () => {
  await postProcess()
})

const runtimeConfig = {
  valid: function() {
    return {
      admin: false,
      name: 'v1 matching',
      services: [],
      priority: 1,
      rollout: {
        start: 0,
        end: 100,
      },
    }
  },
}

const testCases = [
  {
    name: 'valid match config',
    input: runtimeConfig.valid,
  },
  {
    name: 'match config with bad rollout range (start > end)',
    input: runtimeConfig.valid,
    modifiers: function(rc) {
      rc.rollout.start = 10
      rc.rollout.end = 5
    },
    expectedError: 'rollout start must be <= rollout end',
  },
  {
    name: 'match config with bad rollout range (start and end out of bounds)',
    input: runtimeConfig.valid,
    modifiers: function(rc) {
      rc.rollout.start = -10
      rc.rollout.end = 105
    },
    expectedError: 'rollout start must be in [0, 100]',
  },
]

const testRunner = new ModelTestRunner(test, RuntimeConfig, testCases)
testRunner.runTestCases()

test.serial('_getConfigName', t => {
  const lowPriority = runtimeConfig.valid()
  lowPriority.name = 'low-priority'

  const highPriority = runtimeConfig.valid()
  highPriority.name = 'high-priority'
  highPriority.priority = 2

  const partialRollout = runtimeConfig.valid()
  partialRollout.name = 'partial-rollout'
  partialRollout.rollout.end = 30
  partialRollout.priority = 2

  const restrictedByService = runtimeConfig.valid()
  restrictedByService.name = 'restricted-by-service'
  restrictedByService.services = [ 'inheritance-tax-accountant' ]
  restrictedByService.priority = 2

  const id = '1555'
  const service = 'wedding-photographers'

  t.is(
    RuntimeConfig._getConfigName(id, service, [lowPriority, highPriority]),
    highPriority.name,
  )

  t.is(
    RuntimeConfig._getConfigName(id, service, [lowPriority, partialRollout]),
    lowPriority.name
  )

  t.is(
    RuntimeConfig._getConfigName(id, service, [lowPriority, restrictedByService]),
    lowPriority.name
  )
})

test.serial('getBoolValue: no constraints', async t => {
  const config = new RuntimeConfig(runtimeConfig.valid())
  config.value = { bool: true }
  config.isEnabled = true
  await config.save()

  t.true(await RuntimeConfig.getBoolValue(config.name, {}))
})

test.serial('getBoolValue: service and rollout', async t => {
  const service = await Service.create(createServiceData(ObjectId(), 'foo'))

  const config = new RuntimeConfig(runtimeConfig.valid())
  config.value = { bool: true }
  config.isEnabled = true
  config.rollout = { start: 0, end: 50 }
  config.services = [service]
  await config.save()

  t.true(await RuntimeConfig.getBoolValue(config.name, {
    // hashes to value between 0 and 50
    seed: '5d26a605cab2657d18747ae6',
    services: [service],
  }))

  t.false(await RuntimeConfig.getBoolValue(config.name, {
    // hashes to value between 0 and 50
    seed: '5d26a605cab2657d18747ae6',
  }))

  t.false(await RuntimeConfig.getBoolValue(config.name, {
    // hashes to value between 50 and 100
    seed: '5d26a65eca4287158b0302ce',
    service,
  }))

  const falseConfig = new RuntimeConfig(runtimeConfig.valid())
  falseConfig.value = { bool: false }
  falseConfig.isEnabled = true
  falseConfig.rollout = { start: 0, end: 50 }
  falseConfig.services = [service]
  falseConfig.priority = 2
  await falseConfig.save()

  // falseConfig has higher priority than config
  t.false(await RuntimeConfig.getBoolValue(config.name, {
    // hashes to value between 0 and 50
    seed: '5d26a605cab2657d18747ae6',
    service,
  }))
})
