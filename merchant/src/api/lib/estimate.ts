export {}
const redis = require('../lib/redis')

module.exports = {
  saveMeetEstimation,
  getMeetEstimation,
}

async function saveMeetEstimation(serviceId, meetEstimation) {
  redis.set(`meetEstimation-${serviceId}`, JSON.stringify(meetEstimation))
}

async function getMeetEstimation(serviceId) {
  const meetEstimation = await redis.getAsync(`meetEstimation-${serviceId}`)
  return JSON.parse(meetEstimation || '{}')
}