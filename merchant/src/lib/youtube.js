export function parseVideoId(youtubeUrl) {
  var videoId

  if (youtubeUrl.includes('youtube.com')) {
    videoId = youtubeUrl.split('v=')[1]
  } else if (youtubeUrl.includes('youtu.be')) {
    videoId = youtubeUrl.split('youtu.be/')[1].substr(0, 11)
  }

  if (!videoId) {
    return null
  }

  var ampersandPosition = videoId.indexOf('&')
  if (ampersandPosition != -1) {
    videoId = videoId.substring(0, ampersandPosition)
  }

  return videoId
}