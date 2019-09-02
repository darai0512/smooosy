export {}
const cloneDeep = require('lodash/cloneDeep')

const { ProService, Request } = require('../../../models')

import instant from '../instant'
const {
  injectDescriptionIntoQueries,
  getOnlyProQuestions,
  getBaseQuery,
} = require('../common')
const { matchingBuckets } = require('../buckets')
const matchConfig = require('../config')

const HEAVY_USER_THRESHOLD = 0.1

const USER_TYPES = {
  HEAVY_USER: 'heavyUser',
  LIGHT_USER: 'lightUser',
}

/*
 * requestにマッチするプロを探すアルゴリズム
 *
 * @param sentとmeetsのproをpopulateしたrequest
 *
 */
const DEFAULT_DISTANCE = 50000
async function match(r, matchParams = {
  limit: 100,
  userFilters: null,
  matchWeights: new Error('match weights required'),
  excludeUserIds: [],
  isNewPro: false,
  name: '',
}) {
  const baseQuery = await getBaseQuery(r, matchParams.excludeUserIds)

  if (!r.loc) {
    // 位置情報がない依頼
    // 毎回同じ結果を防ぐためにランダマイズする
    return await ProService.aggregate([
      {$match: baseQuery},
      ...(matchParams.userFilters ? filterByUserPipeline(matchParams.userFilters) : []),
      ...filterByProfilePipeline(),
      {$addFields: { matchingBucket: matchingBuckets.CLASSIC_RANDOM_FILTER }},
      {$sample: { size: matchParams.limit }},
    ])
  }

  const pipeline = []

  // requestに地点がある場合近い順に並べる
  const $geoNear = {
    spherical: true,
    near: r.loc,
    distanceField: 'way',
    limit: 1000000, // サービスの登録プロ数がこれを超えたら危険
    query: baseQuery,
  }

  pipeline.push({$geoNear}, ...filterByProfilePipeline())

  if (matchParams.userFilters) {
    pipeline.push(...filterByUserPipeline(matchParams.userFilters))
  }

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
        jobRequirements: true,
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

  const queries = cloneDeep(r.service.queries)
  injectDescriptionIntoQueries(r.description, queries)
  const description = getOnlyProQuestions(queries)

  if (description.length) {
    pipeline.push(isExactMatchExpr(description))
  }

  pipeline.push(...addProStatsPipeline())
  pipeline.push(...sortPipeline(matchParams.matchWeights, matchParams.isNewPro))
  pipeline.push({
    $addFields: {
      userBucket: matchParams.name,
    },
  })

  return await ProService.aggregate(pipeline).limit(matchParams.limit)
}

function isExactMatchExpr(description) {
  return {
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
  }
}

function filterByProfilePipeline() {
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

  return [
    ...joinProfilesPipeline,
    filterByProfileQuery,
  ]
}

function filterByUserPipeline(userFilters) {
  return [
    {
      $lookup: {
        from: 'users',
        foreignField: '_id',
        localField: 'user',
        as: 'users',
      },
    },
    {
      $addFields: { user: { $arrayElemAt: [ '$users', 0 ] } },
    },
    {
      $project: { users: 0 },
    },
    {
      $match: userFilters,
    },
  ]
}

function addProStatsPipeline() {
  return [
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
    {
      $project: {
        prostats: 0,
      },
    },
  ]
}

function sortPipeline(matchWeights, isNewPro) {
  return [
    {
      $addFields: {
        userType: {
          $cond: {
            if: {
              $gte: [ '$meetRateLast3Months', HEAVY_USER_THRESHOLD ],
            },
            then: USER_TYPES.HEAVY_USER,
            else: USER_TYPES.LIGHT_USER,
          },
        },
      },
    },
    {
      $addFields: {
        weights: {
          $switch: {
            branches: [
              {
                case: USER_TYPES.HEAVY_USER,
                then: matchWeightsExpr(matchWeights.heavyUser),
              },
            ],
            default: matchWeightsExpr(matchWeights.lightUser),
          },
        },
      },
    },
    {
      $addFields: {
        rank: {
          $multiply: [
            isNewPro ? 1 : '$meetRateLast3Months',
            '$weights.distance',
            '$weights.exactMatch',
          ],
        },
      },
    },
    {
      $sort: {
        rank: -1,
      },
    },
    {
      $addFields: {
        matchingBucket: '$userType',
      },
    },
  ]
}

function matchWeightsExpr(weights) {
  return {
    exactMatch: {
      $cond: {
        if: '$isExactMatch',
        then: weights.exactMatch.is,
        else: weights.exactMatch.isNot,
      },
    },
    distance: {
      $switch: {
        branches: weights.distance
          .filter(d => !d.isDefault)
          .map(d => ({
            case: {
              $and:
              [
                { $gte: [ '$way', d.lower ] },
                { $lt: [ '$way', d.upper ] },
              ],
            },
            then: {
              $subtract:
              [
                d.lowerValue,
                {
                  $multiply: [
                    { $subtract: [ '$way', d.lower ] },
                    (d.lowerValue - d.upperValue)/(d.upper - d.lower),
                  ],
                },
              ],
            },
          })),
        default: weights.distance.find(d => d.isDefault).value,
      },
    },
  }
}

async function convertMatchedProServicesToProfiles(r, onlyTopPros, limit, normalLimit, matchBuckets) {
  const proServices = []

  matchBuckets = matchBuckets || matchConfig.makeMatchBuckets()

  // - run matching for each bucket
  // - exclude previous bucket's matches from subsequent match runs.
  // - return joined result of all matches (up to 160 matches)
  for (const bucket of matchBuckets) {
    const matchedProServices = await match(r, {
      name: bucket.name,
      matchWeights: bucket.matchWeights,
      userFilters: bucket.userFilters,
      limit: bucket.limit,
      excludeUserIds: proServices.map(ps => ps.user._id),
      isNewPro: bucket.isNewPro,
    })

    proServices.push(...matchedProServices)
  }

  // backwards compatibility with old code that uses profiles
  return proServices.map(ps => {
    ps.profile.isExactMatch = ps.isExactMatch
    ps.profile.proService = ps
    ps.profile.matchingBucket = ps.matchingBucket
    ps.profile.expectedMeetRate = ps.rank
    ps.profile.meetRate = ps.meetRateLast3Months
    ps.profile.matchingAlgorithm = 'ideal-v1'
    ps.profile.userBucket = ps.userBucket

    // prevent circular reference in case we want to convert return result to
    // JSON
    const profile = ps.profile
    delete ps.profile

    return profile
  })
}

module.exports = convertMatchedProServicesToProfiles
