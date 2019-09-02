export {}
const test = require('ava')
const sinon = require('sinon')
const qs = require('qs')
const uuidv4 = require('uuid/v4')
const moment = require('moment')
const { ObjectID } = require('mongodb')
const supertest = require('supertest')
const nock = require('nock')
const proxyquire =  require('proxyquire')

const email = require('../../../src/api/lib/email')
// ポイントバックのemail
sinon.stub(email, 'emailPointBack')
sinon.spy(email, 'emailPointGet')

const server = require('../../../src/api/server')
const { User, PointTransaction, PointBalance, PointBought, PointStatistic, Request, Profile, ProService, Service, Chat, Meet } = require('../../../src/api/models')
const { checkPaymentData, addBoughtPoint, earnPoint } = require('../../../src/api/routes/points')
const { encrypt } = require('../../../src/api/lib/encrypter')

const payjpResponse = require('../helpers/payjpResponse')
const epsilonResponse = require('../helpers/epsilonResponse')
const { payment, rolloutDates } = require('@smooosy/config')
const { generateServiceUserProfile, postProcess, locations } = require('../helpers/testutil')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)

  t.context.userWithPayjpId = await User.create({
    lastname: 'payjp',
    email: `payjp+${uuidv4()}@smooosy.com`,
    token: 'tokenPayjp',
    payjpId: 'payjpId',
    bounce: true, // メールを送らない
    hasActiveCard: true,
  })
  t.context.userWithConveniCode = await User.create({
    lastname: 'epsilon',
    email: `epsilon+${uuidv4()}@smooosy.com`,
    token: 'tokenEpsilon',
    conveniCode: [
      {
        code: encrypt('711561'),
        expiredAt: new Date(),
        status: 'waiting',
      },
      {
        code: encrypt('711212'),
        expiredAt: new Date(2018, 0, 1),
        status: 'cancel',
      },
    ],
    bounce: true, // メールを送らない
  })
})

test.afterEach.always(async () => {
  await postProcess()
  email.emailPointGet.resetHistory()
  email.emailPointBack.resetHistory()
})

test.after(() => {
  email.emailPointBack.restore()
  email.emailPointGet.restore()
})

/*
 * payjp
 */

test.serial('ログインしていないとポイント購入できない', async t => {
  const res = await supertest(server)
    .post('/api/points/charge')

  t.is(res.status, 401)
})

const failCases = [
  {
    body: { price: 161, point: 1 },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: 163, point: 1 },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: 162, point: 1 },
    status: 400,
    message: '決済トークンが取得できませんでした',
  },
]

test.serial('不正なリクエストボディだとポイント購入できない', async t => {
  const user = t.context.user

  for (const testcase of failCases) {
    const res = await supertest(server)
      .post('/api/points/charge')
      .set('Authorization', `Bearer ${user.token}`)
      .send(testcase.body)

    t.is(res.status, testcase.status)
    t.is(res.body.message, testcase.message)
  }
})

test.serial('Payjp customers APIが落ちているときにエラー表示させる', async t => {
  const user1 = t.context.user
  const user2 = t.context.userWithPayjpId

  // payjp API stopped
  nock('https://api.pay.jp')
    .get(`/v1/customers/${user2.payjpId}`).reply(500, payjpResponse.error.server)
    .post('/v1/customers').reply(500, payjpResponse.error.server)

  // payjpIdなしユーザー
  let res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user1.token}`)
    .send({price: 162, token: 'token', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, 'クレジットカードの登録に失敗しました。時間をおいて再度お試しください。')

  // payjpIdありユーザー
  res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user2.token}`)
    .send({price: 162, point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, '決済トークンが取得できませんでした')
})

test.serial('Payjp charges APIが障害中にエラー表示させる', async t => {
  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(user))
    .post('/v1/charges').reply(500, payjpResponse.error.server)

  // payjpIdなしユーザー
  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: 162, token: 'token', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。')
})

test.serial('Payjp charges APIが落ちている時にエラー表示させる', async t => {
  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(user))
    .post('/v1/charges').reply(500)

  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: 162, token: 'token', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, '不明なエラーです。')
})

test.serial('Payjp charges APIがカードエラーを返した時にエラー表示させる', async t => {
  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(user))
    .post('/v1/charges').reply(500, payjpResponse.error.card)

  // payjpIdなしユーザー
  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: 162, token: 'token', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, 'カード情報の不備もしくは期限切れです。カード情報を更新するか別のカードをお試しください。')
})

// 各料金毎回別ユーザーで課金
for (const price in payment.table) {
  test.serial(`料金テーブルの各値段で課金できる(price=${price})`, async t => {
    const user = t.context.user

    // mock payjp API
    nock('https://api.pay.jp')
      .post('/v1/customers').reply(200, payjpResponse.customer(user))
      .post('/v1/charges').reply(200, {})

    const res = await supertest(server)
      .post('/api/points/charge')
      .set('Authorization', `Bearer ${user.token}`)
      .send({price, token: 'token', point: payment.table[price]})

    t.is(res.status, 200)
    t.is(res.body.sum.bought, payment.table[price]) // ポイントゲット

    // payjpIdが付与される
    const updatedUser = await User.findOne({_id: user.id})
    t.is(updatedUser.payjpId, payjpResponse.customer(user).id)

    const transaction = await PointTransaction.findOne({user: user.id})
    t.is(transaction.price, parseInt(price, 10))
    t.is(transaction.point, payment.table[price])
    t.is(transaction.platform, 'payjp')
    t.is(transaction.method, 'creditcard')
  })
}

test.serial('ポイントテーブルのチェック', async t => {
  // ポイント割引は廃止されているのでエラー
  await t.throwsAsync(async () => {
    await checkPaymentData({price: 2916, point: 20})
  })

  const ret = await checkPaymentData({price: 162 * 20, point: 20})
  t.is(ret.givenPoint, 20)
})

