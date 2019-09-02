export {}
const moment = require('moment')

function timeRangeToHourDuration(startTime, endTime) {
  const start = moment(startTime, 'HH:mm')
  const end = moment(endTime, 'HH:mm')

  if (/翌日/.test(endTime)) {
    end.add(1, 'days')
  }

  return end.diff(start, 'minutes') / 60
}

const relativeTime = (d, target, options: any = {}) => {
  const units = {
    '秒': 1000,
    '分': 60,
    '時間':   60,
    '日':    24,
    'か月':  30,
    '年':   12,
  }

  const now = new Date()
  target = target || now
  let suffix = ''
  if (!options.noSuffix) {
    suffix = target > now ? '後' : '前'
  }
  let delta = target - d
  if (delta < units['秒']) {
    return 'たった今'
  }

  let unit = null
  for (const key in units) {
    if (delta < units[key]) {
      break
    } else {
      unit = key
      delta = delta / units[key]
    }
  }

  delta = Math.floor(delta)
  return [delta, unit, suffix].join('')
}


module.exports = {
  timeRangeToHourDuration,
  relativeTime,
}