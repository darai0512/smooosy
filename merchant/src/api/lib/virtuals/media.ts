export {}
const config = require('config')

module.exports = {
  url,
}

function url({_id, type, video, ext, updatedAt, rotation}) {
  switch (type) {
    case 'image':
      return `${config.get('bucketOrigin')}/media/${_id.toString()}.${ext || 'jpg'}?${updatedAt.getTime()}${rotation ? `&r=${rotation}` : ''}`
    case 'video':
      if (video.youtube) {
        return `//i.ytimg.com/vi/${video.youtube}/hqdefault.jpg?`
      }
      return `${config.get('bucketOrigin')}/media/noimage.png?`
    default:
      return `${config.get('bucketOrigin')}/media/noimage.png?`
  }
}
