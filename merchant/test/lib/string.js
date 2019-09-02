const test = require('ava')
const { removeUselessWhiteSpaces } = require('../../src/lib/string')

test('複数の空白・改行が一つにまとまる', t => {
  // 先頭はtrimされる
  t.is(removeUselessWhiteSpaces('\n\n aaa'), 'aaa')
  // 複数の半角スペース
  t.is(removeUselessWhiteSpaces('a    aa'), 'a aa')
  // 複数の全角スペース
  t.is(removeUselessWhiteSpaces('a　　　aa'), 'a aa')
  // 複数の改行
  t.is(removeUselessWhiteSpaces('a\n\n\naa'), 'a\naa')
  // 改行とスペース混じり
  t.is(removeUselessWhiteSpaces('a\n  \n　\naa'), 'a\naa')
})