export {}
function evaluatePrices(priceConfigMap, priceContext) {
  const priceResults = priceContext.priceModels.map(priceModel => {
    const priceConfig = priceConfigMap[priceModel]
    const formula = priceConfig.formulaGenerator(priceContext)
    const priceComponents = formula.evaluate()
    const totalValue = Math.round(priceComponents.TOTAL)
    return {
      name: priceConfig.name,
      formula: formula,
      priceComponents: priceComponents,
      value: totalValue,
      isPrimary: !!priceConfig.isPrimary,
    }
  })

  const ppr = [], spr = []

  priceResults.forEach(priceResult => {
    (priceResult.isPrimary ? ppr : spr).push(priceResult)
  })

  spr.forEach(priceResult => {
    priceResult.primaryDiff = priceResult.value - ppr[0].value
  })

  return priceResults
}

module.exports = evaluatePrices