const supertest = require('supertest')
const mongoose = require('mongoose')

const server = require('../../../src/api/server')
const { createUser } = require('../../__fixtures__/api/models/user')
const { createQuery } = require('../../__fixtures__/api/models/query')

const context: any = {}

beforeEach(async () => {
  context.admin = await createUser({ admin: 10 })
})

afterEach(async () => {
  await mongoose.connection.dropDatabase()
})

describe('query', () => {
  test('create', async () => {
    const queryData = {
      text: 'foo',
      type: 'singular',
    }

    const queryCreateRes = await supertest(server)
      .post('/api/admin/queries')
      .set('Authorization', `Bearer ${context.admin.token}`)
      .send(queryData)

    expect(queryCreateRes.body.text).toBe('foo')

    const queryHistoryRes = await supertest(server)
      .get(`/api/admin/queries/${queryCreateRes.body.id}/history`)
      .set('Authorization', `Bearer ${context.admin.token}`)

    expect(queryHistoryRes.body.activeQuery.id).toBe(queryCreateRes.body.id)
    expect(queryHistoryRes.body.queries).toHaveLength(1)
    expect(queryCreateRes.body.historicalQuery).toBe(
      queryHistoryRes.body.queries[0]._id
    )
    expect(queryHistoryRes.body.queries[0].historicalQuery).toBeUndefined()
  })

  test('update', async () => {
    const query = await createQuery()

    const queryObj = query.toObject()
    queryObj.text = 'herp derp'

    const queryUpdateRes = await supertest(server)
      .put(`/api/admin/queries/${queryObj._id}`)
      .set('Authorization', `Bearer ${context.admin.token}`)
      .send(queryObj)

    expect(queryUpdateRes.body.text).toBe(queryObj.text)
    expect(queryUpdateRes.body.id).toBe(queryObj.id)

    const queryHistoryRes = await supertest(server)
    .get(`/api/admin/queries/${queryUpdateRes.body.id}/history`)
    .set('Authorization', `Bearer ${context.admin.token}`)

    expect(queryHistoryRes.body.activeQuery.id).toBe(queryUpdateRes.body.id)
    expect(queryHistoryRes.body.queries).toHaveLength(2)

    expect(queryUpdateRes.body.historicalQuery).toBe(
      queryHistoryRes.body.queries[1]._id
    )
    expect(queryHistoryRes.body.queries[1].historicalQuery).toBeUndefined()

    // check to make sure the first query in the historical list is preserved
    expect(queryHistoryRes.body.queries[0].text).toBe(query.text)
  })
})