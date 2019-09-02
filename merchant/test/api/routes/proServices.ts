export {}
import test from 'ava'
const supertest = require('supertest')
const moment = require('moment')
const uuidv4 = require('uuid/v4')
const { ObjectID } = require('mongodb')

const server = require('../../../src/api/server')
const { generateServiceUserProfile, postProcess, createDataSet, locations, generateRequestViaModel } = require('../helpers/testutil')
const { fetchSpentPoints, filterValidPriceValues, calculatePrice, getPriceForAnswers } = require('../../../src/api/routes/proServices')
const runTestCases = require('../models/helpers/runTestCases')
const { Request, User, Meet, Profile, ProService } = require('../../../src/api/models')

test('fetch spent points collectly', async t => {
  const meetData = {
    pro: new ObjectID(),
    profile: new ObjectID(),
    customer: new ObjectID(),
    request: new ObjectID(),
    service: new ObjectID(),
    status: 'waiting',
    price: 1000,
    priceType: 'fixed',
    point: 4,
  }

  const meet1 = await Meet.create(meetData)
  const meet2 = await Meet.create(meetData)
  meet2.point = 5
  meet2.createdAt = moment(meet1.createdAt).add(1, 'hour').toDate()
  await meet2.save()

  let spent = await fetchSpentPoints({
    userId: meetData.pro,
    serviceId: meetData.service,
    range: [
      meet1.createdAt,
      moment(meet2.createdAt).add(1, 'second').toDate(),
    ],
  })
  t.is(spent, 9)

  spent = await fetchSpentPoints({
    userId: meetData.pro,
    serviceId: meetData.service,
    range: [
      moment(meet1.createdAt).add(1, 'second').toDate(),
      meet2.createdAt,
    ],
  })
  t.is(spent, 0)

  await meet1.remove()
  await meet2.remove()
})

// route integration tests
test.serial('[success] get match results for a query', async t => {
  const dataSet = createDataSet()
  await generateServiceUserProfile(t, { dataSet })

  const res = await supertest(server)
    .post('/api/instant-results')
    .send(dataSet.proServicesQuery)

  t.true(res.ok)
  t.is(res.body.length, dataSet.tokyoProServices.length)
  t.is(res.body[0]._id, t.context.proService.id)

  await postProcess()
})

// filterValidPriceValues

const queries = [
  {
    _id: 'query1',
    usedForPro: true,
    priceFactorType: 'base',
    options: [
      { _id: 'query1_validOption', usedForPro: true },
      { _id: 'query1_invalidOption', usedForPro: false },
    ],
  },
  {
    _id: 'query2',
    usedForPro: true,
    priceFactorType: 'base',
    options: [
      { _id: 'query2_validOption', usedForPro: true },
      { _id: 'query2_invalidOption', usedForPro: false },
    ],
  },
  {
    _id: 'query3',
    usedForPro: true,
    options: [
      { _id: 'query3_validOption', usedForPro: true },
    ],
  },
]

const testdatas = [
  {
    title: 'typeが不適切なpriceValuesは取り除かれる',
    input: [{ type: 'test' }],
    valid: false,
  },
  {
    title: 'valueが0より小さいpriceValuesは取り除かれる',
    input: [{ type: 'base', value: -1 }],
    valid: false,
  },
  {
    title: 'discount typeでvalueが100より大きいpriceValuesは取り除かれる',
    input: [{ type: 'discount', value: 1000 }],
    valid: false,
  },
  {
    title: 'answersに不適切なoptionIdがあるpriceValuesは取り除かれる',
    input: [{ type: 'base', value: 1000, answers: ['test'] }],
    valid: false,
  },
  {
    title: 'priceFactorTypeを持たないqueryのoptionがanswerにあるpriceValuesは取り除かれる',
    input: [{ type: 'addon', value: 1000, answers: ['query3_validOption'] }],
    valid: false,
  },
  {
    title: 'usedForProでないoptionがanswerにあるpriceValuesは取り除かれる',
    input: [{ type: 'base', value: 1000, answers: ['query2_invalidOption'] }],
    valid: false,
  },
  {
    title: 'baseが2つあるのに組み合わせられていないanswerを持つpriceValuesは取り除かれる',
    input: [{ type: 'base', value: 1000, answers: ['query1_validOption'] }],
    valid: false,
  },
  {
    title: '適切なpriceValuesは残る',
    input: [{ type: 'base', value: 1000, answers: ['query1_validOption', 'query2_validOption'] }],
    valid: true,
  },
]

for (const testdata of testdatas) {
  test(testdata.title, t => {
    const result = filterValidPriceValues(testdata.input, queries)
    t.is(result.length, testdata.valid ? 1 : 0)
  })
}


