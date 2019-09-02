export {}
const moment = require('moment')

const matchWeights = {
  heavyUser: {
    exactMatch: {
      is: 1.17,
      isNot: 0.94,
    },
    distance: [
      { lower: 0, upper: 2000, lowerValue: 1.24, upperValue: 1.21 },
      { lower: 2000, upper: 5000, lowerValue: 1.21, upperValue: 1.06 },
      { lower: 5000, upper: 20000, lowerValue: 1.06, upperValue: 1.03 },
      { lower: 20000, upper: 35000, lowerValue: 1.03, upperValue: 0.76 },
      { isDefault: true, value: 0.76 },
    ],
  },
  lightUser: {
    exactMatch: {
      is: 2.20,
      isNot: 0.86,
    },
    distance: [
      { lower: 0, upper: 2000, lowerValue: 1.55, upperValue: 1.37 },
      { lower: 2000, upper: 5000, lowerValue: 1.37, upperValue: 1.16 },
      { lower: 5000, upper: 20000, lowerValue: 1.16, upperValue: 1.09 },
      { lower: 20000, upper: 35000, lowerValue: 1.09, upperValue: 0.66 },
      { isDefault: true, value: 0.66 },
    ],
  },
}

function makeMatchBuckets() {
  return [
    {
      name: 'ideal',
      matchWeights,
      limit: 120,
    },
    {
      name: 'oneMonth',
      matchWeights,
      isNewPro: true,
      userFilters: { 'user.createdAt':
        { $gte: moment().subtract(1, 'month').toDate() },
      },
      limit: 30,
    },
    {
      name: 'twoMonth',
      matchWeights,
      isNewPro: true,
      userFilters: { $and: [
        { 'user.createdAt': { $gte: moment().subtract(2, 'month').toDate() } },
        { 'user.createdAt': { $lt: moment().subtract(1, 'month').toDate() } },
      ] },
      limit: 20,
    },
    {
      name: 'threeMonth',
      matchWeights,
      isNewPro: true,
      userFilters: { $and: [
        { 'user.createdAt': { $gte: moment().subtract(3, 'month').toDate() } },
        { 'user.createdAt': { $lt: moment().subtract(2, 'month').toDate() } },
      ] },
      limit: 10,
    },
  ]
}

module.exports = {
  makeMatchBuckets,
  matchWeights,
}