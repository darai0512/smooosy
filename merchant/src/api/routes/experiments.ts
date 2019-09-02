export {}
const { Experiment } = require('../models')
const { BigQueryInsert } = require('./bigquery')

module.exports = {
  indexForAdmin,
  showForAdmin,
  createForAdmin,
  updateForAdmin,
  removeForAdmin,
  getActiveExperimentsForUser,
}

async function indexForAdmin(req, res) {
  const experiments = await Experiment.find()
  res.json(experiments)
}

async function showForAdmin(req, res) {
  const experiment = await Experiment.findOne({ _id: req.params.id })
  if (!experiment) return res.status(404).json({message: 'not found'})
  res.json(experiment)
}

async function createForAdmin(req, res) {
  const exist = await Experiment.findOne({ name: req.body.name })
  if (exist) return res.status(400).json({ message: 'already exist' })
  const experiment = await Experiment.create(req.body)
  res.json(experiment)
}

async function updateForAdmin(req, res) {
  const experiment = await Experiment.findOne({ _id: req.params.id })
  if (experiment === null) return res.status(404).json({ message: 'not found' })

  experiment.set(req.body)
  res.json(await experiment.save())
}

async function removeForAdmin(req, res) {
  await Experiment.remove({ _id: { $in: req.body } })
  res.json()
}

// Get a user's active experiments
// Flow:
// 1). get all currently active experiments
// 2). see which ones the user is eligible for
// 3). see what bucket the user falls into for each one
async function getActiveExperimentsForUser(req, res) {
  // IE8とBingBotでinstance_idが生成されない
  if (!req.userData || !req.userData.instance_id) return res.json([])

  const activeExperiments = await Experiment.find({
    isActive: true,
    startAt: { $lte: new Date() },
    endAt: { $gte: new Date() },
  })

  const eligibleExperiments = activeExperiments.map(exp => {
    return {
      name: exp.name,
      bucket: exp.getBucketNameForUser({
        instanceId: req.userData.instance_id,
        platform: req.userData.platform,
        url: req.get('Referrer'),
      }),
    }
  }).filter(exp => exp.bucket)

  BigQueryInsert(req, {
    event_type: 'get_active_experiments',
    event: JSON.stringify({
      experimentBuckets: eligibleExperiments,
    }),
  })

  res.json(eligibleExperiments)
}
