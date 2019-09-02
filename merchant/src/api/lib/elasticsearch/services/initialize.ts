export {}
const { client: elasticsearch, settings, KUROMOJI_NGRAM_MAPPING } = require('../common')

const INDEX = 'services'

const mappings = {
  _doc: {
    _source: {
      // 開発環境以外ではデータ量が多くなるので_sourceのデータを入れないようにする
      enabled: (process.env.NODE_ENV !== 'dev'),
    },
    properties: {
      name: KUROMOJI_NGRAM_MAPPING,
      tags: KUROMOJI_NGRAM_MAPPING,
      providerName: KUROMOJI_NGRAM_MAPPING,
      description: KUROMOJI_NGRAM_MAPPING,
      pageDescription: KUROMOJI_NGRAM_MAPPING,
    },
  },
}

const main = async () => {
  try {
    await elasticsearch.indices.delete({ index: INDEX })
  } catch (e) {
    // empty
  }

  await elasticsearch.indices.create({
    index: INDEX,
    body: { settings, mappings },
    include_type_name: process.env.NODE_ENV === 'heroku' ? true : undefined,
  })
}

module.exports = main