test('calculatePrice happy path', t => {
  const description = [
    {
      priceFactorType: 'base',
      type: 'number',
      options: [
        {
          _id: 'kimono',
          number: 5,
          checked: true,
          text: 'kimono-label',
          usedForPro: true,
        },
        {
          _id: 'yukata',
          number: 2,
          checked: true,
          text: 'yukata-label',
          usedForPro: true,
        },
      ],
    },
    {
      type: 'singular',
      priceFactorType: 'base',
      options: [
        {
          _id: 'studio',
          checked: true,
          text: 'studio-label',
          usedForPro: true,
        },
      ],
    },
    {
      type: 'singular',
      priceFactorType: 'addon',
      options: [
        {
          _id: 'makeup',
          checked: true,
          text: 'makeup-label',
          usedForPro: true,
        },
      ],
    },
    {
      type: 'singular',
      priceFactorType: 'discount',
      options: [
        {
          _id: 'repeat-user',
          checked: true,
          text: 'repeat-user-label',
          usedForPro: true,
        },
      ],
    },
  ]

  const priceValues = [
    {
      type: 'base',
      answers: [ 'kimono', 'studio' ],
      value: 5000,
    },
    {
      type: 'base',
      answers: [ 'yukata', 'studio' ],
      value: 2500,
    },
    {
      type: 'base',
      answers: [ 'kimono', 'outside' ],
      value: 4500,
    },
    {
      type: 'base',
      answers: [ 'yukata', 'outside' ],
      value: 2000,
    },
    {
      type: 'addon',
      answers: [ 'makeup' ],
      value: 2500,
    },
    {
      type: 'discount',
      answers: [ 'repeat-user' ],
      value: 20,
    },
  ]

  const proService = {}

  const res = calculatePrice({ proService, priceValues, description })

  // 5 kimonos in studio
  t.is(res.components[0].calculatedValue, 25000)
  t.is(res.components[0].label, 'studio-label + kimono-label')
  // 2 yukatas in studio
  t.is(res.components[1].calculatedValue, 5000)
  t.is(res.components[1].label, 'studio-label + yukata-label')
  // sum of base prices (25000 + 5000) with 20% discount
  t.is(res.components[2].calculatedValue, -6000)
  t.is(res.components[2].label, 'repeat-user-label')
  // makeup chosen
  t.is(res.components[3].calculatedValue, 2500)
  t.is(res.components[3].label, 'makeup-label')
  // 25000 + 5000 - 6000 + 2500
  t.is(res.total, 26500)
})

test('calculatePrice question with no answers', t => {
  const priceValues = [
    {
      type: 'base',
      answers: [ 'bar', 'baz' ],
      value: 5000,
    },
    {
      type: 'base',
      answers: [ 'foo', 'baz' ],
      value: 2500,
    },
  ]

  const description = [
    {
      type: 'singular',
      priceFactorType: 'base',
      options: [
        {
          _id: 'baz',
          text: 'baz-label',
          usedForPro: true,
        },
      ],
    },
    {
      type: 'multiple',
      priceFactorType: 'base',
      options: [
        {
          _id: 'bar',
          text: 'bar-label',
          usedForPro: true,
        },
        {
          _id: 'foo',
          text: 'foo-label',
          usedForPro: true,
        },
      ],
    },
  ]

  const proService = {}

  const res = calculatePrice({ proService, priceValues, description })

  // cheapest option should get chosen in case of "partial" match
  t.is(res.components[0].calculatedValue, 2500)
  t.is(res.components[0].label, 'baz-label + foo-label')
  t.is(res.total, 2500)
})

test('exact match for discount works well', t => {
  const answers = [
    {
      _id: ObjectID('592d3dc58a08e7c72b550c88'),
      checked: true,
    },
  ]

  const priceValues = [
    {
      type: 'discount',
      answers: [ ObjectID('592d3dc58a08e7c72b550c88') ],
      value: 20,
    },
    {
      type: 'discount',
      answers: [ ObjectID('5c4a727e0ee25195b909c667') ],
      value: 10,
    },
  ]

  const price = getPriceForAnswers({
    answers,
    priceValues,
    exactMatch: true,
    isNumber: false,
  })

  t.truthy(price)
  t.is(price.value, 20)
})

test('addon and discount with 0 yen is not calculated', t => {
  const priceValues = [
    {
      type: 'base',
      answers: [ 'foo' ],
      value: 100,
    },
    {
      type: 'base',
      answers: [ 'bar' ],
      value: 250,
    },
    {
      type: 'discount',
      answers: [ 'discount_1' ],
      value: 0,
    },
    {
      type: 'addon',
      answers: [ 'addon_1' ],
      value: 0,
    },
  ]

  const description = [
    {
      type: 'singular',
      priceFactorType: 'base',
      options: [
        {
          _id: 'foo',
          text: 'foo-label',
          usedForPro: true,
          checked: true,
        },
        {
          _id: 'bar',
          text: 'bar-label',
          usedForPro: true,
        },
      ],
    },
    {
      type: 'singular',
      priceFactorType: 'discount',
      options: [
        {
          _id: 'discount_1',
          usedForPro: true,
          checked: true,
        },
      ],
    },
    {
      type: 'multiple',
      priceFactorType: 'addon',
      options: [
        {
          _id: 'addon_1',
          usedForPro: true,
          checked: true,
        },
      ],
    },
  ]

  const proService = {}

  const res = calculatePrice({ proService, priceValues, description })
  t.is(res.total, 100)
  t.is(res.components.length, 1)
})


