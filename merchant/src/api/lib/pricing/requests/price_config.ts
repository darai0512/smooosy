export {}
const {createRequestPriceV2} = require('./v2_pricing')
const {createRequestPriceInstant} = require('./instant_pricing')

const PriceConfigMap = {
  '2.0.2': {
    name: '2.0.2',
    formulaGenerator: createRequestPriceV2,
    isPrimary: true,
  },
  'instant': {
    name: 'instant',
    formulaGenerator: createRequestPriceInstant,
  },
}

const DEFAULT_PRICE_CONFIG = '2.0.2'

module.exports = { PriceConfigMap, DEFAULT_PRICE_CONFIG }