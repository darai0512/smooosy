export {}
const moment = require('moment')
const { Thank } = require('../models')
const { addNotice } = require('./notices')

module.exports = {
  index,
  create,
  show,
}

async function index(req, res) {
  const perPage = 20
  const page = parseInt(req.query.page || '1', 10) || 1

  const total = await Thank.count({to: req.user.id})
  const received = await Thank.find({
    to: req.user.id,
  }).populate({
    path: 'from',
    select: 'lastname imageUpdatedAt',
  }).sort('-createdAt').limit(perPage).skip(perPage * (page - 1))

  const list = await listThanks(received.map(t => t.from.id), req.user)
  res.json({received, total, list})
}

async function create(req, res) {
  const today = await Thank.count({
    from: req.user.id,
    to: req.params.id,
    createdAt: {
      $gt: moment().subtract({days: 1}).toDate(),
    },
  })
  if (today) return res.status(404).json({message: 'aleady posted'})

  await Thank.create({
    from: req.user.id,
    to: req.params.id,
  })

  res.json(await listThanks([req.params.id], req.user))

  addNotice('thanks', req.params.id, {lastname: req.user.lastname})
}

async function show(req, res) {
  const ids = req.query.ids
  if (!Array.isArray(ids)) return res.json({})

  res.json(await listThanks(ids, req.user))
}

async function listThanks(ids, user) {
  const response = {}
  for (const id of ids) {
    if (response[id]) continue
    const count = await Thank.count({to: id})
    const today = await Thank.count({
      from: user ? user.id : undefined,
      to: id,
      createdAt: {
        $gt: moment().subtract({days: 1}).toDate(),
      },
    })
    response[id] = { count, today }
  }
  return response
}
