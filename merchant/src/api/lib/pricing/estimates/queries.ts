export {}
const math = require('mathjs')
const { timeRangeToHourDuration } = require('../../../lib/date')
const { Meet } = require('../../../models')

module.exports = {
  createQuestionMatchExpr,
  getPriceEstimate,
}

function createQuestionMatchExpr(questions) {
  const questionExpr = []
  let durationExpr = null

  questions
  .forEach(question => {
    if (question.type === 'singular') {
      const chosenAnswer = question.answers.find(answer => {
        return answer.checked
      })

      questionExpr.push({
        label: question.label || question.summary,
        answers: {
          $elemMatch: {
            text: chosenAnswer.text,
            checked: true,
          },
        },
      })
    } else if (question.type === 'multiple') {
      questionExpr.push({
        label: question.label || question.summary,
        answers: {
          $all: question.answers.map(answer => {
            return {
              $elemMatch: {
                text: answer.text,
                checked: answer.checked ? true : { $ne: true },
              },
            }
          }),
        },
      })
    } else if (question.type === 'calendar' && question.subType == 'duration' && question.answers[0].start && question.answers[0].end) {
      durationExpr = {
        $eq: timeRangeToHourDuration(
          question.answers[0].start,
          question.answers[0].end,
        ),
      }
    }
  })

  return {
    'request.description': {
      $elemMatch: {
        $and: questionExpr,
      },
    },
    'request.duration': durationExpr,
  }
}

async function getPriceEstimate({service, questions = []}) {
  const expr: any[] = [
    {
      $match: {
        priceType: 'fixed',
        price: {$gt: 0},
        service,
      },
    },
  ]

  if (questions.length) {
    expr.push(
      {
        $lookup: {
          from: 'requests',
          localField: 'request',
          foreignField: '_id',
          as: 'request',
        },
      },
      {
        $unwind: '$request',
      },
      {
        $match: createQuestionMatchExpr(questions),
      }
    )
  }

  expr.push(
    {
      $project: {
        price: 1,
      },
    },
    {
      $sort: {
        price: 1,
      },
    },
    {
      $group: {
        _id: null,
        prices: {$push: '$price'},
        count: {$sum: 1},
      },
    },
    {
      $match: {
        count: { $gte: 10 },
      },
    },
  )

  const results = await Meet.aggregate(expr)

  const prices = results[0] ? results[0].prices : []
  return calcRange(removeOutlier(prices))
}

// About Outlier and IQR: https://en.wikipedia.org/wiki/Interquartile_range#Outliers
function removeOutlier(prices) {
  if (prices.length === 0) return []

  const quarter1 = prices[Math.floor(prices.length / 4)]
  const quarter3 = prices[Math.ceil(prices.length * 3 / 4)]
  const iqr = quarter3 - quarter1
  const max = quarter3 + iqr * 1.5
  const min = quarter1 - iqr * 1.5
  return prices.filter(price => price <= max && price >= min)
}

function calcRange(prices) {
  if (prices.length === 0) return {}
  const center = Math.round(prices.length / 2)
  // avg of (median and upper two value)
  const median = (prices[center] + prices[center + 1] + prices[center + 2]) / 3
  const std = math.std(prices)
  const low = median - Math.min(std, median/2) * 0.7 // don't show low price
  const high = median + std

  return {
    average: Math.round(median / 100) * 100,
    high: Math.round(high / 100) * 100,
    low: Math.round(low / 100) * 100,
  }
}
