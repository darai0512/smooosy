export function priceFormat({price, priceType}) {
  //    'fixed', 'hourly', 'float', 'needMoreInfo', 'tbd', 'minimum',
  if (priceType === 'needMoreInfo') {
    return '追加情報が必要です'
  } else if (priceType === 'tbd') {
    return '価格未定'
  }
  const prefix = {
    hourly: '時給',
    float: '参考価格',
  }[priceType] || ''

  const suffix = {
    minimum: '〜',
  }[priceType] || ''

  return `${prefix}${parseInt(price).toLocaleString()}円${suffix}`
}

export function zenhan(str) {
  str = str || ''
  return str.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 65248))
}

export function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const c = (hash & 0x00FFFFFF)
      .toString(16)
      .toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

export function removeUselessWhiteSpaces(str) {
  return str
    .trim()
    // half-width and full-width white-space
    .replace(/[\x20\u2002-\u200B\u202F\u205F\u3000\uFEFF\uDB40\uDC20]+/g, ' ')
    // multiple new lines to single
    .replace(/\n[\s]+/g, '\n')
}