export {}
const test = require('ava')
const supertest = require('supertest')
const util = require('../../../src/api/lib/util')
const sinon = require('sinon')
sinon.spy(util, 'slack')

const server = require('../../../src/api/server')
const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')
const { Media } = require('../../../src/api/models')
import { update } from '../../../src/api/routes/services'
const { updateForAdmin } = require('../../../src/api/routes/categories')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
})

test.afterEach.always(async () => {
  util.slack.resetHistory()
})

test.after.always(async () => {
  await postProcess()
  util.slack.restore()
})



test.serial('メディア画像が削除されたときにSPピックアップ画像に利用しているサービスに通知を送る', async t => {
  const pro = t.context.pro
  const service = t.context.service

  // メディア作成
  const res = await supertest(server)
    .post('/api/media')
    .send({ext: 'png', type: 'image', mime: 'image/png'})
    .set('Authorization', `Bearer ${pro.token}`)
  t.not(res.body.signedUrl, undefined)

  const media = await Media.findById(res.body._id)

  // メディア画像をSPピックアップに登録
  await update({params: {id: service.id}, body: {pickupMedia: [media.id]}}, {json: () => {}})

  await supertest(server)
    .delete(`/api/media/${res.body.id}`)
    .set('Authorization', `Bearer ${pro.token}`)

  t.true(util.slack.called)
})

test.serial('メディア画像が削除されたときにSPコンテンツに利用しているサービスに通知を送る', async t => {
  const pro = t.context.pro
  const service = t.context.service

  // メディア作成
  const res = await supertest(server)
    .post('/api/media')
    .send({ext: 'png', type: 'image', mime: 'image/png'})
    .set('Authorization', `Bearer ${pro.token}`)
  t.not(res.body.signedUrl, undefined)

  const media = await Media.findById(res.body._id)

  // メディア画像をSPコンテンツに登録
  await update({params: {id: service.id}, body: {pageInformation: [{type: 'text', column: 3, text: '<h3>見出し</h3><p>テスト</p>', image: media.url }]}}, {json: () => {}})

  await supertest(server)
    .delete(`/api/media/${res.body.id}`)
    .set('Authorization', `Bearer ${pro.token}`)

  t.true(util.slack.called)
})


test.serial('メディア画像が削除されたときにCPコンテンツに利用しているカテゴリに通知を送る', async t => {
  const pro = t.context.pro
  const category = t.context.category

  // メディア作成
  const res = await supertest(server)
    .post('/api/media')
    .send({ext: 'png', type: 'image', mime: 'image/png'})
    .set('Authorization', `Bearer ${pro.token}`)
  t.not(res.body.signedUrl, undefined)

  const media = await Media.findById(res.body._id)

  // メディア画像をCPコンテンツに登録
  await updateForAdmin({params: {id: category.id}, body: {pageInformation: [{type: 'text', column: 3, text: '<h3>見出し</h3><p>テスト</p>', image: media.url }]}}, {send: () => {}})

  await supertest(server)
    .delete(`/api/media/${res.body.id}`)
    .set('Authorization', `Bearer ${pro.token}`)

  t.true(util.slack.called)
})


