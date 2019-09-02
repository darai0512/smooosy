const test = require('ava')
const uuid = require('uuid')

const { Experiment } = require('../../../src/api/models')
const { fixtureGenerators } = require('./helpers/testutil')
const { postProcess } = require('../helpers/testutil')



test.afterEach.always(postProcess)

const testCases = [
  {
    name: 'valid experiment',
    input: fixtureGenerators.experiment.valid,
  },
  {
    name: 'invalid experiment - duplicate bucket names',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.buckets[0].name = 'abcdefg'
      exp.buckets[1].name = 'abcdefg'
    },
    expectedError: 'bucket names must be unique',
  },
  {
    name: 'invalid experiment - bucket ranges do not add up to 100',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.buckets[0].start = 10
    },
    expectedError: 'bucket ranges must add up to 100',
  },
  {
    name: 'invalid experiment - end date must be greater than start date',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.endAt = exp.startAt
    },
    expectedError: 'endDate must be greater than startDate',
  },
  {
    name: 'invalid experiment - bad constraints',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.constraints = {
        type: 'operator',
        operator: 'AND',
        children: [
          // this is a bad constraint because its type
          // is value but it has the operator field set
          {
            type: 'value',
            operator: 'AND',
          },
          {
            type: 'value',
            value: {
              type: 'Browser',
              value: 'Safari',
            },
          },
        ],
      }
    },
    expectedError: 'invalid constraints',
  },
  {
    name: 'experiment - 100% rollout',
    input: fixtureGenerators.experiment.valid,
    assertions: function(t, exp) {
      t.truthy(exp.getBucketNameForUser(fixtureGenerators.experiment.context()))
    },
  },
  {
    name: 'experiment - 0% rollout',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.rollout.end = 0
    },
    assertions: function(t, exp) {
      t.falsy(exp.getBucketNameForUser(fixtureGenerators.experiment.context()))
    },
  },
  {
    name: 'experiment - getBucketNameForUser, no constraints',
    input: fixtureGenerators.experiment.valid,
    assertions: function(t, exp) {
      t.is(exp.getBucketNameForUser(fixtureGenerators.experiment.context()), 'treatment')
    },
  },
  {
    name: 'experiment - getBucketNameForUser, no constraint matches',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.constraints = {
        value: {
          type: 'Browser',
          value: 'Opera',
        },
        type: 'value',
      }
    },
    assertions: function(t, exp) {
      t.falsy(exp.getBucketNameForUser(fixtureGenerators.experiment.context()))
    },
  },
  {
    name: 'experiment - getBucketNameForUser, both constraints match for ANDd constraints',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.constraints = {
        type: 'operator',
        operator: 'AND',
        children: [
          {
            value: {
              type: 'Browser',
              value: 'Safari',
            },
            type: 'value',
          },
          {
            value: {
              type: 'Device',
              value: 'iOS',
            },
            type: 'value',
          },
        ],
      }
    },
    assertions: function(t, exp) {
      t.is(exp.getBucketNameForUser(fixtureGenerators.experiment.context()), 'treatment')
    },
  },
  {
    name: 'experiment - Android and iOS Safari constraints',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.constraints = {
        type: 'operator',
        operator: 'OR',
        children: [
          {
            value: {
              type: 'Device',
              value: 'iOS',
            },
            type: 'value',
          },
          {
            type: 'operator',
            operator: 'AND',
            children: [
              {
                value: {
                  type: 'Browser',
                  value: 'Safari',
                },
                type: 'value',
              },
              {
                value: {
                  type: 'Device',
                  value: 'iOS',
                },
                type: 'value',
              },
            ],
          },
        ],
      }
    },
    assertions: function(t, exp) {
      t.is(exp.getBucketNameForUser(fixtureGenerators.experiment.context()), 'treatment')
    },
  },
  {
    name: 'experiment - getBucketNameForUser, url matches paths',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.paths = [ '/media/729' ]
    },
    assertions: function(t, exp) {
      t.is(exp.getBucketNameForUser(fixtureGenerators.experiment.context({url: 'https://localhost:3000/media/729'})), 'treatment')
    },
  },
  {
    name: 'experiment - getBucketNameForUser, url does not match paths',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.paths = [ '/media/729' ]
    },
    assertions: function(t, exp) {
      t.falsy(exp.getBucketNameForUser(fixtureGenerators.experiment.context({url: 'https://localhost:3000/media/111'})))
    },
  },
  {
    name: 'experiment - getBucketNameForUser, no url given',
    input: fixtureGenerators.experiment.valid,
    modifiers: function(exp) {
      exp.paths = [ '/media/729' ]
    },
    assertions: function(t, exp) {
      t.falsy(exp.getBucketNameForUser(fixtureGenerators.experiment.context()))
    },
  },
]

async function runTestCase(tc, t) {
  let expData = tc.input()

  if (tc.modifiers) {
    tc.modifiers(expData)
  }

  if (tc.expectedError) {
    await Experiment.create(expData).catch(err => {
      t.true(err.message.includes(tc.expectedError))
    })

    return
  }

  const exp = await Experiment.create(expData)

  t.is(exp.name, expData.name)
  t.is(exp.isActive, expData.isActive)
  t.true(bucketEqual(exp.buckets[0], expData.buckets[0]))
  t.true(bucketEqual(exp.buckets[1], expData.buckets[1]))

  if (tc.assertions) {
    tc.assertions(t, exp)
  }
}

async function runTestCases() {
  const onlyRunTcs = testCases.filter(tc => tc.onlyRun)

  const tcsToRun = onlyRunTcs.length > 0 ? onlyRunTcs : testCases

  tcsToRun.forEach(tc => {
    test.serial(tc.name, runTestCase.bind(null, tc))
  })
}

function bucketEqual(b1, b2) {
  return b1.name === b2.name &&
    b1.start === b2.start &&
    b1.end === b2.end
}

runTestCases()

test('hash function gives uniform distribution', t => {
  let histogram = {}

  for (let i = 0; i < 100000; ++i) {
    const bucket = Experiment.hashToBucket(uuid.v4(), 'derp', 10)

    if (!histogram[bucket]) {
      histogram[bucket] = 1
    } else {
      histogram[bucket] += 1
    }
  }

  for (let i = 0; i < 10; ++i) {
    t.true(Math.abs(histogram[i] - 10000) < 1000)
  }
})

test.skip('hash function gives different buckets based on seed', t => {
  const id = uuid.v4()

  const bucket1 = Experiment.hashToBucket(id, 'derp', 100)
  const bucket2 = Experiment.hashToBucket(id, 'merp', 100)

  t.not(bucket1, bucket2)
})