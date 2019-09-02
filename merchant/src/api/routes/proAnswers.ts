export {}
const { ProQuestion, ProAnswer } = require('../models')

module.exports = {
  update,
  updateForAdmin,
}

async function update(req, res) {
  const proQuestions = req.body.proQuestions
  const profile = req.body.profile
  for (const pq of proQuestions) {
    let proanswer = null
    if (pq.text && pq.text !== '') {
      proanswer = await ProAnswer.findOneAndUpdate(
        { proQuestion: pq.id, profile: profile.id },
        {
          $set: {
            proQuestion: pq.id,
            service: pq.service,
            profile: profile.id,
            pro: profile.pro.id,
            text: pq.text,
            loc: profile.loc,
            prefecture: profile.prefecture,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
      )
      if (proanswer) {
        const publishedCount = await ProAnswer.count({ proQuestion: pq.id, isPublished: true })
        await ProQuestion.update(
          { _id: pq.id },
          { $addToSet: { proAnswers: proanswer.id }, $set: { publishedProAnswerCount: publishedCount } },
        )
      }
    } else {
      // 空の場合は消す
      proanswer = await ProAnswer.findOneAndRemove({ proQuestion: pq.id, profile: profile.id })
      if (proanswer) {
        const publishedCount = await ProAnswer.count({ proQuestion: pq.id, isPublished: true })
        await ProQuestion.update(
          { _id: pq.id },
          { $pull: { proAnswers: proanswer.id }, $set: { publishedProAnswerCount: publishedCount } },
        )
      }
    }
  }

  res.json()
}

async function updateForAdmin(req, res) {
  let proanswer = await ProAnswer.findOne({_id: req.params.id})
  if (proanswer === null) return res.status(404).json({message: 'not found'})
  proanswer = await ProAnswer.findByIdAndUpdate(proanswer.id, {$set: req.body})
  const publishedCount = await ProAnswer.count({ proQuestion: proanswer.proQuestion})
  await ProQuestion.findByIdAndUpdate(proanswer.proQuestion, {$set: {publishedProAnswerCount: publishedCount}})
  res.json(proanswer)
}
