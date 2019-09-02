export {}
const elasticsearch = require('../lib/elasticsearch')

module.exports = {
  rebuild,
  users,
  services,
}

async function rebuild(req, res) {
  const { index } = req.body
  if (!elasticsearch[index]) return res.status(404).json({message: 'not found'})

  await elasticsearch[index].initialize()
  await elasticsearch[index].bulkInsert()

  res.json()
}

async function users(req, res) {
  const { query, from, limit } = req.query

  const s = await elasticsearch.users.search({query, from, limit})
  res.json(s)
}

async function services(req, res) {
  const { query, from, limit } = req.query

  const s = await elasticsearch.services.search({query, from, limit})
  res.json(s)
}