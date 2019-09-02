export {}
const { MeetTemplate } = require('../models')

module.exports = {
  index,
  increment,
  indexForAdmin,
  showForAdmin,
  addForAdmin,
  updateForAdmin,
  removeForAdmin,
}

async function index(req, res) {
  if (!req.query.service) return res.status(404).json({message: 'not found'})

  const meetTemplates = await MeetTemplate.find({service: req.query.service, isPublished: true})
  res.json(meetTemplates)
}

async function increment(req, res) {
  if (!req.params.id) return res.status(404).json({message: 'not found'})

  let meetTemplate = await MeetTemplate.findOne({_id: req.params.id})
  if (meetTemplate === null) return res.status(404).json({message: 'not found'})

  meetTemplate = await MeetTemplate.findByIdAndUpdate(meetTemplate.id, { $inc: { usedCount: 1 } })
  res.json(meetTemplate)
}

async function indexForAdmin(req, res) {
  const meetTemplates = await MeetTemplate.find()
  res.json(meetTemplates)
}

async function showForAdmin(req, res) {
  if (!req.params.id) return res.status(404).json({message: 'not found'})

  const meetTemplate = await MeetTemplate.findOne({_id: req.params.id})
    .populate({
      path: 'service',
      select: 'name',
    })
  if (meetTemplate === null) return res.status(404).json({message: 'not found'})

  res.json(meetTemplate)
}

async function addForAdmin(req, res) {
  if (!req.body) return res.status(404).json({message: 'not found'})

  const meetTemplate = await MeetTemplate.create(req.body)
  res.json(meetTemplate)
}

async function updateForAdmin(req, res) {
  if (!req.params.id) return res.status(404).json({message: 'not found'})

  let meetTemplate = await MeetTemplate.findOne({_id: req.params.id})
  if (meetTemplate === null) return res.status(404).json({message: 'not found'})

  meetTemplate = await MeetTemplate.findByIdAndUpdate(meetTemplate.id, {$set: req.body})
  res.json(meetTemplate)
}

async function removeForAdmin(req, res) {
  if (!req.params.id) return res.status(404).json({message: 'not found'})

  const meetTemplate = await MeetTemplate.findOne({_id: req.params.id})
  if (meetTemplate === null) return res.status(404).json({message: 'not found'})
  await MeetTemplate.findByIdAndRemove(meetTemplate.id)
  res.json()
}
