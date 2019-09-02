const test = require('ava')
const { ObjectId } = require('mongodb')

const rewire = require('rewire')


test('getBaseQuery contains proper userIds', async t => {
  const customerId = new ObjectId()
  const serviceId = new ObjectId()
  const request = {
    _id: new ObjectId(),
    sent: [ { pro: 'sent' } ],
    meets: [ { pro: 'meet' } ],
    pendingMeets: [ { pro: 'pendingMeet' } ],
    customer: { _id: customerId },
    service: { _id: serviceId },
  }
  const common = rewire('../../../../src/api/lib/matching/common')
  common.__set__('getRecentMeetsPro', () => ['recent'])
  common.__set__('getExcludedPro', () => ['exclude'])

  const baseQuery = await common.getBaseQuery(request, ['excludeId'])
  const nin = baseQuery.user.$nin
  t.true(nin.includes(customerId))
  t.true(nin.includes('sent'))
  t.true(nin.includes('meet'))
  t.true(nin.includes('pendingMeet'))
  t.true(nin.includes('recent'))
  t.true(nin.includes('exclude'))
  t.true(nin.includes('excludeId'))

  t.is(baseQuery.service, serviceId)
})
