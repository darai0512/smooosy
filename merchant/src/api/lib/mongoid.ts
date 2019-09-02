export {}
const Buffer = require('buffer').Buffer
const { compObjRefs } = require('./util')

module.exports = {
  shortIdToMongoId,
  mongoIdToShortId,
  oidIncludes,
}

function shortIdToMongoId(shortId) {
  return Buffer.from(shortId.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex')
}

function mongoIdToShortId(mongoId) {
  return Buffer.from(mongoId.toString(), 'hex').toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
}

function oidIncludes(ids, id) {
  return ids.some(i => compObjRefs(i, id))
}