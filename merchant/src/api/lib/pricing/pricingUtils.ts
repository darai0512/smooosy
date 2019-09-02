export {}
const { payment, request } = require('@smooosy/config')

function getPriceResultForRequest(priceResults, request) {
  if (request.usePriceValueBudget) {
    return priceResults.find(pr => pr.name === 'instant')
  }

  return priceResults.find(pr => pr.isPrimary)
}

function priceResultsToMap(priceResults) {
  const priceResultsMap = {}

  priceResults.forEach(function eachPriceResult(priceResult) {
    priceResultsMap[priceResult.name] = priceResult
  })

  return priceResultsMap
}

function isHighPoint(point, price) {
  return point * payment.pricePerPoint.withTax / request.hiredRate >= price * request.pointThreshold
}

module.exports = {
  getPriceResultForRequest,
  priceResultsToMap,
  isHighPoint,
}
