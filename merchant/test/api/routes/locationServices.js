const test = require('ava')

const { generateLocationServices } = require('../../../src/api/routes/locationServices')

const runTestCases = require('../models/helpers/runTestCases')

const points = {
  tokyo: { type: 'Point', coordinates: [ 139.56231318417963, 35.72383805086727 ] },
  roppongiAkasakaArea: { type: 'Point', coordinates: [ 139.74348350887476, 35.67030042041377 ] },
  minato: { type: 'Point', coordinates: [ 139.7457933, 35.6528617 ] },
}

const locations = {
  tokyo: {
    _id: 'l1',
    key: 'tokyo',
    name: '東京都',
    parentKey: 'japan',
    parentName: '日本',
    loc: points.tokyo,
    distance: 40000,
    isPublished: true,
    path: '東京都',
    keyPath: 'tokyo',
    group: [],
  },
  roppongiAkasakaArea: {
    _id: 'l2',
    key: 'roppongi-akasaka-area',
    name: '六本木・赤坂',
    parentKey: 'tokyo',
    parentName: '東京都',
    loc: points.roppongiAkasakaArea,
    distance: 1000,
    isPublished: true,
    path: '東京都,六本木・赤坂',
    keyPath: 'tokyo,roppongi-akasaka-area',
    group: [ 'l3' ],
    isGroup: true,
  },
  minato: {
    _id: 'l3',
    key: 'minato',
    name: '港区',
    parentKey: 'tokyo',
    parentName: '東京都',
    loc: points.minato,
    distance: 4000,
    isPublished: true,
    path: '東京都,港区',
    keyPath: 'tokyo,minato',
    group: [],
  },
}

