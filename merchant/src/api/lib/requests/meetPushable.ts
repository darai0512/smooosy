export {}
const { Meet, ProService } = require('../../models')

const meetPushable = async (request) => {
  if (request.meets.length >= 5) return false

  request = await Meet.populate(request, { path: 'pendingMeets', select: 'profile' })
  const profiles = request.pendingMeets.map(m => m.profile)

  // meets by these pro services can be `autoAccept` meet
  const promotedProServices = await ProService.countDocuments({
    profile: {$in: profiles},
    service: request.service._id,
    isPromoted: true,
  })

  // there are more than 5 potential meets
  if (request.meets.length + promotedProServices >= 5) return false

  return true
}

module.exports = meetPushable