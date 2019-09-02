export {}
const config = require('config')
const { client: elasticsearch } = require('../common')
const { splitArrayArgs } = require('../../util')
const { Service } = require('../../../models')

const kuromojiNgram = (val) => {
  return { kuromoji: val, ngram: val }
}

const main = async () => {
  const services = await Service.find({
    deleted: {$ne: true},
  })
  .select('name tags providerName description pageDescription')

  const body = []

  for (const service of services) {
    let out: any = { index: { _index: 'services', _type: '_doc', _id: service._id }}
    body.push(out)

    const tags = service.tags.map(tag => kuromojiNgram(tag))

    out = {
      name: kuromojiNgram(service.name),
      tags: tags,
      providerName: kuromojiNgram(service.providerName),
      description: kuromojiNgram(service.description),
      pageDescription: kuromojiNgram(service.pageDescription),
    }
    body.push(out)
  }

  let func = array => elasticsearch.bulk({body: array, requestTimeout: 6000})
  func = splitArrayArgs(func, config.get('elasticsearch.bulkInsertMax'))
  await func(body)
}

module.exports = main