export {}
const { client } = require('../common')
const { Service } = require('../../../models')

const createQuery = (query) => {
  query = query || ''
  const ngram = ['name.ngram^20', 'providerName.ngram^20', 'tags.ngram^10', 'description.ngram', 'pageDescription.ngram']
  const kuromoji = ['name.kuromoji^10', 'providerName.kuromoji^10', 'tags.kuromoji^5', 'description.kuromoji', 'pageDescription.kuromoji']
  let fields = [...ngram, ...kuromoji]
  if (query.length < 2) {
    fields = [...kuromoji]
  } else if (query.length <= 3) {
    fields = [...kuromoji, ...ngram]
  }

  return {
    query: {
      bool: {
        should: [
          {
            multi_match: {
              query: query,
              fields: fields,
            },
          },
        ],
      },
    },
  }
}

module.exports = async ({query, from = 0, limit = 10}) => {
  from = parseInt(from, 10) || 0

  const res = await client.search({
    index: 'services',
    type: '_doc',
    from: from,
    size: limit,
    body: createQuery(query),
  })

  // convert
  const serviceIds = res.hits.hits.map((e) => e._id)
  const data = await Service
    .find({
      _id: { $in: serviceIds },
    })
    .select('_id name key tags enabled matchMoreEnabled')

  const serviceMap = data.reduce((prev, current) => {
    const id = current._id.toString()
    if (!prev.has(id)) prev.set(id, current)
    return prev
  }, new Map())

  const services = serviceIds.map((id) => serviceMap.get(id))

  return {
    from: from,
    total: res.hits.total,
    data: services,
  }
}