// 各料金同じユーザーが課金
test.serial('5回連続で課金できる', async t => {
  const user = t.context.userWithPayjpId

  let totalPoint = 0
  for (const price in payment.table) {
    // mock payjp API
    nock('https://api.pay.jp')
      .get(`/v1/customers/${user.payjpId}`).reply(200, payjpResponse.customer(user))
      .post('/v1/charges').reply(200, {})

    const res = await supertest(server)
      .post('/api/points/charge')
      .set('Authorization', `Bearer ${user.token}`)
      .send({price, point: payment.table[price]})

    totalPoint += payment.table[price]
    t.is(res.status, 200)
    t.is(res.body.sum.bought, totalPoint) // ポイント総額
  }

  // ポイントデータ確認
  const transactions = await PointTransaction.find({user: user.id})
  t.is(transactions.length, Object.keys(payment.table).length)
})

test.serial('クレジットカードを追加できる', async t => {
  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .get(`/v1/customers/${payjpResponse.customer(user).id}`).reply(200, payjpResponse.customer(user))
    .post('/v1/customers').reply(200, payjpResponse.customer(user))

  const res = await supertest(server)
    .post('/api/points/addCard')
    .set('Authorization', `Bearer ${user.token}`)
    .send({token: 'token'})

  t.is(res.status, 200)
  // payjpIdが付与される
  const updatedUser = await User.findOne({_id: user.id})
  t.is(updatedUser.payjpId, payjpResponse.customer(user).id)

  // デフォルトクレジットカードがある
  t.deepEqual(res.body.payjpCustomer, payjpResponse.customer(user))
})

test.serial('デフォルトクレジットカードを取得できる', async t => {
  const user = t.context.userWithPayjpId
  console.log(user.payjpId)

  // mock payjp API
  nock('https://api.pay.jp')
    .get(`/v1/customers/${user.payjpId}`)
    .reply(200, payjpResponse.customer(user))

  const res = await supertest(server)
    .get('/api/points/info')
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 200)
  t.deepEqual(res.body.payjpCustomer, payjpResponse.customer(user))
})


/*
 * epsilon
 */

const epsilonNetbankFailCases = [
  {
    body: { },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: 161, point: 1 },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: 163, point: 1 },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: payment.pricePerPoint.withTax, point: 1 },
    status: 400,
    message: '銀行種別が正しくありません',
  },
]

test.serial('銀行種別がないとエラーになる', async t => {
  const user = t.context.user

  for (const testcase of epsilonNetbankFailCases) {
    const res = await supertest(server)
      .post('/api/points/chargeNetbank')
      .set('Authorization', `Bearer ${user.token}`)
      .send(testcase.body)

    t.is(res.status, testcase.status)
    t.is(res.body.message, testcase.message)
  }
})

test.serial('銀行決済が正常終了する', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(200, epsilonResponse.order.netbank)

  const res = await supertest(server)
    .post('/api/points/chargeNetbank')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, netbank: 'rakuten', point: 1})

  t.is(res.status, 200)
  t.is(res.body.redirect, 'https://beta.epsilon.jp/cgi-bin/order/method_select3.cgi?trans_code=Ofr915dhtcs86')
})

test.serial('Epsilonがエラー時にエラー表示させる', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(200, epsilonResponse.order.error)

  const res = await supertest(server)
    .post('/api/points/chargeNetbank')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, netbank: 'rakuten', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, 'エラーが発生しました「このCGIを実行する権限がありません (908)」')
})

test.serial('Epsilonが障害の時にエラー表示させる', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(500, epsilonResponse.order.error)

  const res = await supertest(server)
    .post('/api/points/chargeNetbank')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, netbank: 'rakuten', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。')
})

test.serial('銀行決済戻りURLが正常終了（楽天銀行）', async t => {
  const user = t.context.user
  const payment_code = '5' // 楽天銀行

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/getsales2.cgi')
    .reply(200, epsilonResponse.sales.netbank({user_id: user.id, payment_code}))

  const query = {
    trans_code: '713877',
    order_number: '5ae2f3e631f8b2034f2aa903',
    user_id: user.id,
    state: '1',
    payment_code,
  }

  const res = await supertest(server)
    .get(`/e-payment/paid?${qs.stringify(query)}`)

  // 決済完了表示
  t.is(res.text, 'Found. Redirecting to /account/points?redirect=paid')

  // ポイントが付与される
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction.point, 20)
  t.is(transaction.price, 2916)
  t.is(transaction.platform, 'epsilon')
  t.is(transaction.method, 'netbank')
  t.is(transaction.orderNumber, '5ae2f3e631f8b2034f2aa903')
})

test.serial('銀行決済戻りURLが正常終了（ペイジー）', async t => {
  const user = t.context.user
  const payment_code = '7' // ペイジー

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/getsales2.cgi')
    .reply(200, epsilonResponse.sales.netbank({user_id: user.id, payment_code}))

  const query = {
    trans_code: '713877',
    order_number: '5ae2f3e631f8b2034f2aa903',
    user_id: user.id,
    state: '0',
    payment_code,
  }

  const res = await supertest(server)
    .get(`/e-payment/paid?${qs.stringify(query)}`)

  // ペイジー表示
  t.is(res.text, 'Found. Redirecting to /account/points?redirect=payeasy')

  // まだポイントは付与されない
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction, null)

  // conveniCodeが付与される
  const updatedUser = await User.findOne({_id: user.id})
  t.truthy(updatedUser.conveniCode[0])
  t.is(updatedUser.conveniCode[0].status, 'waiting')
})

