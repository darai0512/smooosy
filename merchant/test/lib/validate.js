const test = require('ava')
const { trimWhitespace } = require('../../src/lib/validate')
const { fileMime } = require('@smooosy/config')

test('文字列の両端の空白文字がtrimされる', t => {
  const hankaku = '   aa  aa  '
  t.is(trimWhitespace(hankaku), 'aa  aa')
  const zenkaku = '　　aa　　aa　　'
  t.is(trimWhitespace(zenkaku), 'aa　　aa')
  t.is(trimWhitespace(hankaku + zenkaku), 'aa  aa  　　aa　　aa')
  const u00A0 = '\u00A0'
  const other = `${u00A0}${u00A0}aa${u00A0}${u00A0}aa${u00A0}${u00A0}`
  t.is(trimWhitespace(other), `aa${u00A0}${u00A0}aa`)
})

test('isAcceptablFileMimeでRegExpのexceptionが発生しない', t => {
  const list = [fileMime.types.all, ...Object.values(fileMime.types.image), ...Object.values(fileMime.types.application)]
  for (let l of list) {
    t.notThrows(() => new RegExp('^' + l.replace('*', '.+') + '$'))
  }
})
