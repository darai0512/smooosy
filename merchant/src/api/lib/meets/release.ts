export {}
const { Meet, ProService, Request } = require('../../models')
const { consumePoint, calcPoint, buyPoints } = require('../../routes/points')
const { getRestPointInWeek } = require('../../routes/proServices')
const { emailNewContact } = require('../email')
const logger = require('../logger')

module.exports = release

async function release({ meetId }) {
  const meet = await Meet.findById(meetId)
    .populate('request')
    .populate('service')
    .populate({ path: 'customer', select: 'lastname' })

  if (!meet) throw new Error('not found')

  // only meets with in review status can be released
  if (meet.proResponseStatus !== 'inReview') {
    logger.warn('tried to release meet with status not in review', { proResponseStatus: meet.proResponseStatus, meetId: meet._id, requestId: meet.request._id })
    return
  }

  const proService = await ProService.findOne({
    profile: meet.profile,
    service: meet.service,
  })
  .populate('user')

  // Charge pro's account the needed points
  if (meet.isExactMatch && proService.isPromoted) {

    const rest = await getRestPointInWeek({
      userId: proService.user.id,
      serviceId: proService.service,
      budget: proService.budget,
    })

    // autoAccept have to change to tbd if lower budget
    if (rest < meet.point) {
      meet.proResponseStatus = 'tbd'
    } else if (meet.request.meets.length >= 5) {
      meet.proResponseStatus = 'tbd'
      logger.warn('could not push meet to request', { requestId: meet.request._id, meetId: meet._id})
    } else {
      meet.proResponseStatus = 'autoAccept'
    }

    if (meet.proResponseStatus === 'autoAccept' && meet.point >= 0) {
      const { pointTotals: { total } } = await calcPoint(proService.user.id)
      const pointShortage = meet.point - total

      try {
        // check if meet can save before save
        // something model or DB error, autoAccept downgrade to tbd
        if (meet.validateSync()) {
          throw new Error({message: '不明なエラーが発生しました。'} as any)
        }

        // if not enough points, try to reload user's account
        if (pointShortage > 0) {
          await buyPoints({ user: proService.user, points: pointShortage })
        }

        await consumePoint({
          user: proService.user.id,
          operator: proService.user.id,
          point: meet.point,
          meet: meet.id,
          request: meet.request,
          service: proService.service,
        })

      } catch (e) {
        // If we're here, it means pro did not have enough points and
        // charging their account failed.
        logger.warn('could not charge pro for user-created request', { requestId: meet.request._id, meetId: meet._id })
        meet.proResponseStatus = 'tbd'

        // mark pro's account as in arrears, so they don't appear in search results
        proService.user.isInArrears = true
        await proService.user.save()
      }
    }

  } else {
    meet.proResponseStatus = 'tbd'
  }

  await meet.save()

  if (meet.proResponseStatus === 'autoAccept') {
    await Request.findByIdAndUpdate(
      meet.request._id,
      {
        $addToSet: { meets: meet.id },
        $pull: { pendingMeets: meet.id },
      }
    )
  }

  // プロにメール送信
  emailNewContact({
    user: proService.user,
    profile: {
      pro: proService.user,
    },
    lastname: meet.customer.lastname,
    request: {
      ...meet.request.toObject(),
      service: meet.service,
    },
    meet,
  })
}
