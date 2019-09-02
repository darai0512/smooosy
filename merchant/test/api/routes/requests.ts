export {}
const test = require('ava')
const supertest = require('supertest')
const { ObjectID } = require('mongodb')
const moment = require('moment')
const uuidv4 = require('uuid/v4')
const server = require('../../../src/api/server')
const { Query, ProService, Service, User, Request, Meet, Chat, PointTransaction, BlackList, CSTask, Contact } = require('../../../src/api/models')
const { addLimitedPoint } = require('../../../src/api/routes/points')
const { calculatePrice } = require('../../../src/api/routes/proServices')
const { generateServiceUserProfile, generateRequestViaModel, generateRequestWithSingularOptionQuery, postProcess, createServiceData, queries, priceValues, requestDescription } = require('../helpers/testutil')
const { matchingBuckets } = require('../../../src/api/lib/matching/buckets')
const { getPriceResultForRequest } = require('../../../src/api/lib/pricing/pricingUtils')
const { injectDescriptionIntoQueries } = require('../../../src/api/lib/matching/common')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  await generateRequestViaModel(t)

  const chat = await Chat.create({
    user: t.context.user.id,
    text: 'よろしくお願いします',
    read: false,
  })
  t.context.meet = await Meet.create({
    status: 'waiting',
    request: t.context.request.id,
    service: t.context.service.id,
    customer: t.context.user.id,
    pro: t.context.pro.id,
    profile: t.context.profile.id,
    chats: [chat.id],
    price: 10000,
    priceType: 'fixed',
    point: 0,
  })

  const uid = uuidv4()
  t.context.notnameUser = await User.create({
    lastname: 'あ',
    email: `test3_${uid}@smooosy.com`,
    token: `token3_${uid}`,
    bounce: true, // メールを送らない
  })
  t.context.anonymousUser = await User.create({
    lastname: '匿名',
    email: `test4_${uid}@smooosy.com`,
    token: `token4_${uid}`,
    bounce: true, // メールを送らない
  })
})

test.after.always(async () => {
  await postProcess()
})

const defaultDescription = [{
  'type': 'textarea',
  'label': 'プロの方へのメッセージ',
  'answers': [
    {
      'text': '',
    },
  ],
}]


test('依頼作成ができる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)
})

test('依頼作成時に作成までの時間が早すぎる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
    time: 1,
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('early'))
})

test('依頼作成時に入力欄にNGワードが含まれている場合に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': 'こんにちは麻薬を売ってください',
        },
      ],
    }],
    time: 1,
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('ngwords'))
})

test('依頼作成時に入力欄にテストワードが含まれている場合に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': 'こんにちはテストです',
        },
      ],
    }],
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('testwords'))
})

test('依頼作成時に依頼者名が漢字以外の一文字のみの場合に聞き取りフラグを立てる', async t => {
  const notnameUser = t.context.notnameUser
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = notnameUser.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('notname'))
})

