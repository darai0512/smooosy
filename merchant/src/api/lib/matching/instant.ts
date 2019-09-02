import { Moment } from 'moment'
import * as moment from 'moment'
import * as stringify from 'json-stringify-pretty-compact'

import { ProService } from '../../models'
const { compObjRefs, arrayIntersection } = require('../util')
const { mongoIdToShortId } = require('../mongoid')
const { getOnlyProQuestions } = require('./common')

const DEFAULT_MATCH_LIMIT = 30
const DEFAULT_DISTANCE = 50000

import { lib, models } from '../../interfaces'

export const findMatchingProServicesForQuery = async <
  T extends lib.matching.instant.AFindMatchingProServicesForQuery
>({
  service,
  location,
  description,
  excludeProfiles,
  matchLimit = DEFAULT_MATCH_LIMIT,
  debug = false,
}: T): Promise<lib.matching.instant.RFindMatchingProServicesForQuery[]> => {
  const maxDistance = service.distance || DEFAULT_DISTANCE

  // Flow:
  // [TODO] schedule
  // [TODO] compute pricing for job (do in another method?)
  const pipeline = [
    // nearby pros
    ...nearbyPipeline({
      location,
      service,
      excludeProfiles,
      canWorkRemotely: false,
      maxDistance,
    }),
    // join pro service to get each pro's match constraints
    ...joinProfilesPipeline(),
    {
      $match: {
        'profile.hideProfile': { $ne: true }, // 非表示プロは検索結果に出さない
        'profile.description': { $exists: true }, // 説明文がない
        'profile.suspend': {$exists: false},  // 運営がBAN
        'profile.deactivate': {$ne: true},    // プロが退会
        'user.isInArrears': {$ne: true},      // user payment didn't fail
      },
    },
    ...joinMediaPipeline(),
    // exclude unused fields
    {
      $project: {
        _id: true,
        service: true,
        jobRequirements: true,
        address: true,
        way: true,
        distance: true,
        budget: true,
        priceValues: true,
        setupLocation: true,
        setupJobRequirements: true,
        setupPriceValues: true,
        setupBudget: true,
        isPromoted: true,
        chargesTravelFee: true,
        media: true,
        description: true,
        'user._id': true,
        'user.lastname': true,
        'user.imageUpdatedAt': true,
        'user.schedule': true,
        'user.lastAccessedAt': true,
        'user.isMatchMore': true,
        'user.isInArrears': true,
        'user.hasActiveCard': true,
        'profile._id': true,
        'profile.name': true,
        'profile.address': true,
        'profile.description': true,
        'profile.media': true,
        'profile.reviewCount': true,
        'profile.averageRating': true,
        'profile.experience': true,
      },
    },
    ...jobRequirementsMatchPipeline(description),
  ]

  if (debug) {
    // run pipeline at each step and show results
    for (let i = 0; i < pipeline.length; ++i) {
      const subPipeline = pipeline.slice(0, i + 1)
      const last = subPipeline[subPipeline.length - 1]
      console.log('pipeline step:', stringify(last))
      const result = await ProService.aggregate(subPipeline)
      console.log(`pipeline result: ${stringify(result)}\n`)

      if (!result.length) {
        console.log('pipeline empty at current sub-step, stopping further execution')
        break
      }
    }
  }

  let proServices: lib.matching.instant.RFindMatchingProServicesForQuery[] = await ProService.aggregate(pipeline)

  // determine whether pro service matches user's job requirements
  // filtered out:
  // user answer and pro answer don't match
  // ranks:
  //    pro filled in job reqs, set price, promoted -         #1
  //    pro filled in job reqs, no price, promoted -          #2
  //    pro filled in job reqs, set price, not promoted -     #3
  //    pro filled in job reqs, no price, not promoted -      #4
  //    pro didn't fill in job reqs, no price, not promoted - #5
  proServices = proServices.sort((a, b) => {
    return calculateScore(b, maxDistance) - calculateScore(a, maxDistance)
  })
  proServices = proServices.map(ps => {
    ps.profile.shortId = mongoIdToShortId(ps.profile._id)
    return ps
  })

  return proServices.slice(0, matchLimit)
}

