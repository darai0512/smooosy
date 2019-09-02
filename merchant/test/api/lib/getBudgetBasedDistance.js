const test = require('ava')
const getBudgetBasedDistance = require('../../../src/api/lib/getBudgetBasedDistance')

test('getBudgetBasedDistance function', t => {
  const budgets = [
    {
      name: 'below min budget',
      budget: 500,
      expectedDistance: 5000,
    },
    {
      name: 'min budget',
      budget: 1000,
      expectedDistance: 5000,
    },
    {
      name: 'above min budget',
      budget: 2000,
      expectedDistance: 5500,
    },
  ]

  const defaultDistance = 5000

  for (const b of budgets) {
    t.is(getBudgetBasedDistance(
      b.budget,
      defaultDistance,
      {
        minBudget: 1000,
        multiplier: 0.5, // add 500m for every 1000 yen
      },
    ), b.expectedDistance)
  }
})
