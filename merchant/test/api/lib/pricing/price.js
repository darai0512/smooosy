import test from 'ava'
import Price from '../../../../src/api/lib/pricing/price'
import Adjustment from '../../../../src/api/lib/pricing/adjustment'

test('Price correctly evaluates adjustments', t => {
  let price = new Price()

  // Base price is 500 points.
  price.addAdjustment(new Adjustment({
    name: 'BASE_PRICE',
    formula: '500',
  }))

  // 5% tax on points.
  price.addAdjustment(new Adjustment({
    name: 'TAX',
    formula: 'BASE_PRICE * 0.05',
  }))

  // 100-point discount applied.
  price.addAdjustment(new Adjustment({
    name: 'DISCOUNT',
    formula: '-100',
  }))

  // Total represents the total value for a point transaction.
  price.addAdjustment(new Adjustment({
    name: 'TOTAL',
    formula: 'BASE_PRICE + TAX + DISCOUNT',
  }))

  const adjustmentValues = price.evaluate()

  t.is(500, adjustmentValues.BASE_PRICE)
  t.is(25.00, adjustmentValues.TAX)
  t.is(-100.00, adjustmentValues.DISCOUNT)
  t.is(425.00, adjustmentValues.TOTAL)
})


