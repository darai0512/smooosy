export {}
const test = require('ava')
const supertest = require('supertest')
const nock = require('nock')
const uuidv4 = require('uuid/v4')
const server = require('../../../src/api/server')
const { Lead, Service, User } = require('../../../src/api/models')
const { postProcess } = require('../helpers/testutil')
const { adminUser } = require('../models/helpers/testutil').fixtureGenerators
const leadResponse = require('../helpers/leadResponse')

test.beforeEach(async t => {
  const uid = uuidv4()
  t.context.lead = await Lead.create({
    url: 'http://example.com/',
    name: `example_${uid}`,
  })
  t.context.admin = await User.create(adminUser())
})

test.after.always(async () => {
  await postProcess()
})

test('formEmailの実行結果がleadに保存される', async t => {
  const admin = t.context.admin
  const lead = t.context.lead
  // mock API
  nock('http://localhost:3300')
    .post('/formEmail')
    .reply(200, leadResponse.formEmail)

  await supertest(server)
    .put(`/api/admin/leads/${lead._id}/formEmail`)
    .set('Authorization', `Bearer ${admin.token}`)
    .expect(200)

  const l = await Lead.findById(lead._id)
  t.is(l.email, leadResponse.formEmail.email)
  t.is(l.formUrl, leadResponse.formEmail.formUrl)
})

test('電話番号・メールアドレス・URL・formURLのいずれかがあれば保存される', async t => {
  const uid = uuidv4()
  const admin = t.context.admin
  const leads = [
    {
      email: `aaa_${uid}@example.com`,
    },
    {
      phone: '09011112222',
    },
    {
      url: 'http://example.com',
    },
    {
      formUrl: 'http://example.com',
    },
  ]
  await supertest(server)
    .post('/api/admin/leads')
    .send({data: leads})
    .set('Authorization', `Bearer ${admin.token}`)
    .expect(200)

  for (const l of leads) {
    const lead = await Lead.findOne(l)
    t.not(lead, null)
  }
})

test('servicesが文字列の場合配列に変換される', async t => {
  const uid = uuidv4()
  const data = {
    'name': 'テストサービス',
    'queries': [],
    'tags': [
      'カテゴリ名',
    ],
    'description': 'テストサービスの説明',
    'imageUpdatedAt': new Date(),
    'enabled': true,
    'providerName': 'テストサービス',
    'priority': 80,
    'pageTitle': 'テストサービスのタイトル',
    'pageDescription': 'テストサービスページの説明',
    'key': `test-service_${uid}`,
    'pickupMedia': [],
    'basePoint': 5,
    'priceComment': '<div style="font-size: 13px;white-space:initial;">\nSMOOOSYでの見積もり価格の分布です。\n<br /><br />\n<b>価格を左右する要素：</b>\n<br /><br />\n<ol>\n<li><b>撮影時間の長さ</b>（メイクシーン・挙式・披露宴・二次会のどれを撮影するのかによって価格が変動します）</li>\n<li><b>オプション</b>（ビデオ撮影、エンドロール、アルバム作成があると価格が大きく変わります）</li>\n<li><b>撮影時期</b>（春や秋、週末はハイシーズンとなります）</li>\n</div>',
    'interview': false,
    'needMoreInfo': false,
    'similarServices': [],
  }
  const service = await Service.create(data)
  const leads = [
    {
      email: `aaa_${uid}@example.com`,
      services: [service.id],
    },
    {
      email: `bbb_${uid}@example.com`,
      services: service.id,
    },
  ]
  await supertest(server)
    .post('/api/admin/leads')
    .send({data: leads})
    .set('Authorization', `Bearer ${t.context.admin.token}`)
    .expect(200)

  for (const l of leads) {
    const lead = await Lead.findOne({email: l.email})
    t.not(lead, null)
  }
})
