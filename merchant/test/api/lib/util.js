const test = require('ava')
const sinon = require('sinon')
const util = require('../../../src/api/lib/util')

test('shuffle function', t => {
  const data = [0, 1, 2, 3]
  const shuffled = util.shuffle(data)
  t.is(shuffled.length, data.length)
  t.is(shuffled.sort(), data.sort())
})

test('escapeHTML', t => {
  t.is(util.escapeHTML('&\'"<>'), '&amp;&#x27;&quot;&lt;&gt;')
})

test('fixEmail', t => {
  t.is(util.fixEmail('ｉｎｆｏ＠ｍｅｅｔｓｍｏｒｅ．ｃｏｍ'), 'info@smooosy.com')
  t.is(util.fixEmail('mailto:info@smooosy.com?subject='), 'info@smooosy.com')
  t.is(util.fixEmail('Mail: info@smooosy.com'), 'info@smooosy.com')
  t.is(util.fixEmail('info@smooosy.co.j'), 'info@smooosy.co.jp')
  t.is(util.fixEmail('info@smooosy.ne.j'), 'info@smooosy.ne.jp')
  t.is(util.fixEmail('info%20@%20smooosy.com'), 'info@smooosy.com')
})

test('regexpEscaper', t => {
  t.is(util.regexpEscaper('-/\\^$*+?.()|[]{}]'), '\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}\\]')
})

test('splitArrayArgsで指定の数にarrayが分割される', async t => {
  // zero to nine
  const array = [...Array(10)].map((_, i) => i)

  const stub = sinon.spy()
  let func = (arr) => {
    stub(arr)
    return Promise.resolve()
  }
  func = util.splitArrayArgs(func, 3)
  await func(array)

  t.is(stub.callCount, 4)
  t.true(stub.withArgs([0, 1, 2]).calledOnce)
  t.true(stub.withArgs([3, 4, 5]).calledOnce)
  t.true(stub.withArgs([6, 7, 8]).calledOnce)
  t.true(stub.withArgs([9]).calledOnce)
})

test('splitStepsの動作確認', t => {
  const testcases = [
    {
      input: { start: 1, end: 10, step: 1 },
      output: [
        { start: 1, end: 10, step: 1 },
      ],
    },
    {
      input: { start: 1, end: 11, step: 1 },
      output: [
        { start: 1, end: 10, step: 1 },
        { start: 11, end: 11, step: 1 },
      ],
    },
    {
      input: { start: 1, end: 9, step: 1 },
      output: [
        { start: 1, end: 9, step: 1 },
      ],
    },
    {
      input: { start: 1, end: 24, step: 2 },
      output: [
        { start: 1, end: 20, step: 2 },
        { start: 21, end: 24, step: 2 },
      ],
    },
    {
      input: { start: 1, end: 210, step: 10 },
      output: [
        { start: 1, end: 100, step: 10 },
        { start: 101, end: 200, step: 10 },
        { start: 201, end: 210, step: 10 },
      ],
    },
    {
      input: { start: 0, end: 30, step: 1 },
      output: [
        { start: 0, end: 9, step: 1 },
        { start: 10, end: 19, step: 1 },
        { start: 20, end: 29, step: 1 },
        { start: 30, end: 30, step: 1 },
      ],
    },
  ]

  for (let testcase of testcases) {
    t.deepEqual(util.splitSteps(testcase.input), testcase.output)
  }
})

test('getQueryParams', t => {
  const testCases = [
    {
      input: { foo: 'bar' },
      output: null,
      message: 'no stack param should produce no query params',
    },
    {
      input: { stack: [] },
      output: null,
      message: 'empty array stack param should produce no query params',
    },
    {
      input: { stack: [ 'foo' ] },
      output: {},
      message: 'bad url should produce empty object',
    },
    {
      input: { stack: [ 'foo' ] },
      output: {},
      message: 'url with no query params should produce empty object',
    },
  ]

  for (let tc of testCases) {
    t.deepEqual(
      util.getQueryParams(tc.input),
      tc.output,
      tc.message,
    )
  }
})
