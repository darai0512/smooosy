export const relativeTime = (d, target, options = {}) => {
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
  for (var key in units) {
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

const week = ['日', '月', '火', '水', '木', '金', '土']

export const dateString = (date) => {
  return `${date.getFullYear()}年${shortDateString(date)}`
}

export const shortDateString = (date) => {
  return `${date.getMonth() + 1}月${date.getDate()}日（${week[date.getDay()]}）`
}

export const timeString = (date) => {
  return `${date.getFullYear()}年${shortTimeString(date)}`
}

export const shortTimeString = (date) => {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${week[date.getDay()]}曜日 ${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}`
}
