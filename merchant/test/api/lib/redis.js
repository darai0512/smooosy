const test = require('ava')
const redis = require('../../../src/api/lib/redis')
const moment = require('moment')

test('test Redis', async t => {
  const key = 'test'
  const val = 'abcdef'
  const expireTime = 3
  redis.set(key, val)
  const expireAt = moment().add(expireTime, 'seconds')
  redis.expireat(key, expireAt.unix())

  let ret = await redis.getAsync(key)
  t.is(ret, val)
  t.pass()

})
