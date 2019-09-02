export {}
const { client: elasticsearch, settings, KUROMOJI_NGRAM_MAPPING } = require('../common')

const INDEX = 'users'

const mappings = {
  _doc: {
    _source: {
      // 開発環境以外ではデータ量が多くなるので_sourceのデータを入れないようにする
      enabled: (process.env.NODE_ENV !== 'dev'),
    },
    properties: {
      name: {
        properties: {
          ...KUROMOJI_NGRAM_MAPPING.properties,
          exact: { type: 'keyword' },
        },
      },
      email: {
        type: 'text',
        fields: {
          exact: { type: 'keyword' },
        },
      },
      profiles: {
        type: 'nested',
        properties: {
          name: KUROMOJI_NGRAM_MAPPING,
          services: {
            properties: {
              name: KUROMOJI_NGRAM_MAPPING,
              providerName: KUROMOJI_NGRAM_MAPPING,
            },
          },
          category: KUROMOJI_NGRAM_MAPPING,
          address: KUROMOJI_NGRAM_MAPPING,
          description: KUROMOJI_NGRAM_MAPPING,
          accomplishment: KUROMOJI_NGRAM_MAPPING,
          advantage: KUROMOJI_NGRAM_MAPPING,
        },
      },
    },
  },
}

const main = async () => {
  try {
    await elasticsearch.indices.delete({ index: INDEX })
  // eslint-disable-next-line
  } catch (e) { }

  await elasticsearch.indices.create({
    index: INDEX,
    body: { settings, mappings },
    include_type_name: process.env.NODE_ENV === 'heroku' ? true : undefined,
  })
}

module.exports = main