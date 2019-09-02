export {}
const config = require('config')

module.exports = {
  image,
  setupBusinessHour,
}

function image({_id, imageUpdatedAt}) {
  return imageUpdatedAt ?
         `${config.get('bucketOrigin')}/users/${_id}.jpg?${imageUpdatedAt.getTime()}` :
         `${config.get('bucketOrigin')}/users/anonymous.png?`
}

function setupBusinessHour({schedule}) {
  return schedule && schedule.startTime !== schedule.endTime
}
