export {}
const { SearchCondition } = require('../models')

module.exports = {
  create,
  index,
  remove,
}

async function create(req, res) {
  const data = req.body
  data.user = req.user
  await SearchCondition.create(data)
  const conditions = await SearchCondition.find({user: req.user.id, type: data.type})
  res.json(conditions)
}

async function index(req, res) {
  const conds = await SearchCondition.find({user: req.user.id, type: req.query.type})
  res.json(conds)
}

async function remove(req, res) {
  const cond = await SearchCondition.findById(req.params.id)
  if (!cond) return res.status(404).json({message: 'not found'})
  await cond.remove()
  const conditions = await SearchCondition.find({user: req.user.id, type: cond.type})
  res.json(conditions)
}