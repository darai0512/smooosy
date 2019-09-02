const test = require('ava')
const { minMaxToPriceRanges, priceRangesToString, formulaReplacer } = require('../../src/lib/price')

test('予算選択肢が適切に変換される', t => {
  const testData = [
    {
      min: 0,
      max: 10000,
      expected: [
        [0, 2000],
        [2000, 3000],
        [3000, 5000],
        [5000, 7000],
        [7000, 10000],
        [10000, 15000],
      ],
    },
    {
      min: 3500,
      max: 16000,
      expected: [
        [0, 5000],
        [5000, 7000],
        [7000, 10000],
        [10000, 15000],
        [15000, 20000],
      ],
    },
  ]

  for (let data of testData) {
    const ranges = minMaxToPriceRanges({minPrice: data.min, maxPrice: data.max})
    t.deepEqual(ranges, data.expected)

    const strings = priceRangesToString(ranges)
    t.true(/未満$/.test(strings[0]))
    t.true(/以上$/.test(strings[strings.length - 1]))
  }
})


test('数式での予算計算', t => {
  const testData = [
    {
      formula: '1 + 2 * {{a:foo}}',
      replacement: {a: 2},
      expected: '1 + 2 * 2',
    },
    {
      formula: '1 + {{a:foo}} * {{b:bar}}',
      replacement: {a: 2, b: 3},
      expected: '1 + 2 * 3',
    },
    {
      formula: 'Math.max(1, {{a:foo}})',
      replacement: {a: 10},
      expected: 'Math.max(1, 10)',
    },
  ]

  for (let data of testData) {
    t.is(formulaReplacer(data), data.expected)
  }
})
