const moment = require('moment')
import instant from '../lib/matching/instant'
const { ProService } = require('../models')
const { rolloutDates } = require('@smooosy/config')

// TODO: 車キャンペーン後削除
async function onePointCampaign(proId, serviceId) {

  // 車の１ポイントキャンペーン
  if (
    proId
    && serviceId
    && moment().isSameOrAfter(rolloutDates.enableMatchMoreCampaign)
    && moment().isSameOrBefore(rolloutDates.disableMatchMoreCampaign)
  ) {
    const proService = await ProService.findOne({user: proId, service: serviceId})
      .populate({
        path: 'service',
        select: 'tags matchMoreEditable',
      })
      .populate({
        path: 'user',
        select: 'hasActiveCard isMatchMore schedule',
      })
      .select('setupLocation setupJobRequirements setupPriceValues')
      .lean({virtuals: true})
    if (!proService) return false

    const isCarCategory = proService.service.tags[0] === '車検・修理' && proService.service.matchMoreEditable
    if (isCarCategory) {
      const fulfill = instant.isMatchMoreProService({proService, user: proService.user})
        && proService.setupPriceValues
        && proService.user.hasActiveCard

      if (fulfill) {
        return true
      }
    }
  }

  return false
}

module.exports = {
  onePointCampaign,
}
