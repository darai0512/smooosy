const test = require('ava')

const { ProService, Service } = require('../../../src/api/models')
const { generateServiceUserProfile, generateCandidateLocations, postProcess } = require('../helpers/testutil')
const {compObjRefs} = require('../../../src/api/lib/util')



test.afterEach.always(postProcess)

const proServiceFixtures = {
  valid: function(proId, profile, serviceId, queryId, answerId, location, distance) {
    return {
      user: proId,
      profile,
      service: serviceId,
      jobRequirements: [{
        query: queryId,
        answers: [answerId],
      }],
      loc: location,
      distance,
    }
  },
}

async function makeProService(t) {
  await generateServiceUserProfile(t, { excludeModels: ['proService'] })

  const proServiceData = proServiceFixtures.valid(
    t.context.pro._id,
    t.context.profile._id,
    t.context.service3._id,
    t.context.textarea._id,
    t.context.textarea.options[0]._id,
    t.context.locations.tokyo,
    50000,
  )

  return await ProService.create(proServiceData)
}

test('ProService model', async t => {
  const proService = await makeProService(t)

  const proServiceData = proServiceFixtures.valid(
    t.context.pro._id,
    t.context.profile._id,
    t.context.service3._id,
    t.context.textarea._id,
    t.context.textarea.options[0]._id,
    t.context.locations.tokyo,
    50000,
  )

  t.true(compObjRefs(proService.user._id, proServiceData.user._id))
  t.true(compObjRefs(proService.service._id, proServiceData.service._id))
  t.true(compObjRefs(
    proService.jobRequirements[0].query._id,
    proServiceData.jobRequirements[0].query
  ))
  t.true(
    compObjRefs(
    proService.jobRequirements[0].answers[0]._id,
    proServiceData.jobRequirements[0].answers[0]
  ))
})

test('update distances', async t => {
  const proService = await makeProService(t)
  await generateCandidateLocations(t)

  // save distance lower so we filter out Saitama as a target location
  proService.distance = 3000
  await proService.save()

  await Service.update({ _id: proService.service }, { $set: { showTargetLocationsToPros: true } })

  await ProService.updateLocations({
    userId: proService.user._id,
    profileId: proService.profile._id,
    origin: t.context.locations.tokyoNogizaka,
    distance: proService.distance,
  })

  const updatedProService = await ProService.findById(proService._id)

  // should contain tokyo and saitama
  t.is(updatedProService.candidateLocations.length, 2)
  // should only contain tokyo
  t.is(updatedProService.targetLocations.length, 1)
  // should be updated to Nogizaka instead of Akasaka
  t.deepEqual(updatedProService.loc, t.context.locations.tokyoNogizaka)
})