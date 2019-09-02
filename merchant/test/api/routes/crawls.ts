export {}
const test = require('ava')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const { Crawl, User } = require('../../../src/api/models')
const { postProcess } = require('../helpers/testutil')
const { adminUser } = require('../models/helpers/testutil').fixtureGenerators

test.beforeEach(async t => {
  t.context.admin = await User.create(adminUser())
})

test.after.always(async () => {
  await postProcess()
})

test('空のCrawlが作成できる', async t => {
  const admin = t.context.admin
  await supertest(server)
    .post('/api/admin/crawls')
    .send({inputUrls: []})
    .set('Authorization', `Bearer ${admin.token}`)
  const crawl = await Crawl.findOne({inputUrls: {$size: 0}})
  t.truthy(crawl)
  t.is(crawl.inputUrls.length, 0)
  await crawl.remove()
})

test('Crawlが自動ページングされる', async t => {
  const admin = t.context.admin
  const url = 'http://example.com/{{1:301:10}}'
  await supertest(server)
    .post('/api/admin/crawls')
    .send({
      inputUrls: [url],
      name: 'testCrawl',
    })
    .set('Authorization', `Bearer ${admin.token}`)
  const crawls = await Crawl.find({'inputUrls.0': {$regex: new RegExp('http://example.com')}}).select('inputUrls')
  t.is(crawls.length, 4)
  for (const i in crawls) {
    t.is(crawls[i].inputUrls[0], `http://example.com/{{${Number(i) * 100 + 1}:${Math.min((Number(i) + 1) * 100, 301)}:10}}`)
    await crawls[i].remove()
  }
})

test('1ページのみのページングが適切に作成される', async t => {
  const admin = t.context.admin
  const url = 'http://example2.com/{{1:95:10}}'
  await supertest(server)
    .post('/api/admin/crawls')
    .send({
      inputUrls: [url],
      name: 'testCrawl',
    })
    .set('Authorization', `Bearer ${admin.token}`)
  const crawls = await Crawl.find({'inputUrls.0': {$regex: new RegExp('http://example2.com')}}).select('inputUrls')
  t.is(crawls.length, 1)
  t.is(crawls[0].inputUrls[0], url)
  for (const crawl of crawls) {
    await crawl.remove()
  }
})

test('ページングなしのURLでCrawlが作れる', async t => {
  const admin = t.context.admin
  const url = 'http://example3.com/1'
  await supertest(server)
    .post('/api/admin/crawls')
    .send({
      inputUrls: [url],
      name: 'testCrawl',
    })
    .set('Authorization', `Bearer ${admin.token}`)
  const crawls = await Crawl.find({'inputUrls.0': url}).select('inputUrls')
  t.is(crawls.length, 1)
  t.is(crawls[0].inputUrls[0], url)
  for (const crawl of crawls) {
    await crawl.remove()
  }
})

test.serial('Crawlの結果登録ができる', async t => {
  const admin = t.context.admin
  let crawl = await Crawl.create({
    status: 'done',
    results: [{email: 'crawl@example.com'}],
  })
  await supertest(server)
    .post('/api/admin/crawls/lead')
    .send({ids: [crawl.id]})
    .set('Authorization', `Bearer ${admin.token}`)
  crawl = await Crawl.findById(crawl.id)
  t.is(crawl.status, 'inserted')
  await crawl.remove()
})