const testCases = [
  {
    name: 'generateLocationServices: サービス 1 fixed、エリア 3 fixed, プロ 3 同一エリア',
    input: {
      profiles: [
        {
          _id: 'p1', name: 'pro1',
          score: 3, loc: points.minato,
          services: ['s1'],
          reviews: [{_id: 'r1', profile: 'p1', service: 's1', rating: 5, username: 'test', text: 'A'.repeat(31)}],
          proServices: [{_id: 'ps1', user: 'u1', profile: 'p1', service: 's1', loc: points.minato}],
          proAnswers: [{_id: 'pa1', pro: 'u1', profile: 'p1',  service: 's1', loc: points.minato, text: 'Test Answer 2'}],
          nearLocations: {
            prefLocations: [locations.tokyo, locations.roppongiAkasakaArea, locations.minato],
            otherLocations: [],
          },
        },
        {
          _id: 'p2', name: 'pro2',
          score: 2, loc: points.minato,
          services: ['s1'],
          reviews: [],
          proServices: [{_id: 'ps2', user: 'u2', profile: 'p2', service: 's1', loc: points.minato}],
          proAnswers: [{_id: 'pa2', pro: 'u2', profile: 'p2', service: 's1', loc: points.minato, text: 'Test Answer 2'}],
          nearLocations: {
            prefLocations: [locations.tokyo, locations.roppongiAkasakaArea, locations.minato],
            otherLocations: [],
          },
        },
        {
          _id: 'p3', name: 'pro3',
          score: 1, loc: points.minato,
          services: ['s1'],
          reviews: [],
          proServices: [],
          proAnswers: [{_id: 'pa3', pro: 'u3', profile: 'p3', service: 's1', loc: points.minato, text: 'Test Answer 3'}],
          nearLocations: {
            prefLocations: [locations.tokyo, locations.roppongiAkasakaArea, locations.minato],
            otherLocations: [],
          },
        },
      ],
      relatedServicesMap: {},
    },
    expected: [
      {
        key: 'tokyo',
        name: '東京都',
        parentKey: 'japan',
        parentName: '日本',
        path: '東京都',
        keyPath: 'tokyo',
        isGroup: undefined,
        service: 's1',
        reviews: [ 'r1' ],
        proServices: [ 'ps2' ],
        proAnswers: [ 'pa3' ],
        relatedReviews: [],
        relatedProServices: [],
      },
      {
        key: 'roppongi-akasaka-area',
        name: '六本木・赤坂',
        parentKey: 'tokyo',
        parentName: '東京都',
        path: '東京都,六本木・赤坂',
        keyPath: 'tokyo,roppongi-akasaka-area',
        isGroup: true,
        service: 's1',
        reviews: [],
        proServices: [ 'ps1' ],
        proAnswers: [ 'pa2', 'pa3' ],
        relatedReviews: [],
        relatedProServices: [],
      },
      {
        key: 'minato',
        name: '港区',
        parentKey: 'tokyo',
        parentName: '東京都',
        path: '東京都,港区',
        keyPath: 'tokyo,minato',
        isGroup: undefined,
        service: 's1',
        reviews: [],
        proServices: [ 'ps2' ],
        proAnswers: [ 'pa1', 'pa3' ],
        relatedReviews: [],
        relatedProServices: [],
      },
    ],
  },
  {
    name: 'generateLocationServices: サービス 1 fixed、エリア 3 fixed, プロ 3 同一エリア, relatedService あり',
    input: {
      profiles: [
        {
          _id: 'p1', name: 'pro1',
          score: 3, loc: points.minato,
          services: ['s1'],
          reviews: [{_id: 'r1', profile: 'p1', service: 's1', rating: 5, username: 'test', text: 'A'.repeat(31)}],
          proServices: [{_id: 'ps1', user: 'u1', profile: 'p1', service: 's1', loc: points.minato}],
          proAnswers: [{_id: 'pa1', pro: 'u1', profile: 'p1',  service: 's1', loc: points.minato, text: 'Test Answer 2'}],
          nearLocations: {
            prefLocations: [locations.tokyo, locations.roppongiAkasakaArea, locations.minato],
            otherLocations: [],
          },
        },
        {
          _id: 'p2', name: 'pro2',
          score: 2, loc: points.minato,
          services: ['s1'],
          reviews: [],
          proServices: [{_id: 'ps2', user: 'u2', profile: 'p2', service: 's1', loc: points.minato}],
          proAnswers: [{_id: 'pa2', pro: 'u2', profile: 'p2', service: 's1', loc: points.minato, text: 'Test Answer 2'}],
          nearLocations: {
            prefLocations: [locations.tokyo, locations.roppongiAkasakaArea, locations.minato],
            otherLocations: [],
          },
        },
        {
          _id: 'p3', name: 'pro3',
          score: 1, loc: points.minato,
          services: ['s1'],
          reviews: [],
          proServices: [],
          proAnswers: [{_id: 'pa3', pro: 'u3', profile: 'p3', service: 's1', loc: points.minato, text: 'Test Answer 3'}],
          nearLocations: {
            prefLocations: [locations.tokyo, locations.roppongiAkasakaArea, locations.minato],
            otherLocations: [],
          },
        },
      ],
      relatedServicesMap: {
        s1: [ 's2' ],
      },
    },
    expected: [
      {
        key: 'tokyo',
        name: '東京都',
        parentKey: 'japan',
        parentName: '日本',
        path: '東京都',
        keyPath: 'tokyo',
        isGroup: undefined,
        service: 's1',
        reviews: [ 'r1' ],
        proServices: [ 'ps2' ],
        proAnswers: [ 'pa3' ],
        relatedReviews: [],
        relatedProServices: [],
      },
      {
        key: 'roppongi-akasaka-area',
        name: '六本木・赤坂',
        parentKey: 'tokyo',
        parentName: '東京都',
        path: '東京都,六本木・赤坂',
        keyPath: 'tokyo,roppongi-akasaka-area',
        isGroup: true,
        service: 's1',
        reviews: [],
        proServices: [ 'ps1' ],
        proAnswers: [ 'pa2', 'pa3' ],
        relatedReviews: [],
        relatedProServices: [],
      },
      {
        key: 'minato',
        name: '港区',
        parentKey: 'tokyo',
        parentName: '東京都',
        path: '東京都,港区',
        keyPath: 'tokyo,minato',
        isGroup: undefined,
        service: 's1',
        reviews: [],
        proServices: [ 'ps2' ],
        proAnswers: [ 'pa1', 'pa3' ],
        relatedReviews: [],
        relatedProServices: [],
      },
      // relatedServices
      {
        key: 'tokyo',
        name: '東京都',
        parentKey: 'japan',
        parentName: '日本',
        path: '東京都',
        keyPath: 'tokyo',
        isGroup: undefined,
        service: 's2',
        reviews: [],
        proServices: [],
        proAnswers: [],
        relatedReviews: [ 'r1' ],
        relatedProServices: [ 'ps2' ],
      },
      {
        key: 'roppongi-akasaka-area',
        name: '六本木・赤坂',
        parentKey: 'tokyo',
        parentName: '東京都',
        path: '東京都,六本木・赤坂',
        keyPath: 'tokyo,roppongi-akasaka-area',
        isGroup: true,
        service: 's2',
        reviews: [],
        proServices: [],
        proAnswers: [],
        relatedReviews: [],
        relatedProServices: [ 'ps1' ],
      },
      {
        key: 'minato',
        name: '港区',
        parentKey: 'tokyo',
        parentName: '東京都',
        path: '東京都,港区',
        keyPath: 'tokyo,minato',
        isGroup: undefined,
        service: 's2',
        reviews: [],
        proServices: [],
        proAnswers: [],
        relatedReviews: [],
        relatedProServices: [],
      },
    ],
  },
]

async function runTest(t, tc) {
  const output = await generateLocationServices(tc.input.profiles, tc.input.relatedServicesMap)

  t.is(output.length, tc.expected.length)
  for (let i in output) {
    t.is(output[i].key, tc.expected[i].key)
    t.is(output[i].name, tc.expected[i].name)
    t.is(output[i].parentKey, tc.expected[i].parentKey)
    t.is(output[i].parentName, tc.expected[i].parentName)
    t.is(output[i].path, tc.expected[i].path)
    t.is(output[i].keyPath, tc.expected[i].keyPath)
    t.is(output[i].isGroup, tc.expected[i].isGroup)
    t.deepEqual(output[i].service, tc.expected[i].service)
    t.deepEqual(output[i].reviews.map(v => v._id), tc.expected[i].reviews)
    t.deepEqual(output[i].proServices.map(v => v._id), tc.expected[i].proServices)
    t.deepEqual(output[i].proAnswers.map(v => v._id), tc.expected[i].proAnswers)
    t.deepEqual(output[i].relatedReviews.map(v => v._id), tc.expected[i].relatedReviews)
    t.deepEqual(output[i].relatedProServices.map(v => v._id), tc.expected[i].relatedProServices)
  }
}

runTestCases(test, testCases, runTest)
