export {}
const { Memo } = require('../models')

module.exports = {
  indexForAdmin,
  createForAdmin,
  removeForAdmin,
}

async function indexForAdmin(req, res) {
  const memos = await Memo.find({item: req.query.item}).sort('-createdAt').lean()
  res.json(memos)
}


async function createForAdmin(req, res) {
  req.body.username = req.user.lastname
  const memo = await Memo.create(req.body)
  res.json(memo)
}

async function removeForAdmin(req, res) {
  const memo = await Memo.findByIdAndRemove(req.params.id)
  if (memo === null) return res.status(404).json({message: 'not found'})
  res.json({})
}
