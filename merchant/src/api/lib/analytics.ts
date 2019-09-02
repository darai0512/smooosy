export {}
const ua = require('universal-analytics')
const uuidv4 = require('uuid/v4')
const config = require('config')
const tid = config.get('google.analytics')

module.exports = {
  event,
  pageview,
}

function event(data) {
  const cid = uuidv4()
  ua(tid, cid).event(data).send()
}

function pageview(path, params) {
  const cid = uuidv4()

  // paramsで上書きできるパラメータ(parametersMap)
  // https://github.com/peaksandpies/universal-analytics/blob/e13640cee48f813ff69471acc0fd20df93f1fe64/lib/config.js
  params ? ua(tid, cid).pageview(path, null, null, params).send()
    : ua(tid, cid).pageview(path).send()
}
