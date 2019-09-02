export {}
const config = require('config')
const elasticsearch = require('elasticsearch')
const client = new elasticsearch.Client(config.get('elasticsearch'))

exports.client = client

exports.settings = {
  analysis: {
    tokenizer: {
      'kuromoji_tokenizer': {
        type: 'kuromoji_tokenizer',
        mode: 'search',
      },
      'ngram_tokenizer': {
        type: 'ngram',
        min_gram: 2,
        max_gram: 3,
        token_chars: [
          'letter',
          'digit',
          'punctuation',
          'symbol',
        ],
      },
    },
    analyzer: {
      japanese: {
        type: 'custom',
        tokenizer: 'kuromoji_tokenizer',
        filter: [
          'lowercase', 'romaji_readingform', 'pos_filter', 'kuromoji_baseform',
        ],
      },
      ngram: {
        type: 'custom',
        tokenizer: 'ngram_tokenizer',
        filter: [
          'lowercase',
        ],
      },
    },
    filter: {
      romaji_readingform: {
        type: 'kuromoji_readingform',
        use_romaji: true,
      },
      pos_filter: {
        type: 'kuromoji_part_of_speech',
      },
    },
  },
}

exports.KUROMOJI_NGRAM_MAPPING = {
  properties: {
    kuromoji: { type: 'text', analyzer: 'japanese' },
    ngram: { type: 'text', analyzer: 'ngram' },
  },
}