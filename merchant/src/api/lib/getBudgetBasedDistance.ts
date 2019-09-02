export {}
function getBudgetBasedDistance(budget, distance, formula) {
  return distance + formula.multiplier * Math.max(0, budget - formula.minBudget)
}

module.exports = getBudgetBasedDistance