import moment from 'moment'
import { combineOptions } from 'components/PriceValuesSetting'

/*
 * return true if two time ranges intersect
 */
function timeIntersect([start1, end1], [start2, end2]) {
  const notIntersect = start1.isAfter(end2) || start2.isSameOrAfter(end1)
  return !notIntersect
}


export function scheduleConflictReason({ user, schedules, date, start }) {
  if (!date) return null

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

  const range = [startMoment, endMoment]

  let reason = null
  for (let s of schedules) {
    // 繰り返しの予定
    if (s.recurrence) {
      // rangeと同じ週を探す
      const weekDiff = endMoment.diff(s.startTime, s.recurrence)
      const scheduleRange = [
        moment(s.startTime).clone().add(weekDiff, s.recurrence),
        moment(s.endTime).clone().add(weekDiff, s.recurrence),
      ]
      if (timeIntersect(range, scheduleRange)) return '営業時間外'
    }

    // 繰り返しでない予定
    const scheduleRange = [moment(s.startTime), moment(s.endTime)]
    if (timeIntersect(range, scheduleRange)) {
      reason = '予定あり'
    }
  }

  return reason
}

export function parsePriceValues(values) {
  const priceValues = []
  for (let [type, object] of Object.entries(values)) {
    for (let [answers, value] of Object.entries(object)) {
      if (type === 'travelFee') {
        priceValues.push({
          type,
          requestConditions: [{
            key: 'distance',
            rangeValue: {lowerBound: value.minDistance},
            type: 'range',
          }],
          value: value.price,
        })
      } else {
        priceValues.push({
          type,
          answers: type === 'singleBase' ? [] : answers.split('+'),
          value: value || 0,
        })
      }
    }
  }

  return priceValues
}

export function initializePriceValues(priceValues, chargesTravelFee) {
    /*
     * initialValues for priceValues look like
     *
     * {
     *   "base": {
     *     "optionId1+optionId2": 1000,  // optionIds are sorted
     *     "optionId1+optionId3": 1000,
     *     "optionId2+optionId3": 1000,
     *   },
     *   "addon": {
     *     "optionId4": 1000,
     *     "optionId5": 1000,
     *   },
     *   "travelFee": [
     *     { minDistance: 2500, price: 500 },
     *     { minDistance: 10000, price: 1500 },
     *   ]
     * }
     *
     */
  const initialValues = {}

  for (let price of priceValues) {
    if (price.type === 'travelFee') {
      initialValues[price.type] = initialValues[price.type] || []
      const distanceCondition = price.requestConditions.find(
          c => c.key === 'distance'
        )
      initialValues[price.type].push({
        minDistance: distanceCondition.rangeValue.lowerBound,
        price: price.value,
      })
    } else if (price.type === 'singleBase') {
      initialValues.singleBase = {singleBase: price.value}
    } else {
      initialValues[price.type] = initialValues[price.type] || {}
      const key = price.answers.sort().join('+')
      initialValues[price.type][key] = price.value
    }

    initialValues.chargesTravelFee = chargesTravelFee
  }

    // Include a placeholder empty travel fee so that the
    // travel fee form shows an empty element that can then be populated
    // with real data.
  if (!initialValues.travelFee) {
    initialValues.travelFee = [{}]
  } else {
    initialValues.travelFee = initialValues.travelFee.sort((a, b) => {
      return a.minDistance - b.minDistance
    })
  }

  return initialValues
}

export function validateTravelFee(travelFee) {
  const errors = []
  for (const i in travelFee) {
    const tf = travelFee[i]
    errors[i] = {}
    if (!tf.price) {
      errors[i].price = '1以上の数字を入力してください'
    }
    if (!tf.minDistance) {
      errors[i].minDistance = '1以上の数字を入力してください'
    }
  }
  return errors
}