test.serial('非対応のpayment_codeは異常終了', async t => {
  const user = t.context.user
  const isNotNetbank = [
    '1', // クレジットカード
    '3', // コンビニ
    '8', // ウェブマネー
    '9', // Yahoo! ウォレット
    '17', // SBIネット銀行は未対応
  ]

  for (const payment_code of isNotNetbank) {
    // mock epsilon API
    nock('https://beta.epsilon.jp')
      .post('/cgi-bin/order/getsales2.cgi')
      .reply(200, epsilonResponse.sales.netbank({user_id: user.id, payment_code}))

    const query = {
      trans_code: '713877',
      order_number: '5ae2f3e631f8b2034f2aa903',
      user_id: user.id,
      state: '1',
      payment_code,
    }

    const res = await supertest(server)
      .get(`/e-payment/paid?${qs.stringify(query)}`)

    // エラー表示
    t.is(res.text, 'Found. Redirecting to /account/points?redirect=error')

    // ポイントが付与されない
    const transaction = await PointTransaction.findOne({user: user.id})
    t.is(transaction, null)
  }
})

test.serial('ユーザーが異なる場合は異常終了', async t => {
  const user = t.context.user
  const payment_code = '5'
  const wrongUserId = '555555555555555555555555'

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/getsales2.cgi')
    .reply(200, epsilonResponse.sales.netbank({user_id: wrongUserId, payment_code}))

  const query = {
    trans_code: '713877',
    order_number: '5ae2f3e631f8b2034f2aa903',
    user_id: user.id,
    state: '1',
    payment_code,
  }

  const res = await supertest(server)
    .get(`/e-payment/paid?${qs.stringify(query)}`)

  // エラー表示
  t.is(res.text, 'Found. Redirecting to /account/points?redirect=error')

  // ポイントが付与されない
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction, null)
})

test.serial('2重で戻りURLを叩かれても2重ポイント付与されない', async t => {
  const user = t.context.user
  const payment_code = '5' // 楽天銀行
  const order_number = '5ae55b81fa223756c5b41dc9'

  const query = {
    trans_code: '713877',
    order_number,
    user_id: user.id,
    state: '1',
    payment_code,
  }

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/getsales2.cgi')
    .reply(200, epsilonResponse.sales.netbank({
      user_id: user.id,
      payment_code,
      order_number,
    }))

  // 1回目
  let res = await supertest(server)
    .get(`/e-payment/paid?${qs.stringify(query)}`)

  // 決済完了表示
  t.is(res.text, 'Found. Redirecting to /account/points?redirect=paid')

  // ポイントが付与される
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction.point, 20)
  t.is(transaction.price, 2916)
  t.is(transaction.platform, 'epsilon')
  t.is(transaction.method, 'netbank')
  t.is(transaction.orderNumber, order_number)

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/getsales2.cgi')
    .reply(200, epsilonResponse.sales.netbank({
      user_id: user.id,
      payment_code,
      order_number,
    }))

  // 2回目
  res = await supertest(server)
    .get(`/e-payment/paid?${qs.stringify(query)}`)

  // 決済失敗表示
  t.is(res.text, 'Found. Redirecting to /account/points?redirect=error')

  // ポイントが付与されない
  const transactions = await PointTransaction.find({user: user.id})
  t.is(transactions.length, 1)
})

const epsilonConveniFailCases = [
  {
    body: { },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: 161, point: 1 },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: 163, point: 1 },
    status: 400,
    message: '購入価格が不適切です',
  },
  {
    body: { price: payment.pricePerPoint.withTax, point: 1 },
    status: 400,
    message: 'コンビニ種別が正しくありません',
  },
]

test.serial('コンビニ番号が必要', async t => {
  const user = t.context.user

  for (const testcase of epsilonConveniFailCases) {
    const res = await supertest(server)
      .post('/api/points/chargeConveni')
      .set('Authorization', `Bearer ${user.token}`)
      .send(testcase.body)

    t.is(res.status, testcase.status)
    t.is(res.body.message, testcase.message)
  }
})

test.serial('ファミマ以外は電話番号が必要', async t => {
  const user = t.context.user

  for (const conveni of ['31', '32', '33']) {
    const res = await supertest(server)
      .post('/api/points/chargeConveni')
      .set('Authorization', `Bearer ${user.token}`)
      .send({price: payment.pricePerPoint.withTax, conveni, point: 1})

    t.is(res.status, 400)
    t.is(res.body.message, '電話番号の形式が正しくありません')
  }
})

test.serial('ファミマは電話番号不要で正常終了', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(200, epsilonResponse.order.conveni)

  const res = await supertest(server)
    .post('/api/points/chargeConveni')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, conveni: '21', point: 1})

  t.is(res.status, 200)
  t.is(res.body.receipt_no, '004538')

  // conveniCodeが付与される
  const updatedUser = await User.findOne({_id: user.id})
  t.truthy(updatedUser.conveniCode[0])
})

test.serial('ファミマ以外は電話番号ありで正常終了', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(200, epsilonResponse.order.conveni)

  const res = await supertest(server)
    .post('/api/points/chargeConveni')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, conveni: '31', phone: '0364410038', point: 1})

  t.is(res.status, 200)
  t.is(res.body.receipt_no, '004538')

  // conveniCodeが付与される
  const updatedUser = await User.findOne({_id: user.id})
  t.truthy(updatedUser.conveniCode[0])
})

test.serial('Epsilonがエラー時の処理', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(200, epsilonResponse.order.error)

  const res = await supertest(server)
    .post('/api/points/chargeConveni')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, conveni: '21', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, 'エラーが発生しました「このCGIを実行する権限がありません (908)」')

  // conveniCodeが付与されない
  const updatedUser = await User.findOne({_id: user.id})
  t.falsy(updatedUser.conveniCode[0])
})

