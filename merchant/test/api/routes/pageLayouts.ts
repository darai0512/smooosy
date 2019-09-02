export {}
const test = require('ava')
const supertest = require('supertest')

const { PageLayout } = require('../../../src/api/models')

const server = require('../../../src/api/server')

const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)

  t.context.pageLayoutData = {
    layout: [
      {
        type: 'pageDescription',
        column: 12,
      },
      {
        type: 'whatIs',
        column: 12,
      },
    ],
  }
  t.context.pageLayout = await PageLayout.create(t.context.pageLayoutData)
})

test.after.always(async () => {
  await postProcess()
})

test('showForAdmin: Success', async t => {
  const id = t.context.pageLayout.id
  const admin = t.context.adminUser
  const res = await supertest(server)
    .get(`/api/admin/pageLayouts/${id}`)
    .set('Authorization', `Bearer ${admin.token}`)

  t.is(res.statusCode, 200)
  t.true(res.body.id.length > 0)
  t.true(res.body.layout.length === 2)
  t.is(res.body.layout[0].type, 'pageDescription')
  t.is(res.body.layout[0].column, 12)
  t.is(res.body.layout[1].type, 'whatIs')
  t.is(res.body.layout[1].column, 12)
})

test('showForAdmin: Not Found', async t => {
  const admin = t.context.adminUser
  const res = await supertest(server)
    .get('/api/admin/pageLayouts/1')
    .set('Authorization', `Bearer ${admin.token}`)

  t.is(res.statusCode, 404)
})

test('createForAdmin: Success', async t => {
  const req = {
    body: t.context.pageLayoutData,
  }

  const admin = t.context.adminUser
  const res = await supertest(server)
    .post('/api/admin/pageLayouts')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)

  t.is(res.statusCode, 200)
  t.true(res.body.id.length > 0)
  t.true(res.body.layout.length === 2)
  t.is(res.body.layout[0].type, 'pageDescription')
  t.is(res.body.layout[0].column, 12)
  t.is(res.body.layout[1].type, 'whatIs')
  t.is(res.body.layout[1].column, 12)
})

test('updateForAdmin: Success', async t => {
  const id = t.context.pageLayout.id
  const req = {
    body: {
      layout: [
        {
          type: 'whatIs',
          column: 6,
        },
      ],
    },
  }
  const admin = t.context.adminUser
  const res = await supertest(server)
    .put(`/api/admin/pageLayouts/${id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)

  t.is(res.statusCode, 200)
  t.true(res.body.id.length > 0)
  t.true(res.body.layout.length === 1)
  t.is(res.body.layout[0].type, 'whatIs')
  t.is(res.body.layout[0].column, 6)
})

test('deleteForAdmin: Success', async t => {
  const id = t.context.pageLayout.id
  const admin = t.context.adminUser
  let res = await supertest(server)
    .delete(`/api/admin/pageLayouts/${id}`)
    .set('Authorization', `Bearer ${admin.token}`)

  t.is(res.statusCode, 200)

  res = await supertest(server)
    .get(`/api/admin/pageLayouts/${id}`)
    .set('Authorization', `Bearer ${admin.token}`)

  t.is(res.statusCode, 404)
})