export function checkFilledBaseQuery(values = {}, proService) {
  const baseQueries = []

  // pick up baseQueries
  for (let query of proService.service.queries) {
    const jr = proService.jobRequirements.find(jr => jr.query.id === query.id)
    const queryWithAnswers = { ...query }
    if (jr) queryWithAnswers.options = jr.answers
    if (queryWithAnswers.options.length === 0) continue
    if (query.priceFactorType === 'base') {
      baseQueries.push(queryWithAnswers)
    }
  }

  let names = []

  // generate combinations
  if (baseQueries.length === 1) {
    let options = baseQueries[0].options.filter(o => o.usedForPro)
    if (baseQueries[0].type === 'multiple') {
      options = combineOptions(options)
    }
    names = options.map(o => {
      const ids = o.ids || [o.id]
      return ids.sort().join('+')
    })
  } else if (baseQueries.length === 2) {
    let options = baseQueries[1].options.filter(o => o.usedForPro)
    if (baseQueries[1].type === 'multiple') {
      options = combineOptions(options)
    }
    names = [].concat(...baseQueries[0].options.map(v => options.map(o => {
      const ids = o.ids || [o.id]
      return [v.id, ...ids].sort().join('+')
    })))
  }

  // check that all field is filled
  const ids = Object.keys(values)
  const warns = []
  for (const n of names) {
    if (!ids.includes(n)) {
      warns.push(n)
    }
    for (const i of ids) {
      if (typeof values[i] !== 'number' && !values[i]) {
        warns.push(i)
      }
    }
  }

  return warns
}

export const getQueries = ({jobRequirements, service}) => {
  const baseQueries = []
  const discountQueries = []
  const addonQueries = []
  let hideTravelFee = false
  for (let query of service.queries) {
    const jr = jobRequirements.find(jr => jr.query.id === query.id)
    const queryWithAnswers = { ...query }
    if (jr) queryWithAnswers.options = jr.answers
    if (queryWithAnswers.options.length === 0) continue

    switch (query.priceFactorType) {
      case 'base':
        baseQueries.push(queryWithAnswers)
        break
      case 'discount':
        discountQueries.push(queryWithAnswers)
        break
      case 'addon':
        addonQueries.push(queryWithAnswers)
        break
    }

    if (!hideTravelFee) {
      hideTravelFee = queryWithAnswers.options.every(o => o.removeTravelFee)
    }
  }

  return {
    // If there are two base, singular type should come first.
    baseQueries: baseQueries.sort((a, b) => {
      if (a.type === 'singular' && b.type !== 'singular') return -1
      if (a.type !== 'singular' && b.type === 'singular') return 1
      return 0
    }),
    discountQueries,
    addonQueries,
    hideTravelFee,
    // queryのフォーマットに合わせる
    singleBasePriceQuery: service.singleBasePriceQuery ? {
      proText: service.singleBasePriceQuery.title,
      proPriceHelperText: service.singleBasePriceQuery.helperText,
      estimatePriceType: service.estimatePriceType || 'fixed',
      options: [{usedForPro: true, text: service.singleBasePriceQuery.label}],
    } : null,
  }
}

export const getEstimateAcquisition = ({service, budget}) => {
  budget = Number(budget)
  if (!service.manualAveragePoint && !service.averagePoint) {
    return null
  }

  const estimateAcquisition = {}
  const averagePoint = service.manualAveragePoint || service.averagePoint
  // 推定案件獲得数 = 設定ポイント / 平均ポイント数
  estimateAcquisition.max = Math.floor(budget / averagePoint)
  // 下限は平均ポイントの2倍で割る
  estimateAcquisition.min = Math.floor(budget / (2 * averagePoint))
  return estimateAcquisition
}

export const logDataFromPS = (proService) => {
  if (!proService) return null
  return {
    price: proService.price && proService.price.total,
    rating: proService.profile.averageRating,
    reviewCount: proService.profile.reviewCount,
    mediaLength: proService.media.length,
    descriptionLength: (proService.description || proService.profile.description || '').length,
    _id: proService._id,
  }
}

export const getRegularHoliday = (user) => {
  if (!user || !user.schedule || !user.schedule.dayOff) return null
  return ['日', '月', '火', '水', '木', '金', '土'].filter((_, idx) => user.schedule.dayOff[idx])
}

export const showPriceValues = (proService, isSetup = false) => {
  return proService.service.matchMoreEditable || (!isSetup && proService.priceValuesEnabled)
}
