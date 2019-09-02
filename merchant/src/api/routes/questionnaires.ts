export {}
const config = require('config')
const bigquery = require('../lib/bigquery')
const uuidv4 = require('uuid/v4')

module.exports = {
  insert,
}

async function insert(req, res) {
  const data = req.body
  if (!data.name || !data.type || !data.answers) res.status(404).json({message: 'not found'})

  BigQueryInsert(req, data)
  res.json({})
}

async function BigQueryInsert(req, data) {
  if (!req.userData) return

  // obj => array
  const rows = Array.isArray(data) ? data : [data]

  const userData = req.userData

  const bqRows = []
  const timestamp = new Date()
  for (const row of rows) {
    const id = uuidv4()
    for (const ans of row.answers) {
      bqRows.push({
        name: row.name,
        answer: ans,
        type: row.type,
        text: ans === 'その他' ? row.text : null,
        timestamp,
        id,
        various: row.various ? JSON.stringify(row.various) : null,
        user_id: userData.user_id,
        instance_id: userData.instance_id,
      })
    }
  }

  if (!['production', 'dev'].includes(process.env.NODE_ENV)) {
    console.warn('[BigQuery Log][Questionnaire]', bqRows.map(r => r.name).join(', '))
    return
  }

  try {
    bigquery.insert(config.get('bigquery.dataset'), config.get('bigquery.table_questionnaire'), bqRows)
  } catch (e) {
    console.error(e)
  }
}
