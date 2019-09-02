export {}
const moment = require('moment')
const Adjustment = require('../adjustment')
const { payment } = require('@smooosy/config')
const curveFitting = require('ml-levenberg-marquardt')

function pointBaseAdjustment(request) {
  return new Adjustment({
    name: 'POINT_BASE',
    formula: 'isFreeRequest ? 0 : basePointValue',
    variables: {
      basePointValue: request.basePointValue,
      isFreeRequest: !!request.isFreeRequest,
    },
  })
}

function baseAdjustment(request) {
  let hasPriceQuery = false
  for (const d of request.description) {
    hasPriceQuery = hasPriceQuery || d.type === 'price'
  }

  return new Adjustment({
    name: 'BASE',
    formula: 'hasPriceQuery ? 0 : POINT_BASE',
    variables: { hasPriceQuery },
  })
}

function descriptionAdjustment(request) {
  let addition = 0

  for (const d of request.description) {
    let p = 0
    const pointAnswers = d.answers ? d.answers.filter(a => a.point && a.checked) : []

    if (d.usePriceToPoint && d.priceToPoints) {
      const priceAnswers = d.answers ? d.answers.filter(a => a.price && (a.checked || a.number)) : []

      const priceTotal = priceAnswers.reduce((acc, answer) => {
        return acc + answer.price * (answer.number || 1)
      }, 0)

      p = mapPriceToPoints({
        price: priceTotal,
        pricesToPoints: d.priceToPoints,
      })
    } else if (pointAnswers.length > 0) {
      // 平均繰り上げ
      const pa = pointAnswers[Math.floor(pointAnswers.length / 2)]
      p = pa.point * (pa.number || 1)
    }

    addition += p
  }

  return new Adjustment({
    name: 'DESCRIPTION_BOOST',
    formula: addition.toString(),
  })
}

function phoneAdjustment(request, multiplier, defaultMultiplier) {
  return new Adjustment({
    name: 'PHONE_BOOST',
    formula: '(phone ? multiplier : defaultMultiplier)',
    variables: {
      phone: request.phone || false,
      multiplier: multiplier,
      defaultMultiplier: defaultMultiplier,
    },
  })
}

function corporateAdjustment(request, multiplier, defaultMultiplier) {
  return new Adjustment({
    name: 'CORPORATE_BOOST',
    formula: '(corporation ? multiplier : defaultMultiplier)',
    variables: {
      corporation: request.corporation || false,
      multiplier: multiplier,
      defaultMultiplier: defaultMultiplier,
    },
  })
}

function messageLengthAdjustment(request, ranges, defaultValue) {
  const messageLength = request.description.reduce((sum, d) => {
    const text = d.type === 'textarea' && d.answers[0] && d.answers[0].text ? d.answers[0].text : ''
    return sum + text.length
  }, 0)

  return new Adjustment({
    name: 'MESSAGE_LENGTH_BOOST',
    formula: rangeBasedMultiplier(messageLength, ranges, defaultValue),
  })
}

function pointMultiplierAdjustment(request) {
  const pointMultiplier = request.description.reduce((sum, d) => {
    const checked = d.answers.find(a => a.checked) || {}
    return sum + (checked.pointMultiplier || 0)
  }, 0)

  return new Adjustment({
    name: 'POINT_MULTIPLIER_BOOST',
    formula: pointMultiplier.toString(),
  })
}

function requestTimeAdjustment(request) {
  let multiplier = 1

  if (request.requestCount === 0) {
    multiplier = request.time < 60 ? 0.8 : request.time < 90 ? 0.9 : 1
  }

  return new Adjustment({
    name: 'REQUEST_TIME_DECREASE',
    formula: 'multiplier',
    variables: { multiplier },
  })
}

function nearbyProsAdjustment(request, ranges) {
  return new Adjustment({
    name: 'NEARBY_PROS_DECREASE',
    formula: typeof request.nearbyPros === 'number' ?
    rangeBasedMultiplier(request.nearbyPros, ranges, 1) : '1',
  })
}

