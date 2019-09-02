const moment = require('moment')
const supertest = require('supertest')
const server = require('../../../src/api/server')

const { createCategory } = require('../../__fixtures__/api/models/category')
const { createService } = require('../../__fixtures__/api/models/service')
const { createProfile } = require('../../__fixtures__/api/models/profile')
const { createUser } = require('../../__fixtures__/api/models/user')
const { createPointBought } = require('../../__fixtures__/api/models/pointBought')

const context: any = {}

describe('refundStarterPointForAdmin', () => {
  beforeAll(async () => {
    context.category = await createCategory()
    context.singupCategory = await createCategory({key: 'photographers'})
    context.service = await createService({category: context.category})
    context.admin = await createUser({admin: 10})
  })

  beforeEach(async () => {
    context.pro = await createUser({pro: true})
    context.profile = await createProfile({
      pro: context.pro,
      services: [ context.service ],
      signupCategory: context.singupCategory,
      category: context.category.name,
    })
  })

  test('200: success with signupCategory', async () => {
    await createPointBought({
      user: context.pro,
      starterPoint: 0,
      starterPointRunOutAt: moment().subtract(8, 'day'),
    })

    const res = await supertest(server)
      .post(`/api/admin/users/${context.pro._id}/refundStarterPoint`)
      .set('Authorization', `Bearer ${context.admin.token}`)

    expect(res.status).toBe(200)
    expect(res.body.sum).toEqual({ limited: 0, bought: 90, total: 90 })
    expect(res.body.pointBought.point).toBe(90)
    expect(res.body.pointBought.starterPoint).toBe(0)
    expect(res.body.pointBought.starterPointRefunded).toBe(true)
  })

  test('200: success with default signupCategory', async () => {
    const pro = await createUser({pro: true})
    await createProfile({
      pro,
      services: [ context.service ],
      signupCategory: context.category, // not includes in starterPack config
      category: context.category.name,
    })
    await createPointBought({
      user: pro,
      starterPoint: 0,
      starterPointRunOutAt: moment().subtract(8, 'day'),
    })

    const res = await supertest(server)
      .post(`/api/admin/users/${pro._id}/refundStarterPoint`)
      .set('Authorization', `Bearer ${context.admin.token}`)

    // expect(res.status).toBe(200)
    expect(res.body.sum).toEqual({ limited: 0, bought: 50, total: 50 })
    expect(res.body.pointBought.point).toBe(50)
    expect(res.body.pointBought.starterPoint).toBe(0)
    expect(res.body.pointBought.starterPointRefunded).toBe(true)
  })

  // TODO: implement
  // test('404: user not found', () => {})
  // test('404: profile not found', () => {})
  // test('404: pointBought not found', () => {})
  // test('400: already refunded', () => {})
  // test('400: before point back days', () => {})
})