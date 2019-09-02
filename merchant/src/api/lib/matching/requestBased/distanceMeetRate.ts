export {}
const cloneDeep = require('lodash/cloneDeep')

const { RuntimeConfig, ProService, Request } = require('../../../models')

import instant from '../instant'
const {
  injectDescriptionIntoQueries,
  getOnlyProQuestions,
  getBaseQuery,
  findSpecialCompanyProService,
} = require('../common')
const { matchingBuckets } = require('../buckets')

/*
 * requestにマッチするプロを探すアルゴリズム
 *
 * @param sentとmeetsのproをpopulateしたrequest
 *
 */
const DEFAULT_DISTANCE = 50000
async function match(r, onlyTopPros, totalLimit, distanceLimit) {
  const matchParams = r.matchParams || {}

  const baseQuery = await getBaseQuery(r)

  let proServices = []
  // ベアーズ特別対応
  const specialCompanyProService = await findSpecialCompanyProService(baseQuery)
  if (specialCompanyProService) {
    proServices.push(specialCompanyProService)
  }

  const joinProfilesPipeline = instant.joinProfilesPipeline({
    onlyProfiles: true,
  })

  const filterByProfileQuery = {
    $match: {
      // remove pro services whose profile no longer exists
      'profile': {$exists: true},
      'profile.suspend': {$exists: false},  // 運営がBAN
      'profile.deactivate': {$ne: true},    // プロが退会
    },
  }

  if (r.loc) {
    const pipeline = []
    // requestに地点がある場合近い順に並べる
    const $geoNear = {
      spherical: true,
      near: r.loc,
      distanceField: 'way',
      limit: 1000000, // サービスの登録プロ数がこれを超えたら危険
      query: baseQuery,
    }

    pipeline.push(
      {$geoNear},
      {$match: {
        _id: { $nin: proServices.map(p => p._id) },
      }},
      ...joinProfilesPipeline,
      filterByProfileQuery
    )

    if (!r.canWorkRemotely) {
      // マッチ距離のクエリ
      // (プロの設定 || request.distance || 50km) x 1.2
      const distanceQuery = { $multiply: [ {$ifNull: ['$distance', await Request.getBudgetBasedDistance(r) || DEFAULT_DISTANCE]}, 1.2 ] }

      // マッチ距離よりも距離が短いように絞り込む
      pipeline.push(
        {$project: {
          user: true,
          profile: true,
          way: true,
          diff: { $subtract: [ distanceQuery, '$way' ] },
          jobRequirements: matchParams.useConditionalMatching || matchParams.showExactMatch || undefined,
          matchingBucket: { $literal: matchingBuckets.CLASSIC_DISTANCE },
        }},
        {$match: {
          diff: {$gt: 0},
        }}
      )
    } else {
      pipeline.push(
        {
          $addFields: { diff: 1 },
        }
      )
    }

    let usingConditionalMatching = false, showExactMatch = false

    if (matchParams.useConditionalMatching || matchParams.showExactMatch) {
      const queries = cloneDeep(r.service.queries)
      injectDescriptionIntoQueries(r.description, queries)
      const description = getOnlyProQuestions(queries)

      if (description.length) {
        pipeline.push({
          $addFields: {
            isExactMatch: {
              $and: description.map(q => ({
                $anyElementTrue: [
                  { $map: {
                    input: '$jobRequirements',
                    as: 'jr',
                    in: {
                      $and: [
                        { $eq: [ '$$jr.query', q._id ] },
                        {
                          $setIsSubset: [
                            q.answers.map(a => a._id),
                            '$$jr.answers',
                          ],
                        },
                      ],
                    },
                  },
                  },
                ],
              })),
            },
          },
        })

        showExactMatch = true

        // only sort if we matching algorithm enabled
        if (matchParams.useConditionalMatching) {
          pipeline.push({
            $sort: {
              isExactMatch: -1,
              diff: -1,
            },
          })

          usingConditionalMatching = true
        }
      }
    }

    const distanceProServices = await ProService.aggregate(pipeline).limit(distanceLimit)
    proServices.push(...distanceProServices)

    // プロが足りない場合以降の処理は無意味なのでearly return
    if (!onlyTopPros && (distanceProServices.length < distanceLimit || distanceProServices.length >= totalLimit)) {
      return proServices
    }

    if (onlyTopPros) {
      proServices = []
    }

    const runtimeConfig = await RuntimeConfig.getConfigNameForRequest(r)

    let sortPipeline: any[] = [
      {$match: {
        _id: { $nin: proServices.map(p => p._id) },
      }},
      // ProStatから見積もり頻度を取得
      {$lookup: {
        from: 'prostats',
        localField: 'profile._id',
        foreignField: 'profiles',
        as: 'prostats',
      }},
      {$replaceRoot: {
        newRoot: { $mergeObjects: [
          { $arrayElemAt: [ '$prostats', 0 ] },
          '$$ROOT',
        ] },
      }},
    ]

    const getRankPipeline = [
      {$project: {
        user: true,
        profile: true,
        diff: true,
        way: true,
        meetRateLast3Months: true,
        isExactMatch: showExactMatch || usingConditionalMatching || undefined,
        // small value is better
        // (distance between the pro and the request) * (1 - 0.8 * meetRate)
        //rank: { $multiply: [
        //  '$way',
        //  { $subtract: [ 1, { $multiply: [ 0.8, { $ifNull: ['$meetRateLast3Months', 0] } ] } ] },
        //] },
        rank: { $multiply: [ '$diff', { $ifNull: ['$meetRateLast3Months', 0] } ] },
        matchingBucket: {
          $literal: matchingBuckets.CLASSIC_MEET_RATE_DISTANCE,
        },
      }},
    ]

    // TODO: This code does not work properly
    const getRankByServicePipeline = [
      {
        $match: {
          'byService.service': r.service._id,
          'byService.byLookbackDate.lookbackDate': 'last3Months',
        },
      },
      {
        $unwind: '$byService',
      },
      {
        $unwind: '$byService.byLookbackDate',
      },
      {
        $addFields: {
          serviceMeetRateLast3Months: '$byService.byLookbackDate.meetRate',
        },
      },
      {$project: {
        user: true,
        profile: true,
        way: true,
        diff: true,
        serviceMeetRateLast3Months: true,
        // small value is better
        // (distance between the pro and the request) * (1 - 0.8 * meetRate)
        //rank: { $multiply: [
        //  '$way',
        //  { $subtract: [ 1, { $multiply: [ 0.8, { $ifNull: ['$meetRateLast3Months', 0] } ] } ] },
        //] },
        rank: { $multiply: [ '$diff', { $ifNull: ['$serviceMeetRateLast3Months', 0] } ] },
      }},
    ]

    if (runtimeConfig === 'DISABLED useByServiceMeetRate') {
      sortPipeline = sortPipeline.concat(getRankByServicePipeline)
    } else {
      sortPipeline = sortPipeline.concat(getRankPipeline)
    }

    let sortStep

    if (usingConditionalMatching) {
      sortStep = {
        $sort: {
          isExactMatch: -1,
          rank: -1,
        },
      }
    } else {
      sortStep = {
        $sort: {
          rank: -1,
        },
      }
    }

    sortPipeline.push(sortStep)
    pipeline.push(...sortPipeline)

    const distanceMeetRateProServices = await ProService.aggregate(pipeline).limit(totalLimit - proServices.length)
    proServices.push(...distanceMeetRateProServices)

    return proServices
  }

  // 位置情報がない依頼
  // 毎回同じ結果を防ぐためにランダマイズする
  return await ProService.aggregate([
    {$match: baseQuery},
    ...joinProfilesPipeline,
    filterByProfileQuery,
    { $addFields: { matchingBucket: matchingBuckets.CLASSIC_RANDOM_FILTER } },
    {$sample: { size: totalLimit }},
  ])
}

async function convertMatchedProServicesToProfiles(r, onlyTopPros, distanceMeetRateLimit, distanceLimit) {
  const proServices = await match(r, onlyTopPros, distanceMeetRateLimit, distanceLimit)

  // backwards compatibility with old code that uses profiles
  return proServices.map(ps => {
    ps.profile.isExactMatch = ps.isExactMatch
    ps.profile.proService = ps
    ps.profile.matchingBucket = ps.matchingBucket
    ps.profile.matchingAlgorithm = 'classicProService'

    // prevent circular reference in case we want to convert return result to
    // JSON
    const profile = ps.profile
    delete ps.profile

    return profile
  })
}

module.exports = convertMatchedProServicesToProfiles
