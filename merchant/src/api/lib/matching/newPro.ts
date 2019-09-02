export {}
const moment = require('moment')
const { ProService, Request, Contact } = require('../../models')
const { matchingBuckets } = require('./buckets')

const DEFAULT_DISTANCE = 50000

/*
 * 新規登録プロに対して初期の依頼リストを登録する
 *
 * @param profile model
 *
 */
async function requestsForNewPro(pro) {
  const distanceQuery = { $multiply: [ {$ifNull: ['$distance', pro.distance || DEFAULT_DISTANCE]}, 1.2 ] }

  const start = moment().subtract({days: 3, hours: 12})
  const end = moment().subtract(3, 'minutes')

  // requestに地点がある場合近い順に並べる
  const requests = await Request.aggregate([
    {$geoNear: {
      spherical: true,
      near: pro.loc,
      distanceField: 'way',
      query: {
        customer: { $ne: pro.pro }, // 本人じゃない
        sent: { $nin: [
          pro._id, // 送信済み
        ] },
        status: 'open',
        // Fancy way of checking that `meets.length < 5`
        'meets.4': { $exists: false },
        service: { $in: pro.services },
        createdAt: {
          $gt: start.toDate(),
          $lt: end.toDate(),
        },
        interview: {$size: 0},
      },
    }},
    {$project: {
      service: 1,
      diff: { $subtract: [ distanceQuery, '$way' ] },
    }},
    {$match: {
      diff: {$gt: 0},
    }},
  ])
  .limit(10)

  for (const request of requests) {
    const proService = await ProService.findOne({
      profile: pro._id,
      service: request.service._id,
    }).select('_id')

    await Contact.createIfNotExists({
      request: request._id,
      proService: proService._id,
      profile: pro._id,
      matchingBucket: matchingBuckets.NEW_PRO,
    })
  }

  return await Promise.all(requests.map(r => Request.findByIdAndUpdate(r._id, {$addToSet: { sent: pro._id } })))
}

module.exports = requestsForNewPro