test.serial('Epsilonが障害時の処理', async t => {
  const user = t.context.user

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(500, epsilonResponse.order.error)

  const res = await supertest(server)
    .post('/api/points/chargeConveni')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, conveni: '21', point: 1})

  t.is(res.status, 400)
  t.is(res.body.message, '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。')

  // conveniCodeが付与されない
  const updatedUser = await User.findOne({_id: user.id})
  t.falsy(updatedUser.conveniCode[0])
})

test.serial('コンビニ決済情報取得', async t => {
  const user = t.context.userWithConveniCode

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/getsales2.cgi')
    .reply(200, epsilonResponse.sales.conveni)

  const res = await supertest(server)
    .get('/api/points/info')
    .set('Authorization', `Bearer ${user.token}`)

  t.is(res.status, 200)
  t.is(res.body.conveniInfo.receipt_no, '004538')
  t.is(res.body.conveniInfo.conveni_code, '31')
  t.is(res.body.conveniInfo.item_price, 2916)
  t.is(res.body.conveniInfo.kigyou_code, '00010')
  t.is(res.body.conveniInfo.conveni_limit, '2018-04-30')
  t.is(res.body.conveniInfo.conveni_time, '2018-04-20 03:08:35')
})

test.serial('コンビニ決済完了webhookが正常終了', async t => {
  const user = t.context.userWithConveniCode
  const waitingCode = user.conveniCode.length

  const res = await supertest(server)
    .post('/api/epsilon/conveni')
    .send({
      trans_code: '711561',
      order_number: '5ad8580d755b8c88010127ee',
      user_id: user.id,
      item_price: '2916',
      memo1: '20',
    })

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '1')


  // conveniCodeが消えてポイントが付与される
  const updatedUser = await User.findOne({_id: user.id})
  t.is(updatedUser.conveniCode.length, waitingCode - 1)
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction.point, 20)
  t.is(transaction.price, 2916)
  t.is(transaction.platform, 'epsilon')
  t.is(transaction.method, 'conveni')
  t.is(transaction.orderNumber, '5ad8580d755b8c88010127ee')
})

test.serial('コンビニ決済完了webhookが異常終了', async t => {
  const user = t.context.user

  const res = await supertest(server)
    .post('/api/epsilon/conveni')
    .send({
      trans_code: '711561',
      order_number: '5ad8580d755b8c88010127ee',
      user_id: user.id,
      item_price: '2916',
      memo1: '20',
    })

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '0 001 USER_NOT_FOUND')


  // ポイントが付与されない
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction, null)
})

test.serial('2回目のコンビニ決済依頼', async t => {
  const user = t.context.userWithConveniCode
  const oldConceniCode = user.conveniCode.slice()

  // mock epsilon API
  nock('https://beta.epsilon.jp')
    .post('/cgi-bin/order/receive_order3.cgi')
    .reply(200, epsilonResponse.order.conveni)

  const res = await supertest(server)
    .post('/api/points/chargeConveni')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price: payment.pricePerPoint.withTax, conveni: '31', phone: '0364410038', point: 1})

  t.is(res.status, 200)
  t.is(res.body.receipt_no, '004538')

  const updatedUser = await User.findOne({_id: user.id})
  // 新しいconveniCodeが追加される
  t.truthy(updatedUser.conveniCode[0])
  t.is(updatedUser.conveniCode[0].status, 'waiting')
  // 既存のconveniCodeはcancelになる
  t.is(updatedUser.conveniCode[1].status, 'cancel')
  t.is(updatedUser.conveniCode[1].code, oldConceniCode[0].code)
  // 期限切れのconveniCodeは削除される
  t.falsy(updatedUser.conveniCode[2])
})

test.serial('キャンセル済みのコンビニ決済もポイント付与', async t => {
  const user = t.context.userWithConveniCode
  const oldConceniCode = user.conveniCode

  const res = await supertest(server)
    .post('/api/epsilon/conveni')
    .send({
      trans_code: '711212',
      order_number: '5ad8580d755b8c88010127ee',
      user_id: user.id,
      item_price: '2916',
      memo1: '20',
    })

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '1')

  const updatedUser = await User.findOne({_id: user.id})
  // 711561のconveniCodeはそのまま
  t.is(updatedUser.conveniCode[0].code, oldConceniCode[0].code)
  // 711212のconveniCodeが消える
  t.falsy(updatedUser.conveniCode[1])
  // ポイントが付与
  const transaction = await PointTransaction.findOne({user: user.id})
  t.is(transaction.point, 20)
  t.is(transaction.price, 2916)
  t.is(transaction.platform, 'epsilon')
  t.is(transaction.method, 'conveni')
  t.is(transaction.orderNumber, '5ad8580d755b8c88010127ee')
})


// ポイント系関数のユニットテスト
const {
  addLimitedPoint,
  consumePoint,
  refundPoint,
  discountPoint,
} = require('../../../src/api/routes/points')

test.serial('addLimitedPointで無料ポイントが付与される', async t => {
  const { pro } = t.context

  // 1ヶ月10pt
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 10,
    expiredAt: moment().add({month: 1}).startOf('month').toDate(),
    type: 'limited',
  })

  // ポイント付与確認
  const transaction = await PointTransaction.findOne({user: pro.id})
  t.is(transaction.point, 10)
  let balance = await PointBalance.findOne({user: pro.id})
  t.is(balance.point, 10)

  // 1ヶ月5pt
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 5,
    expiredAt: moment().add({month: 1}).startOf('month').toDate(),
    type: 'limited',
  })

  // ポイント付与確認
  balance = await PointBalance.findOne({user: pro.id})
  t.is(balance.point, 15)

  // 2ヶ月5pt
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 5,
    expiredAt: moment().add({month: 2}).startOf('month').toDate(),
    type: 'limited',
  })

  // 期限の分PointBalanceが作成される
  t.is(await PointTransaction.count({user: pro.id}), 3)
  t.is(await PointBalance.count({user: pro.id}), 2)
})

test.serial('ポイントが足りない場合、consumePointが例外を発生する', async t => {
  // ポイント消費
  await t.throwsAsync(async () => {
    await consumePoint({
      user: t.context.user,
      operator: t.context.user,
      point: 4,
    })
  })
})

test.serial('無料ポイントの期限の近い順で消費される', async t => {
  const { pro } = t.context

  // 1ヶ月5pt
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 5,
    expiredAt: moment().add({month: 1}).startOf('month').toDate(),
    type: 'limited',
  })

  // 2ヶ月5pt
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 5,
    expiredAt: moment().add({month: 2}).startOf('month').toDate(),
    type: 'limited',
  })

  // 期限の分PointBalanceが作成される
  t.is(await PointBalance.count({user: pro.id}), 2)

  await consumePoint({
    user: pro.id,
    operator: pro.id,
    point: 8,
    meet: new ObjectID(),
    request: new ObjectID(),
  })

  // 1ヶ月のPointBalanceが消えている
  t.is(await PointBalance.count({user: pro.id}), 1)

  // 残り2ptになっている
  const balance = await PointBalance.findOne({user: pro.id})
  t.is(balance.point, 2)
  t.true(moment().add({month: 2}).startOf('month').isSame(balance.expiredAt))
})

test.serial('ポイント購入APIへの送信パラメータチェック', async t => {
  const { pro } = t.context

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(pro))
    .post('/v1/charges').reply((uri, requestBody) => {
      const params = qs.parse(requestBody)
      t.true(!!params.customer)
      t.true(!!params.amount && !!params.currency)
      t.true(params.amount >= 50 && params.amount <= 9999999)
      t.true(params.currency === 'jpy')
    })

  // ポイント購入
  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${pro.token}`)
    .send({count: 1, price: 810, token: 'token', point: 5})

  t.is(res.status, 200)
})


test.serial('無料=>有料ポイントの順で消費される', async t => {
  const { pro } = t.context

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(pro))
    .post('/v1/charges').reply(200, {})

  // ポイント購入
  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${pro.token}`)
    .send({count: 1, price: 810, token: 'token', point: 5})

  t.is(res.status, 200)

  // 無料ポイント
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 5,
    expiredAt: moment().add({month: 1}).startOf('month').toDate(),
    type: 'limited',
  })

  await consumePoint({
    user: pro.id,
    operator: pro.id,
    point: 8,
    meet: new ObjectID(),
    request: new ObjectID(),
  })

  // 1ヶ月のPointBalanceが消えている
  t.is(await PointBalance.count({user: pro.id}), 0)

  // 残り2ptになっている
  const bought = await PointBought.findOne({user: pro.id})
  t.is(bought.point, 2)
})

test.serial('ポイントの返還がされる', async t => {
  const { service, user, pro, profile } = t.context

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(pro))
    .post('/v1/charges').reply(200, {})

  // ポイント購入
  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${pro.token}`)
    .send({count: 1, price: 810, token: 'token', point: 5})

  t.is(res.status, 200)

  // 無料ポイント
  await addLimitedPoint({
    user: pro.id,
    operator: pro.id,
    point: 5,
    expiredAt: moment().add({month: 1}).startOf('month').toDate(),
    type: 'limited',
  })

  // 依頼と見積もり作成
  const r = await Request.create({
    status: 'open',
    service: service.id,
    customer: user.id,
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 8,
    pt: 24,
  })
  const chat = await Chat.create({
    user: pro.id,
    text: 'よろしくお願いします。',
  })
  let meet = await Meet.create({
    status: 'waiting',
    request: r.id,
    service: service.id,
    customer: user.id,
    pro: pro.id,
    profile: profile.id,
    chats: [chat.id],
    price: 10000,
    priceType: 'fixed',
    point: 8,
  })

  await consumePoint({
    user: pro.id,
    operator: pro.id,
    point: 8,
    meet: meet.id,
    request: r.id,
  })

  await refundPoint(meet.id)

  // ポイントが戻る
  const balance = await PointBalance.findOne({user: pro.id})
  t.is(balance.point, 5)
  const bought = await PointBalance.findOne({user: pro.id})
  t.is(bought.point, 5)

  // 返還情報
  meet = await Meet.findById(meet.id)
  t.true(meet.refund)
  const transaction = await PointTransaction.findOne({meet: meet.id})
  t.true(transaction.refund)
  t.is(await PointTransaction.count({user: pro.id, type: 'refund'}), 1)
})

test.serial('0ptは割引適用されない', async t => {
  const result = await discountPoint({meetsCount: 0, hiredCount: 0, point: 0})
  t.is(result.point, 0)
  t.is(result.discounts.length, 0)
})


test.serial('クレカ登録済みで初回のときに0pt', async t => {
  const pro = t.context.userWithPayjpId
  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))

  const result = await discountPoint({meetsCount: 0, hiredCount: 0, point: 10, autoAccepted: false, proId: pro.id})
  t.is(result.point, 0)
})

test.serial('成約回数ポイント割引', async t => {
  const pro = t.context.pro
  const point = 10

  // 指定日以前の依頼
  const requestCreatedAt = moment(rolloutDates.disableLessHiredDiscount).subtract(1, 'minute').toDate()

  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))
  // 成約回数割引（１回め）
  let result = await discountPoint({meetsCount: 2, hiredCount: 0, point, proId: pro.id, requestCreatedAt})
  t.is(result.point, 7)
  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))
  // 成約回数割引（２回め）
  result = await discountPoint({meetsCount: 2, hiredCount: 1, point, proId: pro.id, requestCreatedAt})
  t.is(result.point, 9)
  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))
  // 成約回数割引なし（割引なし）
  result = await discountPoint({meetsCount: 2, hiredCount: 2, point, proId: pro.id, requestCreatedAt})
  t.is(result.point, point)
})

test.serial('成約回数ポイント割引無効（指定日以降）', async t => {
  const pro = t.context.pro
  const point = 10
  const points = proxyquire('../../../src/api/routes/points', {
    '../campaigns/discountCampaign': {
      getCreditCampaignTargetUser: async function() {
        return null
      },
    },
  })

  // 指定日以前の依頼
  const requestCreatedAt = moment(rolloutDates.disableLessHiredDiscount).toDate()

  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))
  // 成約回数割引（１回め）
  let result = await points.discountPoint({meetsCount: 2, hiredCount: 0, point, proId: pro.id, requestCreatedAt})
  t.is(result.point, 10)
  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))
  // 成約回数割引（２回め）
  result = await points.discountPoint({meetsCount: 2, hiredCount: 1, point, proId: pro.id, requestCreatedAt})
  t.is(result.point, 10)
  nock('https://api.pay.jp')
    .get(`/v1/customers/${pro.payjpId}`).reply(200, payjpResponse.customer(pro))
  // 成約回数割引なし（割引なし）
  result = await points.discountPoint({meetsCount: 2, hiredCount: 2, point, proId: pro.id, requestCreatedAt})
  t.is(result.point, point)
})



///////////////// まずは10回キャンペーン /////////////////////


test.serial('見積り１回以下はまずは10回キャンペーン対象者(購入なし)', async t => {

  for (let i = 0; i < 3; i++) {
    // 見積もり数２回以下、未購入のときに有効
    const result = await supertest(server)
      .get('/api/points/starterPack')
      .set('Authorization', `Bearer ${t.context.pro.token}`)
      .expect(200)

    t.is(result.body.isTarget, i === 2 ? false : true)

    const chat = await Chat.create({
      user: t.context.pro.id,
      text: 'よろしくお願いします',
      read: false,
    })
    const req = await Request.create({
      status: 'open',
      service: t.context.service.id,
      customer: t.context.user.id,
      description: [{
        answers: [{ text: 'お願いします' }],
        type: 'textarea',
        label: 'プロの方へのメッセージ',
      }],
      category: 'カテゴリ名',
      point: 5,
      pt: 24,
      sent: [t.context.profile.id],
    })
    await Meet.create({
      status: 'waiting',
      request: req,
      service: t.context.service.id,
      customer: t.context.user.id,
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      chats: [chat.id],
      price: 10000,
      priceType: 'fixed',
      point: 0,
    })
  }
})

test.serial('まずは10回キャンペーン購入でまずは10回キャンペーン対象者外', async t => {

  // 見積もり数２回以下、未購入のときに有効
  let result = await supertest(server)
    .get('/api/points/starterPack')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  t.is(result.body.isTarget, true)

  // 購入ポイントをupsertする
  await PointBought.update(
    {
      user: t.context.pro,
      deleted: { $ne: true },
    },
    {
      $inc: { point: 0, starterPoint: 1 },
      $set: { lastUpdatedAt: new Date() },
    },
    {upsert: true},
  )

  result = await supertest(server)
    .get('/api/points/starterPack')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  t.is(result.body.isTarget, false)
})

test.serial('discountPriceが付与されているときにstarterPointにpointと同じポイントを加算する（クレカ決済）', async t => {
  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(user))
    .post('/v1/charges').reply(200, {})

  const price = 8100
  await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price, token: 'token', discountPrice: price * 0.8, point: price / 162})
    .expect(200)

  const pointBought = await PointBought.findOne({user})
  t.is(pointBought.point, pointBought.starterPoint)
})

test.serial('通常購入の場合はstarterPointは更新しない', async t => {
  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(user))
    .post('/v1/charges').reply(200, {})

  const price = 8100
  await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price, token: 'token', point: price / 162})
    .expect(200)

  const pointBought = await PointBought.findOne({user})
  t.is(!!pointBought.starterPoint, false)
})

test.serial('一度でもaddBoughtPointしたら２回目のdiscountPrice付きでの決済はエラーになる', async t => {

  const user = t.context.user

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(user))
    .post('/v1/charges').reply(200, {})

  const price = 8100
  await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price, token: 'token', discountPrice: price * 0.8, point: price / 162})
    .expect(200)

  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price, token: 'token', discountPrice: price * 0.8, point: price / 162})
    .expect(400)

  t.is(res.status, 400)
})

test.serial('discountPriceはpriceの２割引でないときにエラーになる（まずは10回キャンペーン専用）', async t => {
  const user = t.context.user

  const price = 8100
  const res = await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${user.token}`)
    .send({price, token: 'token', discountPrice: price * 0.7, point: price / 162})
    .expect(400)

  t.is(res.status, 400)
})

