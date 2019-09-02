const test = require('ava')
const switcher = require('../../../src/api/lib/switcher')

test('test switcher', async t => {
  const a = (arg1, arg2) => {
    return new Promise(resolve => {
      resolve('a' + arg1 + arg2)
    })
  }

  const b = (arg1, arg2) => {
    return new Promise(resolve => {
      resolve('b' + arg2 + arg1)
    })
  }

  let switchFn = switcher.createSwitch(a, b, switcher.Mode.PRIMARY)
  t.is(await switchFn('hi', 'bye'), 'ahibye')

  switchFn = switcher.createSwitch(a, b, switcher.Mode.SECONDARY)
  t.is(await switchFn('hi', 'bye'), 'bbyehi')

  switchFn = switcher.createSwitch(b, a, switcher.Mode.SHADOW, (primary, secondary) => {
    t.is(primary, 'bbyehi')
    t.is(secondary, 'ahibye')
  })

  t.is(await switchFn('hi', 'bye'), 'bbyehi')
})
