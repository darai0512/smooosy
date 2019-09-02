const test = require('ava')
const index = require('../../../src/api/models/index')

test('importing index', t => {
  t.true('User' in index)
  t.true('Service' in index)
  t.true('Query' in index)
  t.true('Request' in index)
  t.true('Meet' in index)
  t.true('Chat' in index)
  t.true('Profile' in index)
})
