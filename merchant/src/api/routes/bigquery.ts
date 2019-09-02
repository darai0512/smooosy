export {}
const config = require('config')
const platform = require('platform')
const uuidv4 = require('uuid/v4')
const { getIP } = require('../lib/util')
const bigquery = require('../lib/bigquery')
import match_more_table = require('../bigquery_match_more.json')
import web_table = require('../bigquery_web.json')
const bigqueryTables = {
  match_more: match_more_table,
  web: web_table,
}
const { User } = require('../models')

module.exports = {
  dummyUser,
  insert,
  ampInsert,
  BigQueryInsert,
}


// bigqueryの必須項目追加
function dummyUser() {
  return {
    instance_id: '',
    user_type: 2,
  }
}

async function ampInsert(req, res) {
  const { ampId, eventType, referrer, currentPage, userAgent, variants } = req.query
  req.userData = {
    user_agent: userAgent,
  }

  const data = {
    event_type: eventType,
    instance_id: '',
    amp_id: ampId,
    user_agent: userAgent,
    reffer: referrer,
    current_page: currentPage,
    landing_page: currentPage,
    user_type: 2, // not logged in
  }

  BigQueryInsert(req, data)

  // experiments
  if (variants) {
    const experiments = variants.split('!')
    const experimentBuckets = experiments.map(exp => {
      const [ name, bucket ] = exp.split('.')
      return { name, bucket }
    })
    const event = { experimentBuckets }

    BigQueryInsert(req, {
      ...data,
      event_type: 'get_active_experiments',
      event: JSON.stringify(event),
    })
  }

  res.json({})
}

async function insert(req, res) {
  if (req.user && req.body.event_type === 'page_view') {
    await User.findByIdAndUpdate(req.user.id, {$set: {lastAccessedAt: new Date()}})
  }

  const tableKeys = Object.keys(bigqueryTables)
  let rows = Array.isArray(req.body) ? req.body : [req.body]
  rows = rows.filter(r => tableKeys.includes(r.table_name))

  for (const row of rows) {
    BigQueryInsert(req, row, row.table_name)
  }
  res.json({})
}

// default table value is for backward compatibility
async function BigQueryInsert(req, data, table = 'web') {
  if (!req.userData) return

  // obj => array
  let rows = Array.isArray(data) ? data : [data]

  const userData = await getUserData(req)
  const global_ip = getIP(req)

  rows = rows
    .map(row => {
      const data = {
        timestamp: new Date(), // insert以外はtimestampがない
        ...userData,
        ...row,
        global_ip,
        id: uuidv4(),
      }
      return bigquery.leaveExistingField(data, bigqueryTables[table])
    })

  for (const row of rows) {
    if (typeof row.platform === 'object') {
      row.platform = JSON.stringify(row.platform)
    }
  }

  if (!['production', 'dev'].includes(process.env.NODE_ENV)) {
    for (const row of rows) {
      bigquery.validate(row, bigqueryTables[table])
    }
    console.warn(`[BigQuery Log: ${table}]`, rows.map(r => r.event_type).join(', '))
    return
  }

  try {
    bigquery.insert(config.get('bigquery.dataset'), config.get(`bigquery.table_${table}`), rows)
  } catch (e) {
    console.error(e)
  }
}

/**
 * ユーザデータ取得
 * @param req
 */
async function getUserData(req) {
  const userData = req.userData // headers['x-smooosy']
  delete userData.platform

  const browser = platform.parse(userData.user_agent)
  userData.browser_name = browser.name
  userData.browser_version = browser.version

  return userData
}
