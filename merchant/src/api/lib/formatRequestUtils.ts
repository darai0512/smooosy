export {}
// This module contains utilities related to formatted requests:
// 1). identifying whether a request is a candidate for formatting
// 2). anonymizing a request

// Mecab is used to parse Japanese sentences
const Mecab = require('mecab-async')

// Set the `mecab` command-line tool to use this dictionary because
// it's better at handling names.
// TODO: maybe put the path to dictionary into an environment variable
const mecabDicDir = require('config').get('mecabDicDir')
Mecab.command = `mecab -d ${mecabDicDir}/mecab-ipadic-neologd`

// Redactor redacts things like numbers and emails.
const redactor = require('redact-pii')({
  XXX: /\b\d{1,3}(,\d{3})+\b/g,
  phoneNumber: /\b0\d{1,4}-\d{1,4}-\d{4}\b/g,
  zipCode: /\b\d{3}-\d{4}\b/g,
  zipcode: false,
  digits: false,
  url: false,
})

// filterRequest returns true/false to indicate whether
// a request should be chosen for formatting.
const LIMIT = 1
async function shouldFormatRequest(request, lookupTable) {
  return LIMIT > (lookupTable[keyForTable(request)] || 0)
}

// makeLookupTable takes all the given requests and makes a
// lookup table (with frequencies) based on service ID,
// prefecture and city.
function makeLookupTable(formattedRequests) {
  const lookupTable = {}

  formattedRequests.forEach(r => incrementLookupTable(r, lookupTable))

  return lookupTable
}

function keyForTable(request) {
  return `${request.service}:${request.prefecture}:${request.city}`
}

const figureOfSpeechMap = {
  '固有名詞': {
    '人名': '〇〇',
  },
}

function anonymize(text) {
  // anonymize names
  const result = Mecab.parseSync(text)

  const reconstructedResult = result.map(function eachResult(r) {
    if (r[0] === 'EOS') return '\n'

    const fos = figureOfSpeechMap[r[2]]
    if (!fos) {
      return r[0]
    }
    return fos[r[3]] || r[0]
  }).join('')

  // anonymize phone number, address, email address, numbers
  const redactedResult = redactor.redact(reconstructedResult)

  return redactedResult
}

function anonymizeRequest(request) {
  for (const d of request.description) {
    for (const a of d.answers) {
      a.text = anonymize(a.text)
    }
  }
  for (const m of request.meets) {
    for (const c of m.chats) {
      c.text = anonymize(c.text)
    }
  }
  return request
}

function incrementLookupTable(r, lookupTable) {
  if (lookupTable[keyForTable(r)]) {
    lookupTable[keyForTable(r)] += 1
  } else {
    lookupTable[keyForTable(r)] = 1
  }
}

module.exports = {
  shouldFormatRequest,
  makeLookupTable,
  anonymize,
  anonymizeRequest,
  incrementLookupTable,
}
