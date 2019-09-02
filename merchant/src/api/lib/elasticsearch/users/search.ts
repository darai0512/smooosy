export {}
const { client } = require('../common')

const { User } = require('../../../models')

const createQuery = (query) => {
  query = query || ''
  const param = query.length < 3 ? 'kuromoji' : 'ngram'

  return {
    sort: '_score',
    query: {
      bool: {
        should: [
          {
            multi_match: {
              query: query,
              fields: [`name.${param}`, 'email', 'phone'],
            },
          },
          {
            match: {
              'email.exact': {
                query: query,
                boost: 50,
              },
            },
          },
          {
            match: {
              'name.exact': {
                query: query,
                boost: 50,
              },
            },
          },
          // 今は権限管理しかしていないので使わない
          // {
          //   nested: {
          //     path: 'profiles',
          //     query: {
          //       multi_match: {
          //         query: query,
          //         fields: [
          //           `profiles.name.${param}`,
          //           `profiles.category.${param}`,
          //           `profiles.address.${param}`,
          //           `profiles.description.${param}`,
          //           `profiles.accomplishment.${param}`,
          //           `profiles.advantage.${param}`,
          //           `profiles.services.name.${param}`,
          //           `profiles.services.providerName.${param}`,
          //         ],
          //       },
          //     },
          //   },
          // },
        ],
      },
    },
  }
}

module.exports = async ({query, from = 0, limit = 10}) => {
  from = parseInt(from, 10) || 0

  const res = await client.search({
    index: 'users',
    type: '_doc',
    from: from,
    size: limit,
    body: createQuery(query),
  })

  // convert
  const userIds = res.hits.hits.map((e) => e._id)
  const data = await User
    .find({
      _id: { $in: userIds },
    })
    .select('_id lastname firstname email')

  const userMap = data.reduce((prev, current) => {
    const id = current._id.toString()
    if (!prev.has(id)) prev.set(id, current)
    return prev
  }, new Map())

  const users = userIds.map((id) => userMap.get(id))

  return {
    from: from,
    total: res.hits.total,
    data: users,
  }
}