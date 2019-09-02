const test = require('ava')

const { getDistance } = require('../../../src/api/lib/geospatial')
const { locations } = require('../helpers/testutil')

test('getDistance', t => {
  const distance = getDistance(locations.tokyo, locations.sapporo)
  t.is(Math.round(distance * 1000), 833835)
})
