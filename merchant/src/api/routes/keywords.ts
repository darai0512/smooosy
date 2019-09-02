export {}
const { Keyword, FormattedRequest } = require('../models')

module.exports = {
  index,
  indexForAdmin,
  create,
  update,
  remove,
  // func
  updateKeywordCount,
}

async function index(req, res) {
  const keywords = await Keyword.find().sort({path: 1})

  res.json(keywords)
}

async function indexForAdmin(req, res) {
  const keywords = await Keyword
    .find()
    .populate({
      path: 'service',
      select: 'name key tags',
    })
    .sort({createdAt: -1})

  res.json(keywords)
}

async function create(req, res) {
  const keyword = await Keyword.create(req.body)
  res.json(keyword)

  await updateKeywordCount()
}

async function update(req, res) {
  let keyword = await Keyword.findOne({_id: req.params.id})
  if (keyword === null) return res.status(404).json({message: 'not exists'})

  req.body.path = (req.body.path || []).join(',')
  keyword = await Keyword.findByIdAndUpdate(keyword.id, {$set: req.body})
  res.json(keyword)

  await updateKeywordCount()
}

async function remove(req, res) {
  const ids = req.body.ids

  await Keyword.remove({_id: {$in: ids}})
  res.json({})
}

async function updateKeywordCount() {
  const keywords = await Keyword.find()
  for (const keyword of keywords) {
    const $regex = new RegExp(keyword.word.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').split(/[\s\u3000]/).join('|'))
    const count = await FormattedRequest.count({
      service: keyword.service,
      $or: [
        { title: { $regex } },
        { 'meets.chats.text': { $regex } },
      ],
    })
    await Keyword.findByIdAndUpdate(keyword.id, {$set: {count}})
  }
}
