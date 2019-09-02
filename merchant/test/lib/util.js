require('@babel/register')
const test = require('ava')
const { setAmpLandingPage, addAttributionTags } = require('../../src/lib/util')

test('AMPからの流入のlanding_pageを適切に設定する', t => {
  const testdata = [
    {
      args: [
        'https://www.google.com',
        '/amp/t/cleaning',
        '/t/cleaning',
      ],
      result: '/amp/t/cleaning',
    },
    // AMP served by smooosy.com
    {
      args: [
        'https://smooosy.com/amp/t/car-maintenance',
        '/amp/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/amp/t/car-maintenance',
    },
    // AMP served by Google
    {
      args: [
        'https://www.google.co.jp/amp/s/smooosy.com/amp/t/car-maintenance',
        '/amp/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/amp/t/car-maintenance',
    },
    {
      args: [
        'https://www.google.co.jp/',
        '/amp/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/amp/t/car-maintenance',
    },
    // AMP served by Google Cache
    {
      args: [
        'https://smooosy-com.cdn.ampproject.org/v/s/smooosy.com/amp/t/car-maintenance?amp_js_v=0.1',
        '/amp/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/amp/t/car-maintenance?amp_js_v=0.1',
    },
    {
      args: [
        'https://smooosy-com.cdn.ampproject.org/',
        '/amp/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/amp/t/car-maintenance',
    },
    // AMP served by Yahoo
    {
      args: [
        'https://search.yahoo.co.jp/amp/s/smooosy.com/amp/t/car-maintenance%3Fusqp%3Dmq331AQICAEoATgAWAE%253D',
        '/amp/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/amp/t/car-maintenance%3Fusqp%3Dmq331AQICAEoATgAWAE%253D',
    },
    // no referrer
    {
      args: [
        '',
        '/t/car-maintenance',
        '/t/car-maintenance',
      ],
      result: '/t/car-maintenance',
    },
    // no referrer
    {
      args: [
        '',
        '/ampCANONICAL_PATH',
        '/t/car-maintenance',
      ],
      result: '/t/car-maintenance',
    },
  ]

  for (let test of testdata) {
    t.is(setAmpLandingPage(...test.args), test.result)
  }
})

test('addAttributionTags', t => {
  const testCases = [
    {
      utm_source: 'yahoo',
      utm_medium: 'cpc',
      expected: 'yahoo ads',
    },
    {
      utm_source: 'adwords',
      utm_medium: 'blah',
      expected: 'adwords',
    },
    {
      utm_source: 'paid',
      utm_medium: 'cpc',
      expected: 'adwords',
    },
    {
      utm_source: ['adwords', 'paid'],
      utm_medium: ['blah', 'cpc'],
      expected: 'adwords',
    },
  ]

  testCases.forEach(tc => {
    const r = {
      queryParams: {
        utm_source: tc.utm_source,
        utm_medium: tc.utm_medium,
      },
    }

    addAttributionTags(r)
    t.true(r.tags.includes(tc.expected))
  })
})
