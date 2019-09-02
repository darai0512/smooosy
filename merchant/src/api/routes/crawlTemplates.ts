export {}
const { CrawlTemplate } = require('../models')

module.exports = {
  index,
  create,
  show,
  update,
  remove,
}

async function index(req, res) {
  const crawlTemplates = await CrawlTemplate.find().sort('-createdAt')
  res.json(crawlTemplates)
}

async function create(req, res) {
  const crawlTemplate = await CrawlTemplate.create({
    name: `クロール ${new Date().toLocaleString()}`,
    actions: [],
  })

  res.json(crawlTemplate)
}

async function show(req, res) {
  const crawlTemplate = await CrawlTemplate.findOne({_id: req.params.id})
  if (crawlTemplate === null) return res.status(404).json({message: 'not found'})

  res.json(crawlTemplate)
}

async function update(req, res) {
  let crawlTemplate = await CrawlTemplate.findOne({_id: req.params.id})
  if (crawlTemplate === null) return res.status(404).json({message: 'not found'})

  const body = {}
  for (const key of ['name', 'baseUrl', 'actions', 'script', 'source']) {
    body[key] = req.body[key]
  }
  crawlTemplate = await CrawlTemplate.findByIdAndUpdate(crawlTemplate.id, {$set: body})

  res.json(crawlTemplate)
}

async function remove(req, res) {
  await CrawlTemplate.remove({_id: req.params.id})
  index(req, res)
}
