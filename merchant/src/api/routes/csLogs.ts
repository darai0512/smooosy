export {}
const { CSLog } = require('../models')

module.exports = {
  index,
  create,
  remove,
}

async function index(req, res) {
  const { user } = req.query
  const logs = await CSLog.find({user})
    .populate({path: 'caller', select: 'lastname _id'})
    .populate({path: 'profile', select: 'name _id'})
    .sort('-createdAt')
  res.json(logs)
}

async function create(req, res) {
  const logData = req.body
  logData.caller = req.user
  // noteがあって他が足りない場合はメモ扱い
  logData.isMemo = logData.note && !(logData.action && logData.result)
  let log = await CSLog.create(logData)
  log = await CSLog.populate(log, [{path: 'caller', select: 'lastname'}, {path: 'profile', select: 'name'}])

  res.json(log)
}

async function remove(req, res) {
  const log = await CSLog.findByIdAndRemove(req.params.id)
  if (!log) return res.status(404).json({message: 'not found'})
  res.send()
}
