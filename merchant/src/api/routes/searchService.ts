export {}
const { search, bulkInsert: serviceBulkInsert, initialize: serviceInitialize } = require('../lib/elasticsearch/service')

module.exports = {
  service, bulkInsert, initialize,
}

async function service(req, res) {
  const { query, from } = req.query

  const s = await search(query, from)

  res.json(s)
}

async function bulkInsert(req, res) {
  await serviceBulkInsert()

  res.send('finish')
}

async function initialize(req, res) {
  await serviceInitialize()

  res.send('finish')
}