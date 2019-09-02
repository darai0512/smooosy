const moment = require('moment')
const { Request } = require('../../../../../../src/api/models')
import { DEFAULT_PRICE_CONFIG } from '../../../../../../src/api/lib/pricing/requests/price_config'

function standardRequest() {
  const r = new Request({
    description: [{
      type: 'textarea',
      answers: [{
        checked: true,
        point: 10,
        text: 'blah blah blah blah',
      }],
    }],
    phone: true,
    corporation: true,

    time: 70,
    nearbyPros: 9,
    limitDate: moment().add(180, 'days'),
    createdAt: moment(),
  })

  r.basePointValue = 50
  r.corporation = true
  r.requestCount = 0
  r.priceModels = [DEFAULT_PRICE_CONFIG]

  return r
}

function lowPointRequest() {
  const r = new Request({
    description: [{
      type: 'textarea',
      answers: [{
        checked: true,
        point: 2,
        text: 'blah blah blah blah',
      }],
    }],
    phone: true,
    corporation: true,
    requestCount: 0,
    time: 70,
    nearbyPros: 9,
    limitDate: moment().add(180, 'days'),
    createdAt: moment(),
  })

  r.basePointValue = 2
  r.corporation = true
  r.requestCount = 0
  r.priceModels = [DEFAULT_PRICE_CONFIG]

  return r
}

function repeatRequest() {
  const r = new Request({
    basePointValue: 2,
    description: [
      {
        type: 'textarea',
        answers: [{
          checked: true,
          point: 2,
          text: 'blah blah blah blah',
          pointMultiplier: 0.5,
        }],
      },
      {
        type: 'textarea',
        answers: [{
          checked: true,
          text: 'blah blah blah blah',
        }],
      },
    ],
    phone: true,
    corporation: true,
    time: 70,
    nearbyPros: 9,
    limitDate: moment().add(180, 'days'),
    createdAt: moment(),
  })

  r.basePointValue = 2
  r.corporation = true
  r.requestCount = 0
  r.priceModels = [DEFAULT_PRICE_CONFIG]

  return r
}

module.exports = {
  standardRequest, lowPointRequest, repeatRequest,
}