test('show 1st number price if description is empty', t => {
  const priceValues = [
    {
      type: 'base',
      answers: [ 'foo' ],
      value: 100,
    },
    {
      type: 'base',
      answers: [ 'bar' ],
      value: 250,
    },
  ]

  const description = [
    {
      type: 'number',
      priceFactorType: 'base',
      options: [
        {
          _id: 'foo',
          text: 'foo-label',
          usedForPro: true,
        },
        {
          _id: 'bar',
          text: 'bar-label',
          usedForPro: true,
        },
      ],
    },
  ]

  const proService = {}

  const res = calculatePrice({ proService, priceValues, description })
  t.is(res.total, 100)
  t.is(res.components[0].value, 100)
  t.is(res.components[0].label, 'foo-label')
  t.is(res.components[0].calculatedValue, 100)
})

test('show exactMatch prices if description exists', t => {
  const priceValues = [
    {
      type: 'base',
      answers: [ 'foo', 'hoge' ],
      value: 100,
    },
    {
      type: 'base',
      answers: [ 'foo', 'fuga' ],
      value: 200,
    },
  ]

  const description: any = [
    {
      type: 'number',
      priceFactorType: 'base',
      options: [
        {
          _id: 'foo',
          text: 'foo-label',
          usedForPro: true,
        },
        {
          _id: 'bar',
          text: 'bar-label',
          usedForPro: true,
        },
      ],
    },
    {
      type: 'singular',
      priceFactorType: 'base',
      options: [
        {
          _id: 'hoge',
          text: 'hoge-label',
          usedForPro: true,
        },
        {
          _id: 'fuga',
          text: 'fuga-label',
          usedForPro: true,
        },
      ],
    },
  ]

  const proService = {}

  let res = calculatePrice({ proService, priceValues, description })
  t.is(res.total, 100)
  t.is(res.components[0].value, 100)
  t.is(res.components[0].label, 'hoge-label + foo-label')
  t.is(res.components[0].calculatedValue, 100)

  // foo = 3
  description[0].options[0].checked = true
  description[0].options[0].number = 3
  res = calculatePrice({ proService, priceValues, description })
  t.is(res.total, 300)
  t.is(res.components[0].value, 100)
  t.is(res.components[0].label, 'hoge-label + foo-label')
  t.is(res.components[0].calculatedValue, 300)

  // bar = 2 but the pro does not input bar price
  description[0].options[1].checked = true
  description[0].options[1].number = 2
  res = calculatePrice({ proService, priceValues, description })
  t.is(res, null)
})

const meetLengthTestCases = [{
  name: 'get 409 from search with 5 promo meets',
  promos: [true, true, true, true, true],
  expect: 409,
}, {
  name: 'get 409 from search with 5 promo meets and 1 non-promo meet',
  promos: [true, true, true, true, false, true],
  expect: 409,
}, {
  name: 'get 200 from search with 4 promo meets and 2 non-promo meets',
  promos: [true, true, true, true, false, false],
  expect: 200,
}]

const meetLengthTest = async (t, tc) => {
  await generateServiceUserProfile(t)
  await generateRequestViaModel(t)
  const req = await Request.findById(t.context.request._id)
  req.loc = locations.tokyo
  await req.save()

  for (let i = 0; i < tc.promos.length; i++) {
    const uid = uuidv4()
    const pro = await User.create({
      lastname: `user2_${uid}`,
      email: `test2_${uid}@smooosy.com`,
      token: `token2_${uid}`,
      pro: true,
      profiles: [],
      schedule: {
        dayOff: new Array(7).fill(false),
        startTime: 1,
        endTime: 23,
      },
      bounce: true, // メールを送らない
    })
    const profile = await Profile.create({
      name: `pro_${uid}`,
      services: [t.context.service._id],
      loc: locations.tokyo,
      description: 'aaaaa',
      pro: pro._id,
    })
    pro.profiles.push(profile._id)
    await pro.save()
    await ProService.create({
      user: pro._id,
      service: t.context.service._id,
      profile: profile._id,
      loc: locations.tokyo,
      setupLocation: true,
      setupJobRequirements: true,
      setupPriceValues: true,
      isPromoted: tc.promos[i],
    })
    await supertest(server)
      .post(`/api/requests/${req._id}/meetsByUser`)
      .send([profile._id])
      .set('Authorization', `Bearer ${t.context.user.token}`)
      .expect(200)
  }
  const res = await supertest(server)
    .get(`/api/instant-results/${req._id}`)
    .set('Authorization', `Bearer ${t.context.user.token}`)

  t.is(tc.expect, res.status)
}

runTestCases(test, meetLengthTestCases, meetLengthTest)
