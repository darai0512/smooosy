export {}
const { Feedback, Request, Profile } = require('../models')
const { slack } = require('../lib/util')
const { webOrigin } = require('@smooosy/config')

module.exports = {
  create,
  indexForAdmin,
  createForAdmin,
  updateForAdmin,
}

async function create(req, res) {
  // 提案を受け付けるだけなのでエラーは返さない
  if (!req.body.text || !req.body.text.trim()) return res.json({})

  const [ request, profile ] = await Promise.all([
    Request.findOne({_id: req.body.request})
    .select('service customer category')
    .populate({
      path: 'service',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    }),
    Profile.findOne({_id: req.body.profile})
    .select('name pro'),
  ])
  if (request === null || profile === null) return res.json({})

  const feedback = await Feedback.create({
    request: request.id,
    service: request.service.id,
    profile: profile.id,
    pro: profile.pro,
    customer: request.customer.id,
    text: req.body.text,
    type: req.body.type,
  })

  const message = `:thinking_face: 【提案】${request.service.name}への意見 by ${profile.name}\n${request.customer.lastname}様の依頼 ${webOrigin}/tools/#/stats/requests/${feedback.request}\n${feedback.text}`
  await slack({message, room: 'cs'})

  return res.json({})
}

async function indexForAdmin(req, res) {
  const cond: any = {}
  if (req.query.pro) cond.pro = req.query.pro
  if (req.query.service) cond.service = req.query.service
  if (req.query.notresolved) cond.resolved = { $ne: true }
  const feedbacks = await Feedback
    .find(cond)
    .populate({
      path: 'profile',
      select: 'name',
    })
    .populate({
      path: 'customer',
      select: 'lastname',
    })
    .populate({
      path: 'service',
      select: 'name category',
    })
    .sort('-createdAt')

  res.json(feedbacks)
}

async function createForAdmin(req, res) {
  const feedback = await Feedback.create(req.body)
  res.json(feedback)
}

async function updateForAdmin(req, res) {
  const feedback = await Feedback.findOne({_id: req.params.id})
  if (feedback === null) return res.status(404).json({message: 'not found'})

  Object.keys(req.body).forEach(prop => (feedback[prop] = req.body[prop]))
  await feedback.save()

  res.json(feedback)

}
