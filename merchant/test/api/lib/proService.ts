import test from 'ava'
import { ObjectId } from 'mongodb'
import { priceValuesEnabled } from '../../../src/api/lib/proService'
import runTestCases = require('../models/helpers/runTestCases')
import { filterPriceValuesWithJobRequirements, filterValidJobRequirements } from '../../../src/api/lib/proService'

const id1 = new ObjectId()
const id2 = new ObjectId()
const priceValuesEnabledTC = [{
  name: '[priceValuesEnabled] matchMoreEnabled: true; runtimeConfig: on',
  service: {
    matchMoreEditable: true,
    queries: [],
    _id: id1,
  },
  runtimeConfigs: [{
    name: 'price_values_enabled',
    services: [id1, id2],
  }],
  expect: true,
}, {
  name: '[priceValuesEnabled] matchMoreEnabled: true; runtimeConfig: off',
  service: {
    matchMoreEditable: true,
    queries: [],
    _id: id1,
  },
  runtimeConfigs: [],
  expect: true,
}, {
  name: '[priceValuesEnabled] matchMoreEnabled: false; runtimeConfig: on; query: base',
  service: {
    matchMoreEditable: false,
    queries: [{
      usedForPro: true,
      priceFactorType: 'base',
    }],
    _id: id1,
  },
  runtimeConfigs: [{
    name: 'price_values_enabled',
    services: [id1, id2],
  }],
  expect: true,
}, {
  name: '[priceValuesEnabled] matchMoreEnabled: false; runtimeConfig: off; query: addon',
  service: {
    matchMoreEditable: false,
    queries: [{
      usedForPro: true,
      priceFactorType: 'addon',
    }],
    _id: id1,
  },
  runtimeConfigs: [{
    name: 'price_values_enabled',
    services: [id2],
  }],
  expect: false,
}, {
  name: '[priceValuesEnabled] matchMoreEnabled: false; runtimeConfig: on; query: single',
  service: {
    matchMoreEditable: false,
    queries: [],
    singleBasePriceQuery: {},
    _id: id1,
  },
  runtimeConfigs: [{
    name: 'price_values_enabled',
    services: [id1, id2],
  }],
  expect: true,
}, {
  name: '[priceValuesEnabled] matchMoreEnabled: false; runtimeConfig: off; query: no',
  service: {
    matchMoreEditable: false,
    queries: [],
    _id: id1,
  },
  runtimeConfigs: [{
    name: 'price_values_enabled',
    services: [id2],
  }],
  expect: false,
}, {
  name: '[priceValuesEnabled] matchMoreEnabled: false; runtimeConfig: off; query: base',
  service: {
    matchMoreEditable: false,
    queries: [{
      usedForPro: true,
      priceFactorType: 'base',
    }],
    _id: id1,
  },
  runtimeConfigs: [{
    name: 'price_values_enabled',
    services: [id2],
  }],
  expect: false,
}]

const priceValuesEnabledRunner = (t, tc) => {
  t.is(priceValuesEnabled(tc.service, tc.runtimeConfigs), tc.expect)
}

runTestCases(test, priceValuesEnabledTC, priceValuesEnabledRunner)


const answer1 = new ObjectId()
const answer2 = new ObjectId()
const answer3 = new ObjectId()
const queryId = new ObjectId()

const pvTestCases = [{
  name: 'priceValues that their query\'s usedForPro isn\'t true aren\'t filtered out',
  jobRequirements: [],
  priceValues: [{
    answers: [answer2],
  }],
  queries: [{
    _id: queryId,
    usedForPro: false,
    priceFactorType: 'base',
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}],
  }],
  expect: [{
    answers: [answer2],
  }],
}, {
  name: 'priceValues that their option\'s usedForPro isn\'t true are filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1],
  }],
  priceValues: [{
    answers: [answer2],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    priceFactorType: 'base',
    options: [{usedForPro: true, _id: answer1}, {usedForPro: false, _id: answer2}],
  }],
  expect: [],
}, {
  name: 'priceValues that their option\'s usedForPro is true and not included in jobRequirements are filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1],
  }],
  priceValues: [{
    answers: [answer2],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    priceFactorType: 'base',
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}],
  }],
  expect: [],
}, {
  name: 'priceValues which are included in jobRequirements aren\'t filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1],
  }],
  priceValues: [{
    answers: [answer1],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    priceFactorType: 'base',
    options: [{usedForPro: true, _id: answer1}],
  }],
  expect: [{
    answers: [answer1],
  }],
}, {
  name: 'priceValues which aren\'t included in jobRequirements are filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1, answer2],
  }],
  priceValues: [{
    answers: [answer1, answer2],
  }, {
    answers: [answer1, answer3],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    priceFactorType: 'base',
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}, {usedForPro: true, _id: answer3}],
  }],
  expect: [{
    answers: [answer1, answer2],
  }],
}, {
  name: 'all priceValues aren\'t filtered out when no jobRequirements',
  jobRequirements: [],
  priceValues: [{
    answers: [answer1, answer2],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    priceFactorType: 'base',
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}],
  }],
  expect: [{
    answers: [answer1, answer2],
  }],
}]

const pvTest = (t, tc) => {
  t.deepEqual(filterPriceValuesWithJobRequirements(tc.priceValues, tc.jobRequirements, tc.queries), tc.expect)
}
runTestCases(test, pvTestCases, pvTest)

const jrTestCases = [{
  name: 'jobRequirements in not existing query are filtered out',
  jobRequirements: [{
    query: new ObjectId(),
    answers: [answer1],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}],
  }],
  expect: [],
}, {
  name: 'jobRequirements that usedForPro is not true are filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1],
  }],
  queries: [{
    _id: queryId,
    usedForPro: false,
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}],
  }],
  expect: [],
}, {
  name: 'jobRequirements that includes option with usedForPro are filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1, answer2],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    options: [{usedForPro: true, _id: answer1}, {usedForPro: false, _id: answer2}],
  }],
  expect: [],
}, {
  name: 'jobRequirements that all options are with usedForPro are not filtered out',
  jobRequirements: [{
    query: queryId,
    answers: [answer1, answer2],
  }],
  queries: [{
    _id: queryId,
    usedForPro: true,
    options: [{usedForPro: true, _id: answer1}, {usedForPro: true, _id: answer2}],
  }],
  expect: [{
    query: queryId,
    answers: [answer1, answer2],
  }],
}]

const jrTest = (t, tc) => {
  t.deepEqual(filterValidJobRequirements(tc.jobRequirements, tc.queries), tc.expect)
}
runTestCases(test, jrTestCases, jrTest)
