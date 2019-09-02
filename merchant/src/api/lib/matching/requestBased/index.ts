export {}
const switcher = require('../../switcher')
const shadowComparator = require('../shadowComparator')

const distanceMeetRate = require('./distanceMeetRate')
const ideal = require('./ideal')

async function findMatchingProsForRequest({
  request,
  onlyTopPros,
  matchBuckets,
  mode = switcher.Mode.SHADOW,
}) {
  // トータルマッチ数は100
  const MATCH_LIMIT = 120
  const NORMAL_LIMIT = 70 // 重み付けなし

  const matchParams = request.matchParams || {}

  const limit = matchParams.limit || MATCH_LIMIT - request.sent.length + request.passed.length
  const normalLimit = matchParams.normalLimit || Math.max(1, NORMAL_LIMIT - request.sent.length + request.passed.length)
  if (limit <= 0) return []

  const primaryMatchFunc = matchParams.useIdealMatching ? ideal : distanceMeetRate
  const shadowMatchFunc = matchParams.useIdealMatchingShadow ?
  ideal : distanceMeetRate

  const matchFunc = switcher.createSwitch(
    primaryMatchFunc,
    shadowMatchFunc,
    mode,
    shadowComparator,
    { request_id: request._id.toString() },
  )
  return matchFunc(request, onlyTopPros, limit, normalLimit, matchBuckets)
}

module.exports = findMatchingProsForRequest