test.serial('starterPointが存在するときポイント消費時にpointと同時に同じ値が引かれる', async t => {
  const pro = t.context.pro

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpResponse.customer(pro))
    .post('/v1/charges').reply(200, {})

  const price = 8100
  const point = price / 162
  const meetPoint = point / 2
  await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${pro.token}`)
    .send({price, token: 'token', discountPrice: price * 0.8, point})
    .expect(200)

  const chat = await Chat.create({
    user: t.context.pro.id,
    text: 'よろしくお願いします',
    read: false,
  })
  const req = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    sent: [t.context.profile.id],
  })
  const meet = await Meet.create({
    status: 'waiting',
    request: req,
    service: t.context.service.id,
    customer: t.context.user.id,
    pro: t.context.pro.id,
    profile: t.context.profile.id,
    chats: [chat.id],
    price: 10000,
    priceType: 'fixed',
    point: meetPoint,
  })
  await consumePoint({ user: pro, operator: pro, point: meetPoint, meet, request: req, service: t.context.service })

  const pointBought = await PointBought.findOne({user: pro})
  // 同じでなければエラー
  t.is(pointBought.point, pointBought.starterPoint)
})

test.serial('starterPointが存在するときポイント消費時にstarterPointの残高が尽きた場合、0になる', async t => {
  const pro = t.context.pro
  const payjpCustomer = payjpResponse.customer(pro)

  // mock payjp API
  nock('https://api.pay.jp')
    .post('/v1/customers').reply(200, payjpCustomer)
    .post('/v1/charges').reply(200, {})

  const price = 8100
  const point = 50
  const meetPoint = 75
  // まずは10回キャンペーン購入
  await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${pro.token}`)
    .send({price, token: 'token', discountPrice: price * 0.8, point})
    .expect(200)


  // mock payjp API
  nock('https://api.pay.jp')
    .get(`/v1/customers/${payjpCustomer.id}`).reply(200, payjpCustomer)
    .post('/v1/customers').reply(200, payjpCustomer)
    .post('/v1/charges').reply(200, {})

  // 通常購入
  await supertest(server)
    .post('/api/points/charge')
    .set('Authorization', `Bearer ${pro.token}`)
    .send({price, token: 'token', point})
    .expect(200)

  const chat = await Chat.create({
    user: t.context.pro.id,
    text: 'よろしくお願いします',
    read: false,
  })
  const req = await Request.create({
    status: 'open',
    service: t.context.service.id,
    customer: t.context.user.id,
    description: [{
      answers: [{ text: 'お願いします' }],
      type: 'textarea',
      label: 'プロの方へのメッセージ',
    }],
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
    sent: [t.context.profile.id],
  })
  const meet = await Meet.create({
    status: 'waiting',
    request: req,
    service: t.context.service.id,
    customer: t.context.user.id,
    pro: t.context.pro.id,
    profile: t.context.profile.id,
    chats: [chat.id],
    price: 10000,
    priceType: 'fixed',
    point: meetPoint,
  })
  await consumePoint({ user: pro, operator: pro, point: meetPoint, meet, request: req, service: t.context.service })

  const pointBought = await PointBought.findOne({user: pro})
  // starterPointの残高は0
  t.is(pointBought.starterPoint, 0)
  // starterPointが尽きたときは日付が入る
  t.is(!!pointBought.starterPointRunOutAt, true)
  // pointの残高が正しい
  t.is(pointBought.point, 25)
})

////////////////////////////////////////////////////////

const units = [{
  point: 0,
  earned: 0,
}, {
  point: 19,
  earned: 0,
}, {
  point: 20,
  earned: 1,
}, {
  point: 199,
  earned: 9,
}, {
  point: 200,
  earned: 14,
}, {
  point: 499,
  earned: 34,
}, {
  point: 500,
  earned: 50,
}, {
  point: 999,
  earned: 99,
}, {
  point: 1000,
  earned: 120,
}, {
  point: 1999,
  earned: 239,
}, {
  point: 2000,
  earned: 300,
}]
for (const unit of units) {
  const title = `get correct points (earned: ${unit.earned}) based on consumed points (type: "bought") last month (point=${unit.point})`
  test.serial(title, async t => {
    await addBoughtPoint({user: t.context.pro._id, operator: t.context.pro._id, point: 10000})

    // 無料ポイント付与してすぐ使う to make sure 無料ポイントを計算に含まない
    const consumeLimitedPoint = async () => {
      await addLimitedPoint({user: t.context.pro._id, operator: t.context.pro._id, point: 10, type: 'limited', expiredAt: moment().add({month: 1}).startOf('month').toDate()})
      await consumePoint({user: t.context.pro._id, operator: t.context.pro._id, point: 10})
    }
    const key = moment().format('YYYY-MM')

    await consumeLimitedPoint()
    await consumePoint({user: t.context.pro._id, operator: t.context.pro._id, point: unit.point})
    await earnPoint({start: moment().subtract(1, 'minute').toDate(), end: moment().toDate()})
    const statistic = await PointStatistic.findOne({key, user: t.context.pro._id}).select('earned transaction')
    t.is(statistic.earned, unit.earned)
    // メール送信される
    t.is(email.emailPointBack.called, !!unit.earned)
  })
}

test.serial('create PointStatistic', async t => {
  const BOUGHT = 2000
  const LIMITED = 20
  const EARNED = 300
  await addBoughtPoint({user: t.context.pro._id, operator: t.context.pro._id, point: BOUGHT})
  await consumePoint({user: t.context.pro._id, operator: t.context.pro._id, point: BOUGHT})
  await addLimitedPoint({user: t.context.pro._id, operator: t.context.pro._id, point: LIMITED, type: 'limited', expiredAt: moment().add({month: 1}).startOf('month').toDate()})
  await consumePoint({user: t.context.pro._id, operator: t.context.pro._id, point: LIMITED})

  await earnPoint({start: moment().subtract(1, 'minute').toDate(), end: moment().toDate()})
  const statistic = await PointStatistic.findOne({
    user: t.context.pro._id,
    key: moment().format('YYYY-MM'),
    transaction: {$exists: true},
  }).lean()
  t.truthy(statistic)
  t.deepEqual(statistic.income, {bought: BOUGHT, limited: LIMITED})
  t.deepEqual(statistic.outgo, {bought: BOUGHT, limited: LIMITED})
  t.is(statistic.earned, EARNED)
  t.true(email.emailPointBack.called)
})

// TODO: test buyPoints and getPayjpUserWithCreditCard

