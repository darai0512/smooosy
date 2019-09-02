import test from 'ava'
import evaluatePrices from '../../../../src/api/lib/pricing/evaluatePrices'
import {getPriceResultForRequest, isHighPoint} from '../../../../src/api/lib/pricing/pricingUtils'
import { PriceConfigMap } from '../../../../src/api/lib/pricing/requests/price_config'
import { standardRequest } from './requests/helpers/requests'

test('is high point or not', t => {
  //t.true(isHighPoint(10, 24299))
  //t.true(isHighPoint(10, 24300))
  t.false(isHighPoint(10, 24301))
})

test('evaluate prices', t => {
  const r = standardRequest()
  const priceResults = evaluatePrices(PriceConfigMap, r)

  t.not(priceResults.length, 0)

  const primaryPriceResult = getPriceResultForRequest(priceResults, r)
  t.true(primaryPriceResult.isPrimary)
  t.is(primaryPriceResult.value, 66)
  t.true(isHighPoint(primaryPriceResult.value, 40000)) // r.price.avg = undefined
})

test('instant pricing request', t => {
  const r = standardRequest()
  r.usePriceValueBudget = true
  r.priceValueResult = { total: 25000 }
  r.priceModels.push('instant')
  const priceResults = evaluatePrices(PriceConfigMap, r)

  t.not(priceResults.length, 0)

  const primaryPriceResult = getPriceResultForRequest(priceResults, r)

  t.true(primaryPriceResult.name === 'instant')
  t.is(primaryPriceResult.value, 100)
  t.true(isHighPoint(primaryPriceResult.value, 40000))
})
