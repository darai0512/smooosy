export async function serial(array, func) {
  if (!array || array.length === 0) return Promise.resolve([])
  const data = array.slice() // copy
  const result = []

  const next = () => {
    const d = data.shift()
    return func(d).then(res => {
      result.push(res)
      if (data.length > 0) {
        return next()
      }
      return Promise.resolve(result)
    })
  }

  return next()
}

export function reduceArray(array, max = 8 * 1024) {
  const arr = [...array]
  let size = getBytes(JSON.stringify(arr))
  while (size > max) {
    arr.shift()
    size = getBytes(JSON.stringify(arr))
  }
  return arr
}

// 文字列のバイト数取得
export function getBytes(str) {
  return encodeURIComponent(str).replace(/%../g, 'x').length
}

export function setAmpLandingPage(referrer, canonical, url) {
  const landingPage =
    /smooosy\.com/.test(referrer) ? referrer.split('smooosy.com')[1] :
    /^\/amp\//.test(canonical) ? canonical :
    url
  return landingPage
}

export function addAttributionTags(request) {
  if (!request.queryParams) {
    return
  }

  let source = request.queryParams.utm_source
  let medium = request.queryParams.utm_medium

  // We messed up and started sending two utm_source parameters in URL from ads.
  // Just get the first one.
  if (Array.isArray(source)) {
    source = source[0]
  }
  if (Array.isArray(medium)) {
    medium = medium[0]
  }


  request.tags = []

  if (source === 'yahoo' && medium === 'cpc') {
    request.tags.push('yahoo ads')
  } else if (source === 'adwords' || medium === 'cpc') {
    request.tags.push('adwords')
  } else if (source === 'email' && medium === 'newsletter') {
    request.tags.push('メール')
  }
}

export function fillDigits(numOrStr, digits, fillStr = '') {
  const filler = [...new Array(digits)].map(() => fillStr).join('')
  return (filler + numOrStr).slice(-digits)
}
