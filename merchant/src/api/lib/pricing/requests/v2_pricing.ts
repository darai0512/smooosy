export {}
const Price = require('../price')
const PriceComponents = require('./price_components')
const Adjustment = require('../adjustment')

function createRequestPriceV2(request) {
  const price = new Price()

  price.addAdjustment(PriceComponents.pointBaseAdjustment(request))
  price.addAdjustment(PriceComponents.baseAdjustment(request))
  price.addAdjustment(PriceComponents.descriptionAdjustment(request))
  price.addAdjustment(PriceComponents.phoneAdjustment(request, 0.2, 0))
  price.addAdjustment(PriceComponents.corporateAdjustment(request, 0.35, 0))
  price.addAdjustment(PriceComponents.messageLengthAdjustment(request, [
    { lowerBound: 0, upperBound: 1, value: 0 },
    { lowerBound: 1, upperBound: 10, value: 0.1 },
    { lowerBound: 10, upperBound: 30, value: 0.2 },
    { lowerBound: 30, upperBound: 50, value: 0.3 },
    { lowerBound: 50, value: 0.4 },
  ], 0))
  price.addAdjustment(PriceComponents.pointMultiplierAdjustment(request))
  price.addAdjustment(PriceComponents.baseValueBasedCapAdjustment({
    min: 1,
    max: 15,
    minMultiplier: 0.7,
    maxMultiplier: 1.35,
    baseAdjustmentName: 'BASE + DESCRIPTION_BOOST',
  }))
  price.addAdjustment(PriceComponents.nearbyProsAdjustment(request, [
    { lowerBound: 0, upperBound: 5, value: 0.7 },
    { lowerBound: 5, upperBound: 10, value: 0.8 },
    { lowerBound: 10, upperBound: 15, value: 0.9 },
    { lowerBound: 15, upperBound: 100, value: 1 },
    { lowerBound: 100, value: 1 },
  ], 1))
  price.addAdjustment(PriceComponents.farInFutureAdjustment(request))
  price.addAdjustment(PriceComponents.maxPointCostAdjustment({
    maxPointCost: typeof(request.maxPointCost) === 'number' ? request.maxPointCost : 100,
  }))
  price.addAdjustment(totalAdjustment())

  return price
}

function totalAdjustment() {
  return new Adjustment({
    name: 'TOTAL',
    formula:
      `POINT_BASE == 0 ? 0 : min(
        (BASE + DESCRIPTION_BOOST) * (1 + min(PHONE_BOOST +
          CORPORATE_BOOST + MESSAGE_LENGTH_BOOST + POINT_MULTIPLIER_BOOST, BASE_VALUE_BASED_CAP)) *
          NEARBY_PROS_DECREASE * FAR_IN_FUTURE_DECREASE,
        MAX_POINT_COST)`,
  })
}

module.exports = {createRequestPriceV2}