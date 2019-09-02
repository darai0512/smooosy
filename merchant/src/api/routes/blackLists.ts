export {}
const { BlackList } = require('../models')

module.exports = {
  index,
  create,
  update,
  remove,
}

async function index(req, res) {
  const blacklists = await BlackList.find()
  res.json(blacklists)
}

async function create(req, res) {
  const blacklist = await BlackList.create(req.body)
  res.json(blacklist)
}

async function update(req, res) {
  let blacklist = await BlackList.findOne({_id: req.params.id})
  if (blacklist === null) return res.status(404).json({message: 'not found'})
  blacklist = await BlackList.findByIdAndUpdate(blacklist.id, {$set: req.body})
  res.json(blacklist)
}

async function remove(req, res) {
  const blacklist = await BlackList.findOne({_id: req.params.id})
  if (blacklist === null) return res.status(404).json({message: 'not found'})
  const id = blacklist.id
  await BlackList.findByIdAndRemove(id)
  res.json({id})
}