const calculateScore = <
  T extends lib.matching.instant.ACalculateScore
>(proService: T, maxDistance: number) => {
  let score = 0

  if (proService.isPromoted && proService.user.hasActiveCard) {
    score += 10000
  }

  if (proService.priceValues && proService.priceValues.length > 0) {
    score += 1000
  }

  if (proService.jobRequirements && proService.jobRequirements.length > 0) {
    score += 100
  }

  score -= (500 * proService.way / maxDistance)

  return score
}

export const joinProfilesPipeline = ({ onlyProfiles = false } = {}) => {
  if (onlyProfiles) {
    return [
      // look up and add `profiles` to root object
      {
        $lookup: {
          from: 'profiles',
          foreignField: '_id',
          localField: 'profile',
          as: 'profiles',
        },
      },
      {
        $addFields: { profile: { $arrayElemAt: [ '$profiles', 0 ] } },
      },
      {
        $project: { profiles: 0 },
      },
    ]
  }

  return [
    // look up and add `profiles` to root object
    {
      $lookup: {
        from: 'profiles',
        foreignField: '_id',
        localField: 'profile',
        as: 'profiles',
      },
    },
    {
      $addFields: { profile: { $arrayElemAt: [ '$profiles', 0 ] } },
    },
    {
      $project: { profiles: 0 },
    },
    {
      $lookup: {
        from: 'media',
        foreignField: '_id',
        localField: 'profile.media',
        as: 'profile.media',
      },
    },
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
  ]
}

const joinMediaPipeline = () => {
  return [
    {
      $lookup: {
        from: 'media',
        foreignField: '_id',
        localField: 'media',
        as: 'media',
      },
    },
  ]
}

const nearbyPipeline = ({
  location,
  canWorkRemotely,
  service,
  excludeProfiles,
  maxDistance,
}: lib.matching.instant.ANearbyPipeline) => {
  const pipeline = []

  // requestに地点がある場合近い順に並べる
  const $geoNear: any = {
    spherical: true,
    near: location,
    distanceField: 'way',
    limit: 1000000, // サービスの登録プロ数がこれを超えたら危険
    query: {
      service: service._id,
      disabled: { $ne: true },
    },
  }
  if (excludeProfiles && excludeProfiles.length) {
    $geoNear.query.profile = { $nin: excludeProfiles }
  }
  pipeline.push({$geoNear})

  if (!canWorkRemotely) {
    // マッチ距離のクエリ
    // (プロの設定 || request.distance || 50km) x 1.2
    const distanceQuery = {
      $multiply: [
        {$ifNull: ['$distance', maxDistance] }, 1.2,
      ],
    }

    // マッチ距離よりも距離が短いように絞り込む
    pipeline.push(
      {$addFields: {
        diff: { $subtract: [ distanceQuery, '$way' ] },
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

  return pipeline
}

const jobRequirementsMatchPipeline = (description = []) => {
  // We only want to use questions
  // that are used for pro matching
  description = getOnlyProQuestions(description)

  if (!description.length) {
    return []
  }

  return [
    {
      $match: {
        $or: [
          // either the pro has to have all of the user's chosen options
          // as something they're willing to do
          { $and: description.map(q => ({
            jobRequirements: {
              $elemMatch: {
                query: q._id,
                answers: { $all: q.answers.map(a => a._id) },
              },
            },
          })),
          },
          // or the pro has not filled out job requirements at all,
          // in which case we still match them
          // TODO: make this match indicate that the pro is not instantly
          // bookable
          {
            jobRequirements: [],
          },
        ],
      },
    },
  ]
}


// isExactMatch
//
// compare those answers to the given pro service to see if they
// match the pro service's job requirements
//
// injectDescriptionIntoQueries should be called before
//
export const isExactMatch = <
  T extends lib.matching.instant.Query,
  P extends {jobRequirements: models.ProService.JobRequirement[]}
>(queries: T[], proService: P, debug = false) => {
  if (debug) {
    console.log('injected queries:', JSON.stringify(queries, null, '\t'))
    console.log('jrs:', JSON.stringify(proService.jobRequirements, null, '\t'))
  }

  return queries.every(q => {
    if (!q.usedForPro) return true
    if (!['singular', 'multiple', 'number'].includes(q.type)) return true

    const checked = q.options.filter(o => o.usedForPro && o.checked)
    if (checked.length === 0) return true

    return proService.jobRequirements.find(jr => {
      if (debug) {
        console.log('job req:', JSON.stringify(jr, null, '\t'))
        console.log('checked:', JSON.stringify(checked, null, '\t'))
        console.log('id check:', compObjRefs(jr.query, q._id))
        console.log('answer check:', arrayIntersection(jr.answers, checked, compObjRefs).length === checked.length)
      }

      return compObjRefs(jr.query, q._id) &&
      arrayIntersection(jr.answers, checked, compObjRefs).length === checked.length
    })
  })
}

/*
 * return true if two time ranges intersect
 */
const timeIntersect = ([start1, end1]: [Moment, Moment], [start2, end2]: [Moment, Moment]) => {
  const notIntersect = start1.isAfter(end2) || start2.isSameOrAfter(end1)
  return !notIntersect
}

export const scheduleConflictReason = <T extends {
  user: {
    schedule: {
      dayOff: [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
    },
  },
  schedules: {
    recurrence?: 'week' | 'month',
    startTime: string,
    endTime: string,
  }[],
  description: {
    type: string,
    answers?: [{
      date: string,
      start: string,
    }],
  }[],
}>({ user, schedules, description }: T) => {
  const calendar = description.find(d => {
    return d.type === 'calendar' && d.answers && d.answers.length > 0
  })

  if (!calendar) return null

  const { date, start } = calendar.answers[0]

  // 日にちのみ指定した場合
  if (!start) {
    if (user.schedule.dayOff[moment(date).day()]) return '営業時間外'

    const hasBooking = schedules.find(s => !s.recurrence && moment(s.startTime).isSame(date, 'day'))
    if (hasBooking) return '予定あり'

    return null
  }

  // - this is dressing up only code right now
  // - the start time field is treated as the end time
  // - しょがない
  const endMoment = moment(`${moment(date).format('YYYY-MM-DD')} ${start}`, 'YYYY-MM-DD HH:mm')
  const startMoment = endMoment.clone().subtract(2, 'hours')

  const range: [Moment, Moment] = [startMoment, endMoment]

  let reason = null
  for (const s of schedules) {
    // 繰り返しの予定
    if (s.recurrence) {
      // rangeと同じ週を探す
      const weekDiff = endMoment.diff(s.startTime, s.recurrence)
      const scheduleRange: [Moment, Moment] = [
        moment(s.startTime).clone().add(weekDiff, s.recurrence),
        moment(s.endTime).clone().add(weekDiff, s.recurrence),
      ]
      if (timeIntersect(range, scheduleRange)) return '営業時間外'
    }

    // 繰り返しでない予定
    const scheduleRange: [Moment, Moment] = [moment(s.startTime), moment(s.endTime)]
    if (timeIntersect(range, scheduleRange)) {
      reason = '予定あり'
    }
  }

  return reason
}

// setupBusinessHour is a virtual of User model.
// You have to select 'schedule' of user
export const isMatchMoreProService = <
  T extends lib.matching.instant.AIsMatchMoreProService
>({proService, user}: T) => {
  return user.setupBusinessHour
    && proService.setupLocation
    && proService.setupJobRequirements
}

export default {
  findMatchingProServicesForQuery,
  isExactMatch,
  scheduleConflictReason,
  joinProfilesPipeline,
  isMatchMoreProService,
}