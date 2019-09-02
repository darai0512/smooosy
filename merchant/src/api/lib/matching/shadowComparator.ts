export {}
const isEqual = require('lodash.isequal')
const logger = require('../logger')

function shadowComparator(primaryProfiles, shadowProfiles, context) {
  const primaryIds = primaryProfiles.map(p => p._id.toString()).sort()
  const shadowIds = shadowProfiles.map(p => p._id.toString()).sort()

  if (isEqual(primaryIds, shadowIds)) {
    return
  }

  logger.warn('mismatch between profile and proservice classic matching', {
    primaryIds,
    shadowIds,
    context,
  })
}

module.exports = shadowComparator