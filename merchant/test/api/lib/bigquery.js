const test = require('ava')
const { query, insert } = require('../../../src/api/lib/bigquery')

const dataset = 'smooosy'
const table = 'web_dev'

test.skip('query BigQuery', async t => {
  await query(`SELECT * FROM ${dataset}.${table}`)
    .then(() => t.pass())
    .catch((e) => {
      console.error(e)
      t.fail()
    })
})

test.skip('insert BigQuery', async t => {
  const rows = [
    {
      instance_id: '0103cf40-9d80-457b-83ad-4961194246a5',
      user_id: null,
      timestamp: new Date(),
      user_type: 2,
      event_type: 'request_create',
      event: JSON.stringify({service_id: 'remodel', request_id: '58d2844eb462480e8fdfd706'}),
      browser_name: 'Chrome',
      browser_version: '61.0.3163.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
      reffer: 'https://www.google.co.jp/',
      platform: 'MacIntel',
      current_page: '/pro',
      history: JSON.stringify(['/']),
      cookie: JSON.stringify({_ga: 'GA1.1.1507341014.1507034717', _gat: '1', _gid: 'GA1.1.1330579651.1509932001'}),
      /*
      global_ip:'114.164.193.158',
      latitude:'35.685',
      longitude:'139.7514',
      country_name:'Japan',
      region_name:'Tokyo',
      city:'Tokyo',
      request_count:2,
      meets_count:5,
      hire_count:3,
      acquisition_point:20,
      free_point:8,
      charge_point:12,
      paid_point:10,
      last_request_service:JSON.stringify({request_id:'58d2844eb462480e8fdfd706',service_id:'remodel',time:'2017-11-6 10:13:12'}),
      last_meets_service:JSON.stringify({meets_id:'58d28626b462480e8fdfd710',request_id:'58d2844eb462480e8fdfd706',service_id:'remodel',time:'2017-11-7 10:13:12',requestElapsed:1,point:10}),
      last_hire_service:JSON.stringify({meets_id:'58d28626b462480e8fdfd710',request_id:'58d2844eb462480e8fdfd706',service_id:'remodel',time:'2017-11-9 10:13:12',meetsElapsed:1,requestElapsed:2,point:10}),
      register_user_date:'2017-11-06 11:19:12',
      register_pro_date:'2017-11-07 11:19:12',
      register_services:JSON.stringify(['remodel','judicial-scrivener-for-c']),
      refound_count: 1
      */
    },
  ]
  await insert(dataset, table, rows)
    .then(() => t.pass())
    .catch(() => {
      t.fail()
    })
})
