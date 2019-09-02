const test = require('ava')
const { ObjectID } = require('mongodb')
const { mongoIdToShortId, shortIdToMongoId } = require('../../../src/api/lib/mongoid')

test('convert mongoId', t => {
  const id = new ObjectID()
  const shortId1 = mongoIdToShortId(id)
  const shortId2 = mongoIdToShortId(id.toString())
  t.is(shortId1, shortId2)

  const reverted = shortIdToMongoId(shortId1)
  t.true(id.equals(reverted))
})


