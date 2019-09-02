const test = require('ava')
const { encrypt, decrypt } = require('../../../src/api/lib/encrypter')

test('暗号し複合すると元に戻る', t => {
  const str = 'smooosy'
  t.is(decrypt(encrypt(str)), str)
})

test('例外の処理', t => {
  t.is(encrypt(), '')
  t.is(encrypt(''), '')
  t.is(decrypt(), '')
  t.is(decrypt(''), '')
})
