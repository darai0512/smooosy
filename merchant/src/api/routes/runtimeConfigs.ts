export {}
const { RuntimeConfig, ProService } = require('../models')
const { BigQueryInsert } = require('./bigquery')

module.exports = {
  indexForAdmin,
  showForAdmin,
  createForAdmin,
  updateForAdmin,
  removeForAdmin,
  getActiveRuntimeConfigsForUser,
}

async function indexForAdmin(req, res) {
  const runtimeConfigs = await RuntimeConfig.find().lean({virtuals: true})
  res.json(runtimeConfigs)
}

async function showForAdmin(req, res) {
  const runtimeConfig = await RuntimeConfig.findOne({ _id: req.params.id }).populate('services', 'name').lean()
  if (!runtimeConfig) return res.status(404).json({message: 'not found'})
  res.json(runtimeConfig)
}

async function createForAdmin(req, res) {
  const exist = await RuntimeConfig.exists({ name: req.body.name })
  if (exist) return res.status(409).json({ message: 'already exist' })
  const runtimeConfig = await RuntimeConfig.create(req.body)
  BigQueryInsert(req, {
    event_type: 'runtime_config',
    event: {
      subtype: 'create',
      data: runtimeConfig,
    },
  })
  res.send('ok')
}

async function updateForAdmin(req, res) {
  const exists = await RuntimeConfig.exists({ _id: req.params.id })
  if (!exists) return res.status(404).json({ message: 'not found' })

  const runtimeConfig = await RuntimeConfig.findByIdAndUpdate(req.params.id, {$set: req.body}).lean({virtuals: true})
  BigQueryInsert(req, {
    event_type: 'runtime_config',
    event: {
      subtype: 'update',
      data: runtimeConfig,
    },
  })

  res.send('ok')
}

async function removeForAdmin(req, res) {
  BigQueryInsert(req, {
    event_type: 'runtime_config',
    event: {
      subtype: 'remove',
      data: req.query,
    },
  })

  await RuntimeConfig.remove({ _id: { $in: req.query.ids } })
  res.send()
}

async function getActiveRuntimeConfigsForUser(req, res) {
  if (!req.userData || !req.userData.instance_id) return res.json([])

  // find user's active services
  const services = await ProService.find({
    user: req.userData.user_id,
    disabled: {$ne: true},
  }).distinct('service')

  const runtimeConfigs = await RuntimeConfig.getMatchingConfigs({ services, admin: req.user && req.user.admin > 0 })

  res.json(runtimeConfigs.map(rc => RuntimeConfig.toUserJSON(rc)))
}
