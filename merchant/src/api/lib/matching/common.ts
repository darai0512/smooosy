export {}
const { compObjRefs } = require('../util')
const moment = require('moment')
const { Meet, MatchExclusive, ProService, RuntimeConfig } = require('../../models')
import { BEARS_PROFILE_ID } from '../profiles'

// this function has a side-effect
// options of queries will be changed
function injectDescriptionIntoQueries(description, queries) {
  for (const q of queries) {
    // ignore queries not related pricing or filtering
    if (!q.usedForPro && !q.priceFactorType) continue

    q.answers = []

    const checked = description.find(d => compObjRefs(d.query, q))

    for (const o of q.options) {
      // find answer from request.description
      const answer = checked ? checked.answers.find(a => compObjRefs(a.option, o)) : null
      if (!answer) continue
      if (answer.checked || answer.number) o.checked = true
      if (answer.number) o.number = answer.number

      q.answers.push(o)
    }
  }
}

async function getRecentMeetsPro(request) {
  // この依頼者に1ヶ月以内に応募しているプロはマッチしない
  return await Meet.find({
    customer: request.customer._id,
    createdAt: { $gt: moment().subtract(1, 'month').toDate() },
    refund: {$ne: true},
  }).distinct('pro')
}

async function getExcludedPro(r) {
  const exclusives = await MatchExclusive.find({request: r._id}).select('profile').populate({path: 'profile', select: 'pro'}).lean()
  return exclusives.map(ex => ex.profile.pro)
}

async function getBaseQuery(r, excludedIds = []) {
  const recentMeetsPro = await getRecentMeetsPro(r)
  const excludedPro = await getExcludedPro(r)
  const baseQuery = {
    user: { $nin: [
      r.customer._id, // 本人じゃない
      ...r.sent.map(p => p.pro), // 送信済み
      ...r.meets.map(m => m.pro), // 応募済み
      ...r.pendingMeets.map(m => m.pro), // MatchMore除外
      ...excludedPro, // 除外済み
      ...recentMeetsPro, // 最近応募済み
      ...excludedIds,
    ] },
    service: r.service._id, // サービス一致
    disabled: { $ne: true },
  }
  return baseQuery
}

function getOnlyProQuestions(description) {
  return description.filter(
    q => q.usedForPro && q.options.some(q => q.checked)
  ).map(
    q => ({
      ...q,
      answers: q.options.filter(a => a.usedForPro && a.checked),
    })
  ).filter(q => q.answers.length)
}


/*
 * ベアーズ特別対応
 * 特殊プロは全ての依頼にマッチさせる
 */
async function findSpecialCompanyProService(baseQuery) {
  const enabled = await RuntimeConfig.getBoolValue('bears_match_all')
  if (!enabled) return null

  const proService = await ProService.findOne({
    ...baseQuery,
    profile: BEARS_PROFILE_ID,
  })
    .select('user profile jobRequirements')
    .populate({
      path: 'profile',
    })
    .lean()
  if (!proService) return null

  return proService
}

module.exports = {
  injectDescriptionIntoQueries,
  getOnlyProQuestions,
  getBaseQuery,
  findSpecialCompanyProService,
}
