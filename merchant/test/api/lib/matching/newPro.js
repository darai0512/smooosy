const test = require('ava')
const { ObjectID } = require('mongodb')
const moment = require('moment')

const runTestCases = require('../../models/helpers/runTestCases')
const { generateServiceUserProfile, generateRequestViaModel, postProcess } = require('../../helpers/testutil')

const { Request, Contact } = require('../../../../src/api/models')
const requestsForNewPro = require('../../../../src/api/lib/matching/newPro')
const {matchingBuckets} = require('../../../../src/api/lib/matching/buckets')

const moment3MinutesAgo = moment().subtract({minutes: 3, seconds: 1})
const moment3DaysAgo = moment().subtract({days: 3, hours: 11, minutes: 59})
const locNear59kmFromTokyo = {
  type: 'Point',
  coordinates: [ 139.268801, 35.304800 ],
}

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  await generateRequestViaModel(t)
})

test.afterEach.always(async () => {
  await postProcess()
})

const requestForNewProTestCases = [
  {
    name: 'classic requestForNewPro - OK createdAt: start',
    modifiers: async function(context) {
      const requestBodyCreatedAt3MinutesAgo = Object.assign(context.requestBody, {
        createdAt: moment3MinutesAgo,
      })
      context.request2 = await Request.create(requestBodyCreatedAt3MinutesAgo)
    },
    expectedRequestIds: function(context) {
      return [context.request2.id]
    },
  },
  {
    name: 'classic requestForNewPro - OK createdAt: end',
    modifiers: async function(context) {
      const requestBodyCreatedAt3DaysAgo = Object.assign(context.requestBody, {
        createdAt: moment3DaysAgo,
      })
      context.request2 = await Request.create(requestBodyCreatedAt3DaysAgo)
    },
    expectedRequestIds: function(context) {
      return [context.request2.id]
    },
  },
  {
    name: 'classic requestForNewPro - OK location: 59.9km',
    modifiers: async function(context) {
      const requestBodyNear59km = Object.assign(context.requestBody, {
        loc: locNear59kmFromTokyo,
        createdAt: moment3DaysAgo,
      })
      context.request2 = await Request.create(requestBodyNear59km)
    },
    expectedRequestIds: function(context) {
      return [context.request2.id]
    },
  },
  {
    name: 'classic requestForNewPro - request over limit only for new pro',
    modifiers: async function(context) {
      context.request.createdAt = moment3DaysAgo
      // add sent data to the limit
      for (let i = 0; i < 120; i++) {
        const id = new ObjectID()
        context.request.sent.push(id.toString())
      }
      await context.request.save()
    },
    expectedRequestIds: function(context) {
      return [context.request.id]
    },
  },
  {
    name: 'classic requestForNewPro - max 10 requests geoNear',
    modifiers: async function(context) {
      const requestBodyCreatedAt3MinutesAgo = Object.assign(context.requestBody, {
        createdAt: moment3DaysAgo,
      })
      for (let i = 0; i < 10; i++) {
        context[`request${i}`] = await Request.create(requestBodyCreatedAt3MinutesAgo)
      }

      // NOT send 11th request with a long distance
      const requestBodyNear59km = Object.assign(context.requestBody, {
        loc: locNear59kmFromTokyo,
        createdAt: moment().subtract({minutes: 3, seconds: 1}),
      })
      await Request.create(requestBodyNear59km)
    },
    expectedRequestIds: function(context) {
      return [...Array(10).keys()].map(i => context[`request${i}`].id)
    },
  },
  {
    name: 'classic requestForNewPro - NG interview flag',
    modifiers: async function(context) {
      const requestBodyCreatedAt3MinutesAgo = Object.assign(context.requestBody, {
        createdAt: moment3MinutesAgo,
        interview: [ 'testwords' ],
      })
      context.request2 = await Request.create(requestBodyCreatedAt3MinutesAgo)
    },
    expectedRequestIds: function() {
      return []
    },
  },
]

async function runRequestForNewProTestCase(t, tc) {
  // run modifiers on input
  if (tc.modifiers) {
    await tc.modifiers(t.context)
  }

  const requests = await requestsForNewPro(t.context.profile)
  if (tc.debug) {
    console.log('matching requests:', requests)
  }

  const requestIds = requests.map(p => p._id.toString())
  t.deepEqual(requestIds.sort(), tc.expectedRequestIds(t.context).sort())

  for (let id of requestIds) {
    const r = await Request.findById(id)
    const sentIds = r.sent.map(s => s._id.toString())
    t.true(sentIds.includes(t.context.profile._id.toString()))
  }

  const contactCount = await Contact.count({
    request: { $in: requestIds },
    profile: t.context.profile,
    matchingBucket: matchingBuckets.NEW_PRO,
  })

  t.is(contactCount, requestIds.length)
}

runTestCases(test, requestForNewProTestCases, runRequestForNewProTestCase)