function rangeBasedMultiplier(input, ranges, defaultValue) {
  const rangeStrings = ranges.map(range => {
    const lbExp = (typeof(range.lowerBound) === 'number') ?
      `${range.lowerBound} <= x` : ''
    const ubExp = (typeof(range.upperBound) === 'number') ?
      `x < ${range.upperBound}` : ''

    return `(${[lbExp, ubExp].filter(n => n).join(' and ')}) ? ${range.value}`
  })

  return `x = ${input}; ${rangeStrings.join(' : ')} : ${defaultValue}`
}

function farInFutureAdjustment(request) {
  let multiplier = 1

  // 90日以上未来の場合はポイントを減らす
  /*
    90～120日：×0.93
    120～150日：×0.86
    150～180日：×0.79
    180～210日：×0.72
    210～240日：×0.65
    240～270日：×0.58
    270～300日：×0.51
    300日以上：×0.44
  */
  if (request.limitDate) {
    const daysBefore = moment(request.limitDate).diff(request.createdAt, 'days')
    const futureFactor = Math.max(0.44, Math.min(1, 1 - Math.ceil((daysBefore - 90) / 30) * 0.07))
    multiplier = futureFactor
  }

  return new Adjustment({
    name: 'FAR_IN_FUTURE_DECREASE',
    formula: 'multiplier',
    variables: { multiplier },
  })
}

function continuousRangeMultiplier({ value, min, max, minMultiplier, maxMultiplier }) {
  return `(${maxMultiplier} - ${minMultiplier})*(min(${value}, ${max}) - ${min})/(${max} - ${min}) + ${minMultiplier}`
}

function baseValueBasedCapAdjustment({ min, max, minMultiplier, maxMultiplier, baseAdjustmentName }) {
  return new Adjustment({
    name: 'BASE_VALUE_BASED_CAP',
    formula: continuousRangeMultiplier({ value: `(${baseAdjustmentName})`, min, max, minMultiplier, maxMultiplier }),
  })
}

function maxPointCostAdjustment({ maxPointCost }) {
  return new Adjustment({
    name: 'MAX_POINT_COST',
    formula: 'maxPointCost',
    variables: { maxPointCost },
  })
}

function priceBasedCostAdjustment({ priceValue, pricesToPoints }) {
  if (!pricesToPoints || pricesToPoints.length < 2) {
    return new Adjustment({
      name: 'PRICE_BASED_COST',
      formula: 'priceValue / priceToPoints',
      variables: { priceValue, priceToPoints: payment.pricePerPoint.withTax },
    })
  }

  return new Adjustment({
    name: 'PRICE_BASED_COST',
    formula: 'pointCost',
    variables: {
      pointCost: mapPriceToPoints({ price: priceValue, pricesToPoints: {
        mapping: pricesToPoints,
      } }),
    },
  })
}

function mapPriceToPoints({ price, pricesToPoints }) {
  const mapping = pricesToPoints.mapping

  let pointCost
  let { a, b, c }: any = pricesToPoints.formula || {}

  if (a && b && c) {
    a = pricesToPoints.formula.a
    b = pricesToPoints.formula.b
    c = pricesToPoints.formula.c
  } else {
    const data = {
      x: mapping.map(m => m.price),
      y: mapping.map(m => m.points),
    }

    const options = {
      damping: 10e-7,
      initialValues: [1, 1, 1],
      maxIterations: 1000,
    }

    const { parameterValues } = curveFitting(
      data,
      ([a, b, c]) => (x) => a * Math.log(b + x) + c,
      options
    )

    a = parameterValues[0]
    b = parameterValues[1]
    c = parameterValues[2]
  }

  const lower = mapping[0],
    upper = mapping[mapping.length - 1]

  if (price <= lower.price) {
    pointCost = lower.points
  } else if (price >= upper.price) {
    pointCost = upper.points
  } else {
    pointCost = a * Math.log(price + b) + c
  }

  return pointCost
}

module.exports = {
  pointBaseAdjustment,
  baseAdjustment,
  descriptionAdjustment,
  phoneAdjustment,
  corporateAdjustment,
  messageLengthAdjustment,
  pointMultiplierAdjustment,
  requestTimeAdjustment,
  nearbyProsAdjustment,
  farInFutureAdjustment,
  rangeBasedMultiplier,
  continuousRangeMultiplier,
  baseValueBasedCapAdjustment,
  maxPointCostAdjustment,
  priceBasedCostAdjustment,
}
