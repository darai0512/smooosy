const test = require('ava')

const { Meet } = require('../../../../src/api/models')
const { generateServiceUserProfile, generateRequestViaModel, addProServiceToContext, postProcess } = require('../../helpers/testutil')
import { findMatchingProServicesForQuery } from '../../../../src/api/lib/matching/instant'
const runTestCases = require('../../models/helpers/runTestCases')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  await generateRequestViaModel(t)
})

test.afterEach.always(async () => {
  await postProcess()
})

const testCases = [
  {
    name: 'instant matching - standard case, nearby (tokyo) pro matches',
    modifiers: async function(context) {
      const service = await context.service.populate('queries').execPopulate()
      context.queries = service.queries
    },
    expectedProServiceIds: function(context) {
      return [context.proService.id]
    },
  },
  {
    dontSortProfiles: true,
    name: 'instant matching - filter by job requirements',
    modifiers: async function(context) {
      context.queries = [{
        _id: context.singular._id,
        usedForPro: true,
        options: [{
          _id: context.singular.options[1]._id,
          usedForPro: true,
          checked: true,
        }],
      }]

      await addProServiceToContext('proServiceNoJobReqs', context, ps => {
        ps.jobRequirements = []
      })
      await addProServiceToContext('proServiceNotMatchingJobsReqs', context, ps => {
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [context.singular.options[0]._id],
        }]
      })
      await addProServiceToContext('proServiceWithJobReqs', context, ps => {
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [ context.singular.options[1]._id ],
        }]
      })
      await addProServiceToContext('proServicePromotedWithJobReqsAndPriceValues', context, ps => {
        ps.isPromoted = true
        ps.user.hasActiveCard = true
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [ context.singular.options[1]._id ],
        }]
        ps.priceValues = [{
          type: 'base',
          answers: [ context.singular.options[1]._id ],
          value: 2500,
        }]
      })
      await addProServiceToContext('proServicePromotedWithJobReqs', context, ps => {
        ps.isPromoted = true
        ps.user.hasActiveCard = true
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [ context.singular.options[1]._id ],
        }]
        ps.priceValues = []
      })
    },
    expectedProServiceIds: function(context) {
      return [
        context.proServicePromotedWithJobReqsAndPriceValues.id,
        context.proServicePromotedWithJobReqs.id,
        context.proServiceWithJobReqs.id,
        context.proServiceNoJobReqs.id,
      ]
    },
  },
  {
    dontSortProfiles: true,
    name:  'instant matching - pro matches when non usedForPro option is selected',
    modifiers: async (context) => {
      context.queries = [{
        _id: context.singular._id,
        usedForPro: true,
        options: [{
          _id: context.singular.options[0]._id,
          usedForPro: false,
          checked: true,
        }],
      }]
      await addProServiceToContext('proServiceNoJobReqs', context, ps => {
        ps.jobRequirements = []
      })
      await addProServiceToContext('proServiceWithJobReqs', context, ps => {
        ps.jobRequirements = [{
          query: context.singular._id,
          answers: [ context.singular.options[1]._id ],
        }]
      })
    },
    expectedProServiceIds: (context) => {
      return [
        context.proService.id,
        context.proServiceWithJobReqs.id,
        context.proServiceNoJobReqs.id,
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

  const request = t.context.request
  request.service = t.context.service

  const profiles = await findMatchingProServicesForQuery({
    service: request.service,
    location: request.loc,
    description: t.context.queries,
    debug: tc.debug,
  })

  if (tc.debug) {
    console.log('matching profiles:', profiles)
  }

  let profileIds = profiles.map(p => p._id.toString())

  if (tc.dontSortProfiles) {
    if (tc.debug) {
      console.log('actual:', profileIds)
      console.log('expected:', tc.expectedProServiceIds(t.context))
    }
    t.deepEqual(profileIds, tc.expectedProServiceIds(t.context))
  } else {
    t.deepEqual(profileIds.sort(), tc.expectedProServiceIds(t.context).sort())
  }
}
