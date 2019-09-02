import test from 'ava'
import japaneseNumber from '../../src/lib/japaneseNumber'

test('日本語の数字からNumberへの変換ができる', t => {
  t.is(japaneseNumber('二百三十四').parse(), 234)
  t.is(japaneseNumber('千').parse(), 1000)
  t.is(japaneseNumber('2千').parse(), 2000)
  t.is(japaneseNumber('３千').parse(), 3000)
  t.is(japaneseNumber('四千').parse(), 4000)
  t.is(japaneseNumber('5000').parse(), 5000)
  t.is(japaneseNumber('6,000').parse(), 6000)
  t.is(japaneseNumber('７０００').parse(), 7000)
  t.is(japaneseNumber('8万').parse(), 80000)
  t.is(japaneseNumber('九十万').parse(), 900000)
  t.is(japaneseNumber('百万').parse(), 1000000)
  t.is(japaneseNumber('二百三十四万五千').parse(), 2345000)
  t.is(japaneseNumber('一億').parse(), 100000000)
  t.is(japaneseNumber('六億七千八十万').parse(), 670800000)
  t.is(japaneseNumber('１兆５３４０億０３０２万１０２９').parse(), 1534003021029)
})

test('Numberから日本語の数字への変換ができる', t => {
  t.is(japaneseNumber(0).format(), '0')
  t.is(japaneseNumber(1020).format(), '1,020')
  t.is(japaneseNumber(10000).format(), '1万')
  t.is(japaneseNumber(30400).format(), '3万400')
  t.is(japaneseNumber(45000).format(), '4万5,000')
  t.is(japaneseNumber(100000000).format(), '1億')
  t.is(japaneseNumber(607089000).format(), '6億708万9,000')
  t.is(japaneseNumber(1234567890123456).format(), '1,234兆5,678億9,012万3,456')
  t.throws(() => {
    japaneseNumber(12345678901234567)
  })
})

test('特殊な初期値の場合の処理', t => {
  t.is(japaneseNumber().parse(), 0)
  t.is(japaneseNumber().format(), '0')
  t.is(japaneseNumber('').parse(), 0)
  t.is(japaneseNumber('').format(), '0')
  t.is(japaneseNumber('こんにちは').parse(), 0)
  t.is(japaneseNumber('こんにちは').format(), '0')
  t.is(japaneseNumber('二十日').parse(), 20)
  t.is(japaneseNumber('二十日').format(), '20')
})
