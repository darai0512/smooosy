import test from 'ava'
import {createRequestPriceInstant} from '../../../../../src/api/lib/pricing/requests/instant_pricing'
import { standardRequest } from './helpers/requests'

test('instant pricing - standard request', t => {
  let request = standardRequest()
  request.priceValueResult = { total: 1750 }
  request.pricesToPoints = [{
    price: 1500,
    points: 5,
  }, {
    price: 5000,
    points: 7,
  }, {
    price: 20000,
    points: 10,
  }]

  const price = createRequestPriceInstant(request)
  const result = price.evaluate()

  t.is(result.PRICE_BASED_COST.toFixed(2), '5.21')
  t.is(result.DESCRIPTION_BOOST, 10)
  t.is(result.PHONE_BOOST, 0.2)
  t.is(result.CORPORATE_BOOST, 0.35)
  t.is(result.MESSAGE_LENGTH_BOOST, 0.2)
  t.is(result.REQUEST_TIME_DECREASE, undefined)
  t.is(result.NEARBY_PROS_DECREASE, 0.8)
  t.is(result.BASE_VALUE_BASED_CAP, 1.35)
  t.is(result.FAR_IN_FUTURE_DECREASE, 0.79)
  t.is(result.TOTAL.toFixed(2), '16.82')

  request.priceValueResult.total = 1200
  const belowLowerBoundRes = createRequestPriceInstant(request).evaluate()
  t.is(belowLowerBoundRes.PRICE_BASED_COST, 5)

  request.priceValueResult.total = 25000
  const aboveUpperBoundRes = createRequestPriceInstant(request).evaluate()
  t.is(aboveUpperBoundRes.PRICE_BASED_COST, 10)
})
