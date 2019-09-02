export {}
const { ProQuestion, ProAnswer, Service, Profile } = require('../models')

module.exports = {
  showForPro,
  indexForAdmin,
  createForAdmin,
  showForAdmin,
  updateForAdmin,
  removeForAdmin,
}

async function showForPro(req, res) {
  const profileId = req.params.profileId
  if (!profileId) return res.status(404).json({message: 'not found'})
  const profile = await Profile.findOne({_id: profileId})
    .populate({
      path: 'services',
      select: 'proQuestions',
      populate: {
        path: 'proQuestions',
        match: {isPublished: true},
        select: {text: 1, isPublished: 1, proAnswers: 1 },
        populate: {
          path: 'proAnswers',
          match: { profile: profileId },
          select: 'profile text',
        },
      },
    })
  if (!profile) return res.status(404).json({message: 'not found'})

  // サービスのプロ向け質問を配列に格納
  const proQuestions = []
  const proQuestionIds = {}
  for (const service of profile.services) {
    if (!service.proQuestions || service.proQuestions.length === 0) continue

    for (const pq of service.proQuestions) {
      if (proQuestionIds[pq.id]) continue
      proQuestionIds[pq.id] = true

      proQuestions.push({
        id: pq.id,
        text: pq.text,
        isPublished: pq.isPublished,
        answer: pq.proAnswers.length > 0 ? pq.proAnswers[0].text : undefined,
      })
    }
  }

  res.json(proQuestions)
}

async function indexForAdmin(req, res) {
  const cond: any = {}
  const { tags } = req.query

  if (tags) {
    cond.$or = [{tags: {$size: 0}}, {tags: {$in: tags}}]
  }

  const proQuestions = await ProQuestion.find(cond).sort({createdAt: -1})
  res.json(proQuestions)
}

async function createForAdmin(req, res) {
  const proQuestion = await ProQuestion.create(req.body)
  res.json(proQuestion)
}

async function showForAdmin(req, res) {
  const proQuestion = await ProQuestion.findOne({_id: req.params.id})
    .populate({
      path: 'proAnswers',
      populate: {
        path: 'profile',
        match: {
          hideProfile: { '$ne': true },
          suspend: { '$exists': false },
          deactivate: { '$ne': true },
        },
        select: 'name address',
      },
    })
  if (proQuestion === null) return res.status(404).json({message: 'not found'})
  proQuestion.proAnswers = proQuestion.proAnswers.filter(pa => pa.profile)

  res.json(proQuestion)
}

async function updateForAdmin(req, res) {
  let proQuestion = await ProQuestion.findOne({_id: req.params.id})
  if (proQuestion === null) return res.status(404).json({message: 'not found'})

  proQuestion = await ProQuestion.findByIdAndUpdate(proQuestion.id, {$set: req.body})
  res.json(proQuestion)
}

async function removeForAdmin(req, res) {
  const proQuestionId = req.params.id
  await ProAnswer.remove({ proQuestion: proQuestionId })
  const proQuestion = await ProQuestion.findOneAndRemove({_id: proQuestionId})
  if (proQuestion === null) return res.status(404).json({message: 'not found'})

  await Service.update({}, {$pullAll: {proQuestions: [proQuestionId]}})
  res.json(proQuestion)
}