async function createProServices(t, num) {
  for (let i = 2; i <= num; i++) {
    const s = await Service.create({
      'name': `テストサービス${i}`,
      'description': `テストサービス${i}の説明`,
      'key': `test-service${i}`,
    })
    t.context.proServices = t.context.proServices || []
    t.context.proServices.push(await ProService.create({
      user: t.context.pro._id,
      profile: t.context.profile._id,
      service: s._id,
      loc: t.context.profile.loc,
      distance: 50000,
    }))
  }
}

test.serial('get proServiceDescription campaign: num of proServices is over limit', async t => {
  const key = 'proServiceDescription'
  await createProServices(t, 11)
  const res = await supertest(server)
    .get('/api/points/campaigns')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  const campaign = res.body.find(c => c.key === key)
  t.deepEqual(campaign.level, [
    'テストサービスサービスの自己紹介設定',
    'テストサービス2サービスの自己紹介設定',
    'テストサービス3サービスの自己紹介設定',
    'テストサービス4サービスの自己紹介設定',
    'テストサービス5サービスの自己紹介設定',
    'テストサービス6サービスの自己紹介設定',
    'テストサービス7サービスの自己紹介設定',
    'テストサービス8サービスの自己紹介設定',
    'テストサービス9サービスの自己紹介設定',
    'テストサービス10サービスの自己紹介設定',
  ])
  t.is(campaign.status, 'open')
  t.is(campaign.applied, 0)
  t.is(campaign.clear, 0)
})

test.serial('get proServiceDescription campaign: multiple profiles', async t => {
  const key = 'proServiceDescription'
  await createProServices(t, 2)

  const profile2 = await Profile.create({
    name: 'テスト事業者_2',
    services: [t.context.service2.id],
    loc: locations.sapporo,
    description: 'aaaaa',
    pro: t.context.pro.id,
  })
  await ProService.create({
    user: t.context.pro._id,
    profile: profile2._id,
    service: t.context.service2._id,
    description: 'description',
    loc: profile2.loc,
    distance: 50000,
  })
  t.context.service2.name = 'テストサービス2-1'
  t.context.service2.save()
  t.context.user.profiles.push(profile2)
  t.context.user.save()

  const res = await supertest(server)
    .get('/api/points/campaigns')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  const campaign = res.body.find(c => c.key === key)
  t.deepEqual(campaign.level, [
    'テストサービス2-1サービスの自己紹介設定',
    'テストサービスサービスの自己紹介設定',
    'テストサービス2サービスの自己紹介設定',
  ])
  t.is(campaign.status, 'clear')
  t.is(campaign.applied, 0)
  t.is(campaign.clear, 1)
})

test.serial('get proServiceDescription campaign: clear', async t => {
  const key = 'proServiceDescription'

  await createProServices(t, 2)
  t.context.proService.description = 'サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文'
  await t.context.proService.save()

  const res = await supertest(server)
    .get('/api/points/campaigns')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  const campaign = res.body.find(c => c.key === key)
  t.is(campaign.status, 'clear')
  t.is(campaign.applied, 0)
  t.is(campaign.clear, 1)
})

test.serial('get proServiceDescription campaign: disabled proService is not include', async t => {
  const key = 'proServiceDescription'

  await createProServices(t, 2)
  t.context.proService.description = 'サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文'
  t.context.proService.disabled = true
  await t.context.proService.save()

  const res = await supertest(server)
    .get('/api/points/campaigns')
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  const campaign = res.body.find(c => c.key === key)
  t.is(campaign.status, 'open')
  t.is(campaign.applied, 0)
  t.is(campaign.clear, 0)
})

test.serial('apply proServiceDescription campaign: first', async t => {
  const key = 'proServiceDescription'

  await createProServices(t, 2)
  t.context.proService.description = 'サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文'
  await t.context.proService.save()

  const res = await supertest(server)
    .post(`/api/points/campaigns/${key}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(200)

  const campaign = res.body.find(c => c.key === key)
  t.is(campaign.status, 'open')
  t.is(campaign.applied, 1)
  t.is(campaign.clear, 1)

  const pts = await PointTransaction.find({campaign: key})
  t.is(pts.length, 1)
})

test.serial('apply proServiceDescription campaign: do not apply to disabled proService', async t => {
  const key = 'proServiceDescription'

  await createProServices(t, 2)
  t.context.proService.description = 'サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文'
  t.context.proService.disabled = true
  await t.context.proService.save()

  const res = await supertest(server)
    .post(`/api/points/campaigns/${key}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(400)

  t.is(res.body.message, 'Can not Apply')

  const pts = await PointTransaction.find({campaign: key})
  t.is(pts.length, 0)
})

test.serial('apply proServiceDescription campaign: already get all points', async t => {
  const key = 'proServiceDescription'

  t.context.proServices = [t.context.proService]
  await createProServices(t, 11)
  t.context.proServices.forEach(async ps => {
    ps.description = 'サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文サービスごとの説明文'
    await ps.save()
  })

  for (let i = 0; i < 9; i++) {
    const res = await supertest(server)
      .post(`/api/points/campaigns/${key}`)
      .set('Authorization', `Bearer ${t.context.pro.token}`)
      .expect(200)

    const campaign = res.body.find(c => c.key === key)
    t.is(campaign.status, 'clear')
    t.is(campaign.applied, i+1)
    t.is(campaign.clear, 10)
  }

  // last point
  let res = await supertest(server)
  .post(`/api/points/campaigns/${key}`)
  .set('Authorization', `Bearer ${t.context.pro.token}`)
  .expect(200)

  const campaign = res.body.find(c => c.key === key)
  t.is(campaign.status, 'done')
  t.is(campaign.applied, 10)
  t.is(campaign.clear, 10)

  // after limit
  res = await supertest(server)
    .post(`/api/points/campaigns/${key}`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(400)
  t.is(res.body.message, 'Can not Apply')

  const pts = await PointTransaction.find({campaign: key})
  t.is(pts.length, 10)
})
