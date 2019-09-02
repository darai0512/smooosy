import test from 'ava'
import {createRequestPriceV2} from '../../../../../src/api/lib/pricing/requests/v2_pricing'
import { standardRequest, lowPointRequest, repeatRequest } from './helpers/requests'

test('v2 pricing - standard request', t => {
  let request = standardRequest()
  const price = createRequestPriceV2(request)

  const result = price.evaluate()

  t.is(result.POINT_BASE, 50)
  t.is(result.BASE, 50)
  t.is(result.DESCRIPTION_BOOST, 10)
  t.is(result.PHONE_BOOST, 0.2)
  t.is(result.CORPORATE_BOOST, 0.35)
  t.is(result.MESSAGE_LENGTH_BOOST, 0.2)
  t.is(result.REQUEST_TIME_DECREASE, undefined)
  t.is(result.NEARBY_PROS_DECREASE, 0.8)
  t.is(result.BASE_VALUE_BASED_CAP, 1.35)
  t.is(result.FAR_IN_FUTURE_DECREASE, 0.79)
  t.is(result.TOTAL.toFixed(2), '66.36')
})

test('POINT_BASE being 0 makes the entire price 0', t => {
  let request = standardRequest()
  request.basePointValue = 0
  const price = createRequestPriceV2(request)
  const result = price.evaluate()

  t.is(result.POINT_BASE, 0)
  t.is(result.BASE, 0)
  t.is(result.TOTAL.toFixed(2), '0.00')
})

test('request having price query makes BASE 0, but not whole request', t => {
  let request = standardRequest()
  request.description[0].type = 'price'

  const price = createRequestPriceV2(request)

  const result = price.evaluate()

  t.is(result.POINT_BASE, 50)
  t.is(result.BASE, 0)
  t.is(result.TOTAL.toFixed(2), '9.80')
})

test('v2 pricing - no phone boost', t => {
  let request = standardRequest()
  request.phone = ''

  const price = createRequestPriceV2(request)
  const result = price.evaluate()

  t.is(result.PHONE_BOOST, 0)
  t.is(result.TOTAL.toFixed(2), '58.78')
})

test('v2 pricing - no corporate boost', t => {
  let request = standardRequest()
  request.corporation = false

  const price = createRequestPriceV2(request)
  const result = price.evaluate()

  t.is(result.CORPORATE_BOOST, 0)
  t.is(result.TOTAL.toFixed(2), '53.09')
})

test('isFreeRequest correctly sets price to 0', t => {
  let request = standardRequest()
  request.isFreeRequest = true

  const price = createRequestPriceV2(request)

  const result = price.evaluate()

  t.is(result.TOTAL.toFixed(2), '0.00')
})

test('request point base being low sets a cap on max multiplier', t => {
  const request = lowPointRequest()

  const price = createRequestPriceV2(request)

  const result = price.evaluate()

  t.is(result.PHONE_BOOST, 0.2)
  t.is(result.CORPORATE_BOOST, 0.35)
  t.is(result.MESSAGE_LENGTH_BOOST, 0.2)
  t.is(result.BASE_VALUE_BASED_CAP.toFixed(2), '0.84')
  t.is(result.TOTAL.toFixed(2), '4.42')
})

test('repeat request add POINT_MULTIPLIER_BOOST', t => {
  const request = repeatRequest()

  const price = createRequestPriceV2(request)

  const result = price.evaluate()

  t.is(result.POINT_MULTIPLIER_BOOST, 0.5)
})

test('service max point cost', t => {
  let request = standardRequest()
  request.maxPointCost = 40

  const price = createRequestPriceV2(request)

  const result = price.evaluate()

  t.is(result.TOTAL.toFixed(2), '40.00')
})

test('pricesToPoints set on query', t => {
  let request = standardRequest()
  request.description[0].usePriceToPoint = true
  request.description[0].priceToPoints = {
    mapping: [{
      price: 5000,
      points: 5,
    }, {
      price: 15000,
      points: 15,
    }],
    formula: {
      a: 9.102,
      b: 0.908,
      c: -72.528,
    },
  }
  request.description[0].answers[0].price = 5000
  request.description[0].answers[0].number = 2

  let price = createRequestPriceV2(request)
  let result = price.evaluate()

  // 5000 * 2 = 10000 => 11.31 because of mapping
  t.is(result.DESCRIPTION_BOOST.toFixed(2), '11.31')

  delete request.description[0].priceToPoints.formula

  price = createRequestPriceV2(request)
  result = price.evaluate()

  // formula created on the fly - should be about the same
  t.is(result.DESCRIPTION_BOOST.toFixed(2), '11.31')
})

// disable this adjustment
test.skip('v2 pricing - 100+ nearby pros', t => {
  let request = standardRequest()
  request.nearbyPros = 100

  const price = createRequestPriceV2(request)
  const result = price.evaluate()

  t.is(result.NEARBY_PROS_DECREASE, 1.1)
  t.is(result.TOTAL.toFixed(2), '91.25')
})