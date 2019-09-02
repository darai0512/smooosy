export {}
const axios = require('axios')
const iconv = require('iconv-lite')
const config = require('config')
const fs = require('fs')
const murmurHash = require('./murmurHash')
const path = require('path')
const qs = require('qs')
const url = require('url')
const xml2js = require('xml2js')
const { prefectures } = require('@smooosy/config')

module.exports = {
  sleep,
  shuffle,
  slack,
  escapeHTML,
  emailCheckExist,
  fixEmail,
  regexpEscaper,
  getCityData,
  shiftjis2utf8,
  matchers: {
    exact: matchExact,
    prefix: matchPrefix,
    suffix: matchSuffix,
    partial: matchPartial,
    regexp: matchRegExp,
  },
  getIP,
  industries_to_serviceIds,
  splitArrayArgs,
  splitSteps,
  getEmotion,
  loadXml,
  getQueryParams,
  hashToBucket,
  safeTraverse,
  compObjRefs,
  arrayIntersection,
}

function sleep(duration = 500) {
  return new Promise(resolve => setTimeout(resolve, duration))
}

function shuffle(array) {
  let i, n = array.length

  while (n) {
    i = Math.floor(Math.random() * n--)
    ;[array[n], array[i]] = [array[i], array[n]]
  }

  return array
}


function slack(e) {
  console.error(e)
}

function escapeHTML (string) {
  if (typeof string !== 'string') return string

  return string.replace(/[&'"<>]/g, (match) => {
    return {
      '&': '&amp;',
      '\'': '&#x27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
    }[match]
  })
}

async function emailCheckExist(email, isStrict) {
  const mailCheckOrigin = config.get('mailCheckOrigin')
  const mailCheckClient = require('axios').create({
    baseURL: `${mailCheckOrigin}/api`,
    timeout: 5000,
  })
  const res = await mailCheckClient.post('/isValidEmail', {email})
    .then(res => res.data)
    .catch(() => isStrict ? false : true) // timeout時はチェックしない
  return res
}

function fixEmail(email) {
  try {
    // たまにdecodeエラーが出るので。。。
    email = decodeURI(email)
    // 全角to半角
    email = email.replace(/[Ａ-Ｚａ-ｚ０-９＠．]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    // 余分な文字列を排除
    email = email.replace(/^[mM]ail(to)?:/, '').replace(/[,:;\/]/g, '').replace(/[\n\s\t\r\f]/g, '').trim().replace(/(.*<|>.*|\.$)/g, () => '')
    // 末尾修正
    email = email.replace(/(co\.j$|ne\.j)$/, (pat, rep) => rep + 'p')
    // エンコードされている空白と?以降を削除
    email = email.trim().replace('%20', '').split('?')[0]
    return email
  } catch (e) {
    email = ''
    return email
  }
}

function regexpEscaper(str) {
  return (str || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

async function getCityData() {
  const cityData = []
  const requests = []
  for (let i = 1; i <= 47; i++) {
    const urlJP = 'http://www.land.mlit.go.jp/webland/api/CitySearch?area=' + ('0' + i).slice(-2)
    const urlEN = 'http://www.land.mlit.go.jp/webland_english/api/CitySearch?area=' + ('0' + i).slice(-2)
    requests.push(axios.get(urlJP))
    requests.push(axios.get(urlEN))
  }
  let results
  try {
    results = await Promise.all(requests)
  } catch (e) {
    return []
  }

  for (let i = 0; i < 47; i++) {
    if (!results) continue
    const resJP = results[i * 2]
    const resEN = results[i * 2 + 1]
    if (resJP.data.status === 'OK' && resEN.data.status === 'OK') {
      for (const j in resEN.data.data) {
        cityData.push({
          key: resEN.data.data[j].name.split(' ')[0].toLowerCase(),
          name: resJP.data.data[j].name,
          code: resEN.data.data[j].id,
          prefecture: Object.keys(prefectures)[i],
        })
      }
    }
  }

  return cityData
}

function shiftjis2utf8(str) {
  str = str || ''
  return iconv.decode(Buffer.from(str, 'binary'), 'shift-jis')
}


function matchExact(str) {
  str = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&')
  return new RegExp(`^${str}$`)
}

function matchPrefix(str) {
  str = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&')
  return new RegExp(`^${str}`)
}

function matchSuffix(str) {
  str = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&')
  return new RegExp(`${str}$`)
}

function matchPartial(str) {
  str = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&')
  return new RegExp(str)
}

function matchRegExp(str) {
  let regexp = new RegExp('')
  try {
    regexp = new RegExp(str)
  } catch (e) {
    console.error('matchRegExp不適切な正規表現です', e)
  }
  return regexp
}

/**
 * IP取得
 * @param req expressのreq
 * @returns string or undefined
 */
function getIP(req) {
  if (!req) return
  return req.ip || (req.connection || {}).remoteAddress
}

function industries_to_serviceIds(industries) {
  try {
    const datas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'industry_service_table.json'), {encoding: 'utf-8'}))
    const services = [].concat(...industries.map(i => {
      const d = datas.find(d => d.industry === i)
      return d && d.services
    }))
    return services.filter(s => s)
  } catch (e) {
    return []
  }
}

/*
 * split array arguments with limit
 * and execute serial
 */
function splitArrayArgs(func, limit) {
  return function f(array) {
    if (array.length > limit) {
      return f(array.slice(0, limit)).then(() => {
        return f(array.slice(limit))
      })
    }

    return func(array)
  }
}

function splitSteps({start, end, step}) {
  if (start > end) return []

  const howManyCrawls = Math.ceil((end + 1 - start) / step / 10)
  return [...Array(howManyCrawls)].map((_, i) => ({
    start: start + i * step * 10,
    end: Math.min(start + (i + 1) * step * 10 - 1, end),
    step,
  }))
}

async function getEmotion(text) {
  // お金かかるので本番のみ
  if (process.env.NODE_ENV !== 'production') return null

  const body = {
    'document': {
      'language': 'JA',
      'type': 'PLAIN_TEXT',
      'content': text,
    },
    'encodingType': 'NONE',
  }
  const emotion = await axios.post(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${config.get('google.apiKey')}`, body).catch(e => e)
  if (!emotion.data) return null

  return emotion.data.documentSentiment.score
}

function loadXml(filename) {
  try {
    const xml = fs.readFileSync(filename, 'utf-8')
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  } catch (e) {
    return Promise.reject(new Error(`${filename}の読み込みに失敗しました`))
  }
}

function getQueryParams(request) {
  if (!request.stack || !request.stack.length) {
    return null
  }

  return qs.parse(url.parse(request.stack[0]).query)
}

function hashToBucket(input, salt, bucketRange) {
  return murmurHash(input + salt) % bucketRange
}

function safeTraverse(obj, ret) {
  return ret.reduce((o, idx) => (o && o[idx]) ? o[idx] : null, obj)
}

function compObjRefs(a, b) {
  return a && b && (a._id || a).toString() === (b._id || b).toString()
}

function arrayIntersection(a, b, comparator = (a, b) => a === b) {
  return b.filter(i => a.some(ai => comparator(ai, i)))
}
