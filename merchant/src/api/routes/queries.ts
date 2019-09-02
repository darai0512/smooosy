export {}
const { Query, QueryHistory, Service } = require('../models')
const { S3 } = require('../lib/aws')
import {
  INCLUDE_ADMIN_FIELDS,
  createQueryWithHistory,
  updateQuery,
  getQueryHistory,
} from '../lib/queries'

module.exports = {
  index,
  create,
  show,
  update,
  remove,
  showQueryHistory,
  getTags,
  signedUrls,
}

async function index(req, res) {
  const cond: any = {}
  const { tags } = req.query

  if (tags) {
    cond.$or = [{tags: {$size: 0}}, {tags: {$in: tags}}]
  }

  const queries = await Query.find(cond).select(INCLUDE_ADMIN_FIELDS).sort({createdAt: -1})
  res.json(queries)
}

async function create(req, res) {
  req.body.auditMetadata = {
    createdBy: req.user,
  }

  const activeQuery = await createQueryWithHistory(req.body)

  res.json(activeQuery)
}

async function show(req, res) {
  const query = await Query.findOne({_id: req.params.id}).select(INCLUDE_ADMIN_FIELDS)
  if (query === null) return res.status(404).json({message: 'not found'})

  res.json(query)
}

async function update(req, res) {
  if (!req.user.admin || req.user.admin < 9) {
    return res.status(403).json({message: 'forbidden'})
  }

  req.body.options = req.body.options.map(o => ({...o, skipQueryIds: Array.from(new Set((o.skipQueryIds || []).filter(sq => sq !== '')))}))

  if (['', null].includes(req.body.priceFactorType)) {
    req.body.priceFactorType = undefined
  }

  req.body.auditMetadata = {
    createdBy: req.user,
  }

  const activeQuery = await updateQuery(req.params.id, req.body)

  if (!activeQuery) {
    return res.status(404).json({message: 'not found'})
  }

  res.json(activeQuery)
}

async function remove(req, res) {
  if (!req.user.admin || req.user.admin < 9) {
    return res.status(403).json({message: 'forbidden'})
  }

  const queryId = req.params.id
  const query = await Query.findOneAndRemove({_id: queryId})
    .select(INCLUDE_ADMIN_FIELDS)

  if (query === null) return res.status(404).json({message: 'not found'})

  // clean up query history
  const queryHistory = await QueryHistory.findOne({ activeQuery: queryId })
  await Query.deleteMany({ _id: { $in: queryHistory.queries } })
  await QueryHistory.deleteOne({ _id: queryHistory._id })

  await Service.update({}, {$pullAll: {queries: [queryId]}})
  res.json(query)
}

async function showQueryHistory(req, res) {
  const queryHistory = await getQueryHistory(req.params.queryId)

  if (!queryHistory) {
    return res.status(404).json({message: 'not found'})
  }

  res.json(queryHistory)
}

async function getTags(req, res) {
  const queries = await Query.find({}, {_id: 0, tags: 1})
  const tags = {}
  queries.forEach(e => {
    (e.tags || []).forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1
    })
  })
  res.json(Object.keys(tags).sort((a, b) => tags[a] < tags[b] ? 1 : -1))
}

async function signedUrls(req, res) {
  const ids = req.body.ids
  const urls = await Promise.all(ids.map(id => S3.getSignedUrl({key: `options/${id}.jpg`})))

  res.json(urls.reduce((ret, cur, idx) => {
    ret[ids[idx]] = cur
    return ret
  }, {}))
}
