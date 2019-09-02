export {}
const { PageLayout } = require('../models')

module.exports = {
  showForAdmin,
  createForAdmin,
  updateForAdmin,
  removeForAdmin,
}

async function showForAdmin(req, res) {
  const id = req.params.id
  const pageLayout = await PageLayout.findById(id)
  if (pageLayout === null) return res.status(404).json({message: 'not found'})
  res.json(pageLayout)
}

async function createForAdmin(req, res) {
  const body = req.body
  const pageLayout = await PageLayout.create(body)
  res.json(pageLayout)
}

async function updateForAdmin(req, res) {
  const id = req.params.id
  const body = req.body
  let pageLayout = await PageLayout.findById(id)
  if (pageLayout === null) return res.status(404).json({message: 'not found'})
  pageLayout = await PageLayout.findByIdAndUpdate(id, {$set: body})
  res.json(pageLayout)
}

async function removeForAdmin(req, res) {
  const id = req.params.id
  let pageLayout = await PageLayout.findById(id)
  if (pageLayout === null) return res.status(404).json({message: 'not found'})
  pageLayout = await PageLayout.findByIdAndRemove(id)
  res.json(pageLayout)
}