test('依頼作成時に入力欄がブラックリストの条件に引っかかる場合に聞き取りフラグを立てる', async t => {
  const service = t.context.service

  const targets = [
    'email', 'name', 'input',
  ]
  const types = [
    'exact', 'prefix', 'suffix', 'partial', 'regexp',
  ]

  const blacklistName = 'ほげ'
  const blacklistInput = 'blacklistワード'

  const blacklistEmailMatch = {
    'exact': 'abc@smooosy.biz',
    'prefix': 'abc',
    'suffix': 'smooosy.biz',
    'partial': 'meets',
    'regexp': '\@meets',
  }
  const blacklistNameMatch = {
    'exact': blacklistName,
    'prefix': blacklistName + 'あいう',
    'suffix': 'あいう' + blacklistName,
    'partial': 'あいう' + blacklistName + 'えおか',
    'regexp': blacklistName,
  }
  const blacklistInputMatch = {
    'exact': blacklistInput,
    'prefix': blacklistInput + 'あいう',
    'suffix': 'あいう' + blacklistInput,
    'partial': 'あいう' + blacklistInput + 'えおか',
    'regexp': blacklistInput,
  }
  for (const target of targets) {
    for (const type of types) {
      const blacklistEmail = blacklistEmailMatch[type]
      const blacklist = await BlackList.create({target, type, enabled: true, text: target === 'email' ? blacklistEmail : target === 'name' ? blacklistName : blacklistInput })
      const user = await User.create({
        email: 'abc@smooosy.biz',
        lastname: target === 'name' ? blacklistNameMatch[type] : '一郎',
        token: 'blacklistToken',
        bounce: true, // メールを送らない
      })

      const body = {
        service: service.id,
        description: [{
          'type': 'textarea',
          'label': 'プロの方へのメッセージ',
          'answers': [
            {
              'text': target === 'input' ? blacklistInputMatch[type] : 'よろしくお願いします',
            },
          ],
        }],
      }

      const token = user.token
      const res = await supertest(server)
        .post('/api/requests')
        .set('Authorization', `Bearer ${token}`)
        .send(body)

      t.is(res.status, 200)

      const r = await Request.findById(res.body.id)
      t.true(r.interview.includes('blacklist'))

      await blacklist.remove()
      await user.remove()
    }
  }

  // ブラックリストに引っかからない
  for (const type of types) {
    const blacklist = await BlackList.create({target: 'input', type, enabled: true, text: blacklistInput })
    const user = await User.create({
      email: 'abc@smooosy.biz',
      lastname: '一郎',
      token: 'blacklistToken',
      bounce: true, // メールを送らない
    })

    const body = {
      service: service.id,
      description: [{
        'type': 'multiple',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'checked': true,
            'text': 'よろしくお願いします',
          },
          {
            'text': blacklistInputMatch[type], // 選択していない項目にblacklistあり
          },
        ],
      }],
    }

    const token = user.token
    const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

    t.is(res.status, 200)

    const r = await Request.findById(res.body.id)
    t.false(r.interview.includes('blacklist'))

    await blacklist.remove()
    await user.remove()
  }

})

test('依頼作成時に入力欄に繰り返し文字が含まれている場合に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': 'ああああああああああああああああああああああ',
        },
      ],
    }],
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('repeat'))
})

test('プロからの依頼作成時に聞き取りフラグを立てる', async t => {
  const pro = t.context.pro
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = pro.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('protest'))
})

test('依頼作成時に依頼者名が匿名の場合に聞き取りフラグを立てる', async t => {
  const anonymousUser = t.context.anonymousUser
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = anonymousUser.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('anonymous'))
})

test('依頼作成時に入力欄にemailが含まれている場合に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': '私のメールアドレスはabc@gmail.comです',
        },
      ],
    }],
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('hasEmail'))
})


test('依頼作成時に入力欄に電話番号が含まれている場合に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': '私の電話番号は09011112222です',
        },
      ],
    }],
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('hasPhone'))
})


test('聞き込み必須のサービスへの依頼作成時に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service
  service.interview = true
  await service.save()

  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('service'))
})

test('依頼作成時に依頼料が高すぎる場合に聞き取りフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
    price: { avg: 1000000000 },
    phone: '09011112222',
  }

  const token = user.token
  const res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('highPrice'))
})

test('電話番号が変な依頼にフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const blacklist = await BlackList.create({
    target: 'phone',
    type: 'regexp',
    enabled: true,
    text: '(\\d)\\1{3}',
  })
  const body = {
    service: service.id,
    description: defaultDescription,
    phone: '00000000000',
  }

  const token = user.token
  const res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('phone'))
  await blacklist.remove()
})

test('依頼更新時に電話番号のフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const blacklist = await BlackList.create({
    target: 'phone',
    type: 'regexp',
    enabled: true,
    text: '(\\d)\\1{3}',
  })
  const token = user.token
  let res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  t.is(res.status, 200)

  res = await supertest(server)
    .put(`/api/requests/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({phone: '00000000000'})

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('phone'))
  t.true(r.point > 0)
  await blacklist.remove()
})

test('ブラックリストに含まれるIPでフラグを立てる', async t => {
  const user = t.context.user
  const service = t.context.service

  const blacklist = await BlackList.create({
    target: 'ip',
    type: 'partial',
    enabled: true,
    text: '127.0.0.1',
  })
  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = user.token
  const res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.includes('ip'))

  await blacklist.remove()
})


test('依頼時に聞き取りフラグの配列データが重複しない', async t => {
  const user = t.context.user
  const service = t.context.service

  const body = {
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ1',
      'answers': [
        {
          'text': 'ああああああああああああああああああああああ',
        },
      ],
    },
    {
      'type': 'textarea',
      'label': 'プロの方へのメッセージ2',
      'answers': [
        {
          'text': 'ああああああああああああああああああああああ',
        },
      ],
    }],
  }

  const token = user.token
  const res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  t.is(res.status, 200)

  const r = await Request.findById(res.body.id)
  t.true(r.interview.filter((x, i, self) => self.indexOf(x) !== self.lastIndexOf(x)).length === 0)
})


test('不適切なブラックリストがあっても依頼が完了', async t => {
  const user = t.context.user
  const service = t.context.service

  const blacklist = await BlackList.create({
    target: 'ip',
    type: 'regexp',
    enabled: true,
    text: '***', // 不適切な正規表現
  })
  const body = {
    service: service.id,
    description: defaultDescription,
  }

  const token = user.token
  const res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  t.is(res.status, 200)

  await blacklist.remove()
})

test('重複依頼でポイントが返還される', async t => {
  const user = t.context.user
  const pro = t.context.pro
  const profile = t.context.profile
  const service = t.context.service

  // 依頼作成
  let res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      service: service.id,
      description: [{
        'type': 'textarea',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'text': '依頼その1',
          },
        ],
      }],
      interview: [],
    })

  t.is(res.status, 200)

  // 強制マッチ
  const r = await Request.findOne({_id: res.body.id})
  r.sent = [profile.id]
  await r.save()

  const today = new Date()
  // ポイント獲得
  addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 10,
    expiredAt: today.setDate(today.getDate() + 1),
    type: 'limited',
  })

  // プロが見積もり送信
  res = await supertest(server)
    .post(`/api/requests/${r.id}/meets`)
    .set('Authorization', `Bearer ${pro.token}`)
    .send({
      profile: profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
      files: [],
    })

  t.is(res.status, 200)

  let transaction = await PointTransaction.findOne({
    user: pro.id,
    meet: res.body.id,
  })

  t.is(transaction.point, -res.body.point)

  // 重複依頼
  res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      service: service.id,
      description: [{
        'type': 'textarea',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'text': '依頼その2',
          },
        ],
      }],
      interview: [],
    })

  t.is(res.status, 200)

  // 重複削除
  res = await supertest(server)
    .put(`/api/requests/${res.body.id}/overwrite`)
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 200)

  // ポイントが返還される
  transaction = await PointTransaction.findOne({
    _id: transaction.id,
  })
  t.is(transaction.refund, true)
})

test('ユーザーが自分が出していない依頼の取得をすると403エラーになる', async t => {
  const requestByOther = t.context.request
  const user = t.context.anonymousUser

  // 依頼取得
  const res = await supertest(server)
    .get(`/api/requests/${requestByOther.id}`)
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 403)
  t.is(res.body.message, 'user mismatch')
})

test('プロが自分にマッチしていない依頼の取得をすると403エラーになる', async t => {
  const user = t.context.user
  const pro = t.context.pro
  const service = t.context.service

  // 依頼作成
  let res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      service: service.id,
      description: [{
        'type': 'textarea',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'text': '依頼その1',
          },
        ],
      }],
      interview: [],
    })

  t.is(res.status, 200)

  // プロとして依頼取得
  res = await supertest(server)
    .get(`/api/pros/requests/${res.body.id}`)
    .set('Authorization', `Bearer ${pro.token}`)

  t.is(res.status, 403)
  t.is(res.body.message, 'user mismatch')
})

test('プロが応募済み依頼の取得をすると302になる', async t => {
  const pro = t.context.pro
  const r = t.context.request
  const meet = t.context.meet

  // プロとして依頼取得
  const res = await supertest(server)
    .get(`/api/pros/requests/${r.id}`)
    .set('Authorization', `Bearer ${pro.token}`)

  t.is(res.status, 302)
  t.is(res.body.meet.id, meet.id)
})

test('request is created correctly', async t => {
  const user = t.context.user
  const r = t.context.requestBody

  const res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send(r)

  t.is(res.status, 200)
  t.is(res.body.duration, 15)
})

test.skip('企業案件で人名が入力されていると人名フラグが立つ', async t => {
  const user = t.context.user
  user.corporation = true
  await user.save()
  const r = {
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    description: [
      {
        answers: [{ text: 'お願いします' }],
        type: 'textarea',
        label: 'プロの方へのメッセージ',
      },
      {
        type: 'calendar',
        subType: 'duration',
        label: '日時',
        answers: [
          {
            date: '2018-08-17T15:00:00.000Z',
            start: '10:00',
            end: '翌日1:00',
            text: '2018年8月18日（土）  10:00から翌日1:00まで',
          },
        ],
      },
      {
        answers: [{ text: '石川と申します。よろしくお願いいたします。' }],
        type: 'textarea',
        label: 'プロの方へのメッセージ',
      },
    ],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
  }
  await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send(r)
    .expect(200)

  const req = await Request.findOne({customer: user.id})
  t.is(req.interview.includes('personName'), true)
})

test('インタビューフラグが立つとCSタスクが作成される', async t => {
  const user = t.context.user
  const service = t.context.service
  // 早すぎる依頼を作る
  const body = {
    service: service.id,
    description: defaultDescription,
    time: 1,
  }

  const token = user.token
  await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body)
    .expect(200)

  const req = await Request.findOne({customer: user.id})
  const count = await CSTask.countDocuments({request: req.id, type: 'interview'})
  t.is(count, 1)
})

test('あんかけ経由の依頼はフラグが立つ', async t => {
  const user = t.context.user
  const service = t.context.service

  // 依頼作成
  await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      service: service.id,
      description: [{
        'type': 'textarea',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'text': '依頼その1',
          },
        ],
      }],
      interview: [],
      stack: ['/new-requests/XXXXXXXX?utm_campaign=website&utm_source=email&utm_medium=emailNewRequestForLeadText'],
    })
    .expect(200)
  const req = await Request.findOne({customer: user.id}).lean()
  t.true(req.interview.includes('viaLead'))
})

test('request.matchMoreEnabled is true when create a request for matchMoreEnabled service', async t => {
  const user = t.context.user
  const service = await Service.findByIdAndUpdate(t.context.service._id, {$set: {matchMoreEnabled: true}})
  await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      service: service._id,
      description: [{
        'type': 'textarea',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'text': '依頼その1',
          },
        ],
      }],
      interview: [],
      stack: ['/new-requests/XXXXXXXX?utm_campaign=website&utm_source=email&utm_medium=emailNewRequestForLeadText'],
    })
    .expect(200)
  const req = await Request.findOne({customer: user._id}).select('matchMoreEnabled').lean()
  t.true(req.matchMoreEnabled)
})

test('Request.create() with `highPoint` interview', async t => {
  const body = { // ref: '../lib/pricing/requests/helpers/requests.js'
    service: t.context.service.id,
    description: [
      {
        type: 'price',
        answers: [
          {range: [10000, 20000], checked: true},
          {range: [20000, 30000], checked: true},
        ],
      },
      {
        type: 'textarea',
        answers: [{
          checked: true,
          point: 10,
          text: 'a'.repeat(255),
        }],
      },
    ],
    phone: '81-1234-1234',
  }

  const response = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send(body)
    .expect(200)

  t.is(response.body.price.min, 10000)
  t.is(response.body.price.max, 30000)
  t.is(response.body.price.avg, 20000)
  t.true(response.body.point > 10)
  // t.true(v.interview.includes('highPoint')) // user.lastnameがuuidを含むため'repeat'など含まれうる

  t.timeout(3 * 1000) // cf, fail to setTimeout(t.end, 3 * 1000)
})

test('Request.create() without `highPoint` interview by no price description', async t => {
  const body = {
    service: t.context.service.id,
    description: [
      {
        type: 'textarea',
        answers: [{
          checked: true,
          point: 10,
          text: 'a'.repeat(255),
        }],
      },
    ],
    phone: '81-1234-1234',
  }

  const response = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send(body)
    .expect(200)

  t.falsy(response.body.price)
  t.true(response.body.point > 10)
  t.false(response.body.interview.includes('highPoint'))
})

test('pro request view: isExactMatch request is correctly returned', async t => {
  const requestExactMatch = await generateRequestWithSingularOptionQuery(t)
  requestExactMatch.matchParams = { showExactMatch: true }

  const pro = t.context.scenario.pros.akasakaGoodPhotoPro
  const service = t.context.scenario.services.photoService

  requestExactMatch.sent = [ pro.profile.id ]

  await Promise.all([
    service.save(),
    requestExactMatch.save(),
  ])

  const res = await supertest(server)
    .get(`/api/pros/requests/${requestExactMatch._id.toString()}`)
    .set('Authorization', `Bearer ${pro.user.token}`)

  t.is(res.status, 200)
  t.is(res.body.isExactMatch, true)
})

test('request creation: request correctly set with show exact match', async t => {
  const user = t.context.user
  const service = t.context.scenario.services.photoService
  service.showJobRequirements = true

  await service.save()

  const body = {
    service: t.context.service.id,
    description: defaultDescription,
  }

  const token = user.token
  let res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  let r = await Request.findById(res.body.id)
  t.true(r.matchParams.showExactMatch)

  // service not part of rollout
  body.service = t.context.service2.id

  res = await supertest(server)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  t.is(res.status, 200)

  r = await Request.findById(res.body.id)
  t.falsy(r.matchParams.showExactMatch)
})

test('matchmore campaign target: point is 1, isMatchMoreCampaignTarget is true', async t => {
  const carServiceData = createServiceData(ObjectID(), uuidv4())
  carServiceData.tags = ['車検・修理']
  carServiceData.matchMoreEditable = true
  const carService = await Service.create(carServiceData)
  t.context.targetService = carService._id

  const targetService = t.context.targetService._id
  // add service and create proService

  await supertest(server)
    .put(`/api/profiles/${t.context.profile._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .send({services: [targetService._id]})
    .expect(200)

  // update user and proservice to become a target of creditcard campaign
  await User.findByIdAndUpdate(t.context.profile.pro, {$set: {isMatchMore: true, hasActiveCard: true, schedule: {startTime: 6, endTime: 22}}})
  await ProService.findOneAndUpdate({profile: t.context.profile._id, service: targetService._id}, {$set: {setupLocation: true, setupJobRequirements: true, setupPriceValues: true}}).lean()

  // request created
  const body = {
    service: targetService._id,
    loc: { coordinates: [ 139.56231318417963, 35.72383805086727 ], type: 'Point' },
    description: [{
      type: 'calendar',
      answers: [{
        date: moment().add(10, 'day').toDate(),
        start: 10,
      }],
    }, {
      type: 'textarea',
      label: 'プロの方へのメッセージ',
      answers: [{
        type: 'textarea',
        label: 'プロの方へのメッセージ',
        answers: [
          {
            text: '',
          },
        ],
      }],
    }],
  }

  let res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send(body)
    .expect(200)
  await Request.findByIdAndUpdate(res.body._id, {$set: {point: 10}, $push: {sent: [t.context.profile._id]}}).lean()

  res = await supertest(server)
    .get(`/api/pros/requests/${res.body._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  t.is(res.body.point, 1)
  t.true(res.body.isMatchMoreCampaignTarget)
})

test('match by user', async t => {
  const user = t.context.user
  const requestBody = t.context.requestBody

  let res = await supertest(server)
    .post('/api/requests')
    .set('Authorization', `Bearer ${user.token}`)
    .send(requestBody)

  t.is(res.status, 200)

  const requestId = res.body._id

  res = await supertest(server)
    .post(`/api/requests/${requestId}/matchByUser`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ profile: t.context.profile2._id })

  t.is(res.status, 200)

  const contact = await Contact.findOne({
    request: requestId,
    profile: t.context.profile2._id,
  })

  t.is(contact.matchingBucket, matchingBuckets.MATCHED_BY_USER)
})

test('calc correct point with usePriceValueBudget', async t => {
  const query = await Query.create(queries.matchMoreBase)
  const service = t.context.service
  service.queries = [ query ]
  service.usePriceValueBudget = true
  service.basePoint = 10
  service.maxPointCost = 100
  service.priceValues = priceValues.single(query)
  service.pricesToPoints = [{
    price: 10000,
    points: 10,
  }, {
    price: 20000,
    points: 20,
  }, {
    price: 30000,
    points: 30,
  }],
  await service.save()

  // create a request with 0th option
  let res = await supertest(server)
    .post('/api/requests')
    .send({
      service: service._id,
      description: [requestDescription.selectNFromQuery(0, query.toObject())],
    })
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .expect(200)

  // this section is same as requests.create
  // xxxxxxxxxxxxxxxxxxxxxx from here xxxxxxxxxxxxxxxxxxxxxxx
  const request = await Request.findById(res.body._id)
  request.category = service.tags[0]
  request.distance = service.distance
  request.maxPointCost = service.maxPointCost
  request.matchMoreEnabled = service.matchMoreEnabled // save matchMoreEnabled at this time
  request.usePriceValueBudget = service.usePriceValueBudget

  injectDescriptionIntoQueries(request.description, service.queries)
  request.priceValueResult = calculatePrice({
    priceValues: service.priceValues,
    description: service.queries.filter(q => q.priceFactorType),
    service,
    distance: 0,
    proService: {},
  })

  request.priceModels.push('instant')
  request.pricesToPoints = service.pricesToPoints

  request.matchParams = request.matchParams || {}
  // xxxxxxxxxxxxxxxxxxxxxx to here xxxxxxxxxxxxxxxxxxxxxxx

  const { priceResults } = await request.calcPoint(service.basePoint, service.queries)
  request.pricesToPoints = service.pricesToPoints
  const estimate = getPriceResultForRequest(priceResults, request).value
  t.is(request.point, estimate)

  // point is calculated same as create
  res = await supertest(server)
    .put(`/api/requests/${request._id}`)
    .send({
      // TODO: SMS 通知期間（リリース翌日）がすぎたら削除して良い
      // smsAgree is unrelated to calculate point
      smsAgree: true,
    })
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .expect(200)

  t.is(res.body.point, estimate)
})

test('response 200 if pro is in specialSent and non matchMore', async t => {
  // make meet be in other request
  await Meet.updateOne({_id: t.context.meet._id}, {$set: {
    request: ObjectID(),
  }})
  // pro in specialSent is also in sent
  await Request.updateOne({_id: t.context.request._id}, {$push: {specialSent: t.context.profile._id, sent: t.context.profile._id}})
  const res = await supertest(server)
    .get(`/api/pros/requests/${t.context.request._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)

  t.is(res.status, 200)
})

test('response 302 if pro is in specialSent and pendingMeets', async t => {
  // make meet be in other request
  await Meet.updateOne({_id: t.context.meet._id}, {$set: {
    profile: t.context.profile._id,
    service: t.context.request.service._id,
    pro: t.context.profile.pro._id,
  }})
  // pro in specialSent is also in sent
  await Request.updateOne({_id: t.context.request._id}, {$push: {specialSent: t.context.profile._id, pendingMeets: t.context.meet._id}})
  const res = await supertest(server)
    .get(`/api/pros/requests/${t.context.request._id}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)

  t.is(res.status, 302)
})

test('admins can correctly see an individual request in tools', async t => {
  const admin = t.context.adminUser

  const res = await supertest(server)
    .get(`/api/admin/requests/${t.context.request._id}`)
    .set('Authorization', `Bearer ${admin.token}`)

  t.is(res.status, 200)
})

// TODO: implement these tests as a fix-it task :)
// const matchMoreRequestTests = [
//   {
//     title: 'unpromoted pro',
//     modifiers: async function(context) {
//       context.proService.isPromoted = false
//       await context.proService.save()
//     },
//     assertions: function(t, context, request, meet)
//     },
//   },
//   {
//     title: 'promoted pro, free request',
//   },
//   {
//     title: 'promoted pro, match, enough points',
//   },
//   {
//     title: 'promoted pro, match, not enough points, successful charge',
//   },
//   {
//     title: 'promoted pro, match, not enough points, failed charge',
//   },
//   {
//     title: 'request with matchmore promoted pro, mismatch',
//   },
// ]
