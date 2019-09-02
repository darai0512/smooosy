export {}
const config = require('config')
const { client: elasticsearch } = require('../common')

const { User, Service } = require('../../../models')
const { splitArrayArgs } = require('../../util')

const kuromojiNgram = (val) => {
  return { kuromoji: val, ngram: val }
}

const main = async () => {
  const [ services, users ] = await Promise.all([
    Service
    .find()
    .select('name providerName')
    .lean(),
    User
      .find()
      .select('lastname firstname profiles email phone')
      .populate({
        path: 'profiles',
        select: 'name category address description accomplishment advantage services',
      })
      .lean(),
  ])

  const serviceMap = {}
  for (const service of services) {
    serviceMap[service._id.toString()] = service
  }

  const body = []

  for (const user of users) {
    let out: any = { index: { _index: 'users', _type: '_doc', _id: user._id }}
    body.push(out)

    const profiles = user.profiles.map(profile => {
      const services = []
      for (const s of profile.services) {
        const service = serviceMap[s.toString()]
        if (!service) continue
        services.push({
          name: kuromojiNgram(service.name),
          providerName: kuromojiNgram(service.providerName),
        })
      }

      return {
        name: kuromojiNgram(profile.name),
        category: kuromojiNgram(profile.category),
        address: kuromojiNgram(profile.address),
        description: kuromojiNgram(profile.description),
        accomplishment: kuromojiNgram(profile.accomplishment),
        advantage: kuromojiNgram(profile.advantage),
        services,
      }
    })

    const name = `${user.lastname}${user.firstname}`

    out = {
      name: {...kuromojiNgram(name), exact: name},
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      profiles,
    }
    body.push(out)
  }

  // bulkInsertMaxを上限としbodyを分割してbulkInsertする
  let func = array => elasticsearch.bulk({body: array, requestTimeout: 6000})
  func = splitArrayArgs(func, config.get('elasticsearch.bulkInsertMax'))
  await func(body)
}

module.exports = main