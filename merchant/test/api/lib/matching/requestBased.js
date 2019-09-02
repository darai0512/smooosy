const test = require('ava')
const moment = require('moment')

const stringify = require('json-stringify-pretty-compact')

const { RuntimeConfig, Meet } = require('../../../../src/api/models')
const { generateServiceUserProfile, generateRequestViaModel, addProServiceToContext, postProcess, createSpecialProAtOkinawa } = require('../../helpers/testutil')
const findMatchingProsForRequest = require('../../../../src/api/lib/matching/requestBased')
const {matchingBuckets} = require('../../../../src/api/lib/matching/buckets')
const matchConfig = require('../../../../src/api/lib/matching/config')
const switcher = require('../../../../src/api/lib/switcher')
const runTestCases = require('../../models/helpers/runTestCases')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  await generateRequestViaModel(t)
})

test.afterEach.always(async () => {
  await postProcess()
  await RuntimeConfig.remove()
})

const testCases = [
  {
    name: 'classic matching - standard case, nearby (tokyo) pro matches',
    expectedProfileIds: function(context) {
      return [context.profile.id]
    },
  },
  {
    name: 'classic matching - service filtering',
    modifiers: async function(context) {
      context.profile2.services = [context.service2.id]
      await context.profile2.save()
    },
    expectedProfileIds: function(context) {
      return [context.profile.id]
    },
  },
  {
    name: 'classic matching - distance filtering',
    modifiers: async function(context) {
      context.profile2.loc = {
        type: 'Point',
        coordinates: [
          1,
          1,
        ],
      }
      await context.profile2.save()
    },
    expectedProfileIds: function(context) {
      return [context.profile.id]
    },
  },
  {
    name: 'classic matching - remote work',
    modifiers: async function(context) {
      context.request.canWorkRemotely = true
      context.profile2.loc = {
        type: 'Point',
        coordinates: [
          1,
          1,
        ],
      }
      await context.request.save()
      await context.profile2.save()
    },
    expectedProfileIds: function(context) {
      return [context.profile.id, context.profile2.id]
    },
  },
  {
    name: 'classic matching - request has no location',
    modifiers: async function (context) {
      context.request.loc = null
      await context.request.save()
    },
    expectedProfileIds: function(context) {
      return [context.profile.id, context.profile2.id]
    },
    assertions: function(t, profiles) {
      t.assert(profiles.every(p =>
        p.matchingBucket === matchingBuckets.CLASSIC_RANDOM_FILTER
      ))
    },
  },
  {
    name: 'classic matching - overall meet rate',
    modifiers: async function(context) {
      // make one pro slightly further away - they will still be
      // ranked higher because they have higher meet rate
      context.profile2.loc = context.locations.tokyoNogizaka
      context.proService2.loc = context.locations.tokyoNogizaka
      context.proService2.jobRequirements = context.proService.jobRequirements
      await Promise.all([
        context.profile2.save(),
        context.proService2.save(),
      ])
    },
    dontSortProfiles: true,
    onlyTopPros: true,
    expectedProfileIds: function(context) {
      // pro 2 has higher overall meet rate than pro 1
      return [context.profile2.id, context.profile.id]
    },
  },
  {
    name: 'classic matching - by service meet rate',
    modifiers: async function(context) {
      // make one pro slightly further away - they will still be
      // ranked higher because they have higher meet rate
      context.profile2.loc = context.locations.tokyoNogizaka
      context.proService2.loc = context.locations.tokyoNogizaka
      await Promise.all([
        context.profile2.save(),
        context.proService2.save(),
      ])

      await RuntimeConfig.create({
        name: 'useByServiceMeetRate',
        isEnabled: true,
        priority: 1,
        rollout: {
          start: 0,
          end: 100,
        },
      })
    },
    dontSortProfiles: false,
    onlyTopPros: true,
    expectedProfileIds: function(context) {
      // pro 1 has higher meet rate than pro 2 for the service
      return [context.profile.id, context.profile2.id]
    },
  },
  {
    name: 'classic matching - use proService matching',
    mode: switcher.Mode.PRIMARY,
    modifiers: async function(context) {
      // make location same so that pros are only compared based on meet rate
      context.proService2.loc = context.proService.loc
      await context.proService2.save()
    },
    dontSortProfiles: false,
    expectedProfileIds: function(context) {
      // tokyo pro (pro 1) and "hokkaido" pro (pro 2) get returned because
      // we're using pro services for matching. If we had been using profiles,
      // pro2 would not be returned, because we only updated proService2 in the
      // modifiers.
      return [context.profile.id, context.profile2.id]
    },
  },
  {
    name: 'classic matching - should match special company profile',
    mode: switcher.Mode.PRIMARY,
    modifiers: async function(context) {
      // create profile with BEARS_PROFILE_ID
      await RuntimeConfig.create({
        name: 'bears_match_all',
        isEnabled: true,
        value: { bool: true },
        priority: 1,
        rollout: {
          start: 0,
          end: 100,
        },
      })
      const { profile } = await createSpecialProAtOkinawa({service: context.service})
      context.bearsProfile = profile
    },
    dontSortProfiles: false,
    expectedProfileIds: function(context) {
      return [context.profile.id, context.bearsProfile.id]
    },
  },
  {
    name: 'ideal matching - distance and exact match',
    dontSortProfiles: true,
    matchBuckets: function() {
      const matchBuckets = matchConfig.makeMatchBuckets().filter(m => (
        m.name === 'ideal'
      ))
      matchBuckets[0].limit = 2
      return matchBuckets
    },
    modifiers: async function(context) {


      context.request.matchParams = {
        useIdealMatching: true,
      }
      await context.request.save()

      await addProServiceToContext('proNotMatchingRequirements', context, ps => {
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [context.singular.options[1]._id],
        }]
      })

      // make this pro further away than the other pro from request:
      // they should still rank higher because they match the request's
      // job requirements
      context.proService.loc = context.locations.tokyoNogizaka
      await context.proService.save()
    },
    expectedProfileIds: function(context) {
      // proNotMatchingRequirements is ranked last
      return [
        context.profile.id, context.proNotMatchingRequirements.profile._id.toString(),
      ]
    },
    assertions: function(t, profiles) {
      t.assert(profiles.every(p =>
        [
          matchingBuckets.HEAVY_USER,
          matchingBuckets.LIGHT_USER,
        ].includes(p.matchingBucket),
      ))
    },
  },
  {
    name: 'ideal matching - meet rate, distance, exact match',
    dontSortProfiles: true,
    matchBuckets: function() {
      return matchConfig.makeMatchBuckets().filter(m => (
        m.name === 'ideal'
      ))
    },
    matchParams: {
      useIdealMatching: true,
    },
    modifiers: async function(context) {
      // this pro should rank highest because they have a higher meet rate AND match the job requirements
      await addProServiceToContext('proMatchingRequirementsHighMeetRate', context, (ps, proStat) => {
        ps.loc = context.locations.tokyoNogizaka
        proStat.meetRateLast3Months = 0.8
      })

      await addProServiceToContext('proMatchingRequirements', context, (ps, proStat) => {
        proStat.meetRateLast3Months = 0.4
      })

      // make this pro further away than the other pro from request:
      // they should still rank higher because they match the request's
      // job requirements
      context.proService.loc = context.locations.tokyoNogizaka
      await context.proService.save()

      await addProServiceToContext('proNotMatchingRequirements', context, (ps, proStat) => {
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [context.singular.options[1]._id],
        }]
        proStat.meetRateLast3Months = 0.9
      })
    },
    expectedProfileIds: function(context) {
      return [
        // 1 km from request, 0.8 meet rate, exact match
        context.proMatchingRequirementsHighMeetRate.profile._id.toString(),
        // 0 km from request, 0.9 meet rate, not exact match
        context.proNotMatchingRequirements.profile._id.toString(),
        // 0 km from request, 0.4 meet rate, exact match
        context.proMatchingRequirements.profile._id.toString(),
        // 1 km from request, 0.4 meet rate, exact match
        context.profile.id,
      ]
    },
    assertions: function(t, profiles) {
      t.assert(profiles.every(p =>
        [
          matchingBuckets.HEAVY_USER,
          matchingBuckets.LIGHT_USER,
        ].includes(p.matchingBucket),
      ))
    },
  },
  {
    name: 'ideal matching - new pros',
    dontSortProfiles: true,
    matchParams: {
      useIdealMatching: true,
    },
    matchBuckets: function() {
      const matchBuckets = matchConfig.makeMatchBuckets()
      // 1 ideal match pro
      matchBuckets[0].limit = 1
      // 1 <1-month pro
      matchBuckets[1].limit = 1
      // 1 <2-month pro
      matchBuckets[2].limit = 1
      // 1 <3-month pro
      matchBuckets[1].limit = 1

      return matchBuckets
    },
    modifiers: async function(context) {
      // this pro should rank highest because they have a higher meet rate AND match the job requirements
      await addProServiceToContext('proMatchingRequirementsHighMeetRate', context, (ps, proStat) => {
        ps.loc = context.locations.tokyoNogizaka
        proStat.meetRateLast3Months = 0.8
      })

      await addProServiceToContext('oneMonthPro', context, (ps) => {
        ps.user.createdAt = moment().subtract(7, 'days').toDate()
      })

      await addProServiceToContext('twoMonthPro', context, (ps) => {
        ps.user.createdAt = moment().subtract(35, 'days').toDate()
      })

      await addProServiceToContext('threeMonthPro', context, (ps) => {
        ps.user.createdAt = moment().subtract(70, 'days').toDate()
      })

      // make this pro further away than the other pro from request:
      // they should still rank higher because they match the request's
      // job requirements
      context.proService.loc = context.locations.tokyoNogizaka
      await context.proService.save()

      await addProServiceToContext('proNotMatchingRequirements', context, (ps, proStat) => {
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [context.singular.options[1]._id],
        }]
        proStat.meetRateLast3Months = 0.9
      })
    },
    expectedProfileIds: function(context) {
      return [
        context.proMatchingRequirementsHighMeetRate.profile._id.toString(),
        context.oneMonthPro.profile._id.toString(),
        context.twoMonthPro.profile._id.toString(),
        context.threeMonthPro.profile._id.toString(),
      ]
    },
  },
]

runTestCases(test, testCases, runTestCase)

async function runTestCase(t, tc) {
  // clear meets so we can match to all pros
  await Meet.remove()

  // run modifiers on input
  if (tc.modifiers) {
    await tc.modifiers(t.context)
  }

  if (tc.matchParams) {
    t.context.request.matchParams = tc.matchParams
  }

  let matchBuckets

  if (tc.matchBuckets) {
    matchBuckets = tc.matchBuckets()
  }

  const profiles = await findMatchingProsForRequest({
    request: t.context.request,
    onlyTopPros: tc.onlyTopPros,
    mode: tc.mode,
    matchBuckets,
  })

  if (tc.debug) {
    console.log('matching profiles:', stringify(profiles))
  }

  let profileIds = profiles.map(p => p._id.toString())

  if (tc.dontSortProfiles) {
    t.deepEqual(profileIds, tc.expectedProfileIds(t.context))
  } else {
    t.deepEqual(profileIds.sort(), tc.expectedProfileIds(t.context).sort())
  }

  if (tc.assertions) {
    tc.assertions(t, profiles)
  }
}
