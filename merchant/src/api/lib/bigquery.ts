export {}
const config = require('config')
const BigQuery = require('@google-cloud/bigquery')

// BigQueryクライアント
const bigquery = BigQuery({
  projectId: config.get('bigquery.projectId'),
  credentials: config.get('bigquery.credentials'),
})


/**
 * バリデーションチェック
 * @param row BigQueryレコード
 * @param table BigQueryテーブル
 * @returns 成功、失敗
 */
function validate(row, table) {
  const fields = table.schema.fields
  for (const field of fields) {

    // 必須チェック
    if (field.mode === 'REQUIRED' && (row[field.name] === void 0 || row[field.name] === null)) {
      throw new Error(`BigQuery REQUIRED param "${field.name}" is not found`)
    }

    for (const key in row) {
      const val = row[key]
      if (row.hasOwnProperty(key)) {
        // 型チェック
        if (field.name === key && val &&
          ((field.type === 'STRING' && typeof val !== 'string')
          || (field.type === 'TIMESTAMP' && new Date(val).toString() === 'Invalid Date')
          || (field.type === 'BOOLEAN' && typeof val !== 'boolean')
          || (field.type === 'FLOAT' && typeof val !== 'number')
          || (field.type === 'INTEGER' && typeof val !== 'number'))
        ) {
          throw new Error(`BigQuery REQUIRED param "${field.name}" has wrong type "${typeof val}"`)
        }
      }
    }
  }

  return true
}

function leaveExistingField(row, table) {
  const fields = table.schema.fields
  const keys = fields.map(f => f.name)
  const data = {}
  Object.keys(row).forEach(k => {
    if (keys.includes(k)) {
      data[k] = row[k]
    }
  })
  return data
}


// クエリでの検索、主にSELECT用
function query(query, params, useLegacySql = false) {

  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: query,
    params,
    useLegacySql: useLegacySql, // true:レガシーSQL、false:標準SQLを使う(クエリ上限あり)
  }


  return bigquery
    .query(options)
    .then((results) => {
      const rows = results[0]
      return rows
    })
    .catch((err) => {
      throw err
    })
}

// データ挿入
const BQ_MAX = 10000
function insert(dataset, table, rows) {
  // 10000を超える場合10000までとそれ以降に分離
  if (rows.length > BQ_MAX) {
    return insert(dataset, table, rows.slice(0, BQ_MAX)).then(ret1 => {
      return insert(dataset, table, rows.slice(BQ_MAX)).then(ret2 => {
        return [...ret1, ...ret2]
      })
    })
  }

  return bigquery
    .dataset(dataset)
    .table(table)
    .insert(rows)
    .then(() => rows)
    .catch((e) => {
      console.log(e)
      console.error('BigQuery Inserted Failed:', JSON.stringify(rows))
      if (e.response && e.response.insertErrors) {
        for (const err of e.response.insertErrors) {
          console.error(err.errors || err)
        }
      }
    })
}

module.exports = {
  validate,
  leaveExistingField,
  query,
  insert,
}

