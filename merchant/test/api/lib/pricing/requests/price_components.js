import test from 'ava'
import math from 'mathjs'

import {
  rangeBasedMultiplier,
  continuousRangeMultiplier,
} from '../../../../../src/api/lib/pricing/requests/price_components'

function evaluate(expr) {
  let result = math.eval(expr)

  if (typeof(result) === 'object') {
    result = result.entries[0]
  }

  return result
}

test('range-based multiplier', t => {
  // standard
  t.is(evaluate(rangeBasedMultiplier(15, [
    { lowerBound: 0, upperBound: 10, value: 5 },
    { lowerBound: 10, upperBound: 20, value: 7 },
  ], 1)), 7)

  // no upper bound
  t.is(evaluate(rangeBasedMultiplier(15, [
    { lowerBound: 0, upperBound: 10, value: 5 },
    { lowerBound: 10, value: 7 },
  ], 1)), 7)

    // no lower bound
  t.is(evaluate(rangeBasedMultiplier(-10, [
    { upperBound: 10, value: 5 },
    { lowerBound: 10, upperBound: 20, value: 7 },
  ], 1)), 5)

  // doesn't match any bounds, returns default value
  t.is(evaluate(rangeBasedMultiplier(20, [
    { lowerBound: 5, upperBound: 10, value: 5 },
    { lowerBound: 10, upperBound: 20, value: 7 },
  ], -5)), -5)
})

test('continue range multiplier', t => {
  t.is(evaluate(continuousRangeMultiplier({
    value: 0, min: 0, max: 10, minMultiplier: 2, maxMultiplier: 4,
  })), 2)
  t.is(evaluate(continuousRangeMultiplier({
    value: 10, min: 0, max: 10, minMultiplier: 2, maxMultiplier: 4,
  })), 4)
  t.is(evaluate(continuousRangeMultiplier({
    value: 5, min: 0, max: 10, minMultiplier: 2, maxMultiplier: 4,
  })), 3)
})
