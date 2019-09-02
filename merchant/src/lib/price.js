import japaneseNumber from './japaneseNumber'

const prices = [
  2000,      3000,      5000,      7000,                            // 千
  10000,     15000,     20000,     30000,     50000,     70000,     // 万
  100000,    150000,    200000,    300000,    500000,    700000,    // 十万
  1000000,   1500000,   2000000,   3000000,   5000000,   7000000,   // 百万
  10000000,  15000000,  20000000,  30000000,  50000000,  70000000,  // 千万
  100000000,            200000000, 300000000, 500000000, 700000000, // 奥
  1000000000,                                                       // 十奥
]

/*
 *  min, max から予算範囲を作る
 *  4500, 13000
 *  => [ [ 0, 5000 ], [ 5000, 7000 ], [ 7000, 10000 ], [ 10000, 15000 ] ]
 */
export function minMaxToPriceRanges({minPrice, maxPrice}) {
  let ranges = []
  for (let i in prices) {
    if (prices[i] < minPrice) continue
    if (ranges.length) {
      ranges.push([prices[i - 1], prices[i]])
    } else {
      ranges.push([0, prices[i]])
    }
    if (prices[i] > maxPrice) break
  }

  // 多すぎる場合間引く
  if (ranges.length > 10) {
    const p = []
    for (let i in prices) {
      if ([1, 3, 5].includes(parseInt(i) % 6)) {
        p.push(prices[i])
      }
    }

    let i = 0
    do {
      if (!ranges[i + 1]) {
        break
      } else if (p.includes(ranges[i][1])) {
        ranges[i][1] = ranges[i + 1][1]
        ranges.splice(i + 1, 1)
      } else {
        i++
      }
    } while (ranges.length > 10)

    if (ranges.length > 10) {
      ranges = ranges.slice(ranges.length - 10)
    }
  }

  return ranges
}

const DEFAULT_POINT_FACTOR = 4
export function calcAddPoint({range, addPoint = 0, multiplePoint = 1}) {
  if (!range[1] || range[1] === 0) return 0

  for (let i in prices) {
    if (range[1] <= prices[i]) {
      return Math.max(0, Math.floor(i * multiplePoint - DEFAULT_POINT_FACTOR + addPoint))
    }
  }

  return Math.floor(prices.length * multiplePoint - DEFAULT_POINT_FACTOR + addPoint)
}

/*
 * 予算範囲を文字列にする
 * 例:
 *   [[10000, 15000], [15000, 20000], [20000, 30000], [30000, 50000]]
 *   => ['1万5千円未満', '1万5千円〜2万円', '2万円〜3万円', '3万円以上']
 */
export function priceRangesToString(ranges) {
  return ranges.map((range, i) => {
    if (i === 0) {
      return `${japaneseNumber(range[1]).format()}円未満`
    } else if (i === ranges.length - 1) {
      return `${japaneseNumber(range[0]).format()}円以上`
    }
    return `${japaneseNumber(range[0]).format()}円〜${japaneseNumber(range[1]).format()}円`
  })
}

export function calcPriceOptions({minPrice = 5000, maxPrice = 200000, addPoint = 0, multiplePoint = 1}) {
  minPrice = parseInt(minPrice, 10)
  maxPrice = parseInt(maxPrice, 10)
  addPoint = parseInt(addPoint, 10)
  multiplePoint = parseFloat(multiplePoint)
  const ranges = minMaxToPriceRanges({minPrice, maxPrice})
  const strings = priceRangesToString(ranges)

  const options = ranges.map((range, i) => ({
    range,
    point: calcAddPoint({range, addPoint, multiplePoint}),
    text: strings[i],
  }))
  options.push({
    range: [],
    point: calcAddPoint({range: ranges[1] || ranges[0], addPoint, multiplePoint}), // use second option's point
    text: '見当がつかない・プロに相談',
  })
  return options
}

export function formulaReplacer({formula = '', replacement = {}}) {
  // replace twice for sub formula
  formula = formula.replace(/{{([a-f0-9]+):[^}]+}}/g, (_, m1) => replacement[m1] || 0)
  formula = formula.replace(/{{([a-f0-9]+):[^}]+}}/g, (_, m1) => replacement[m1] || 0)
  return formula
}

export function calcFromFormula({formula = '', replacement = {}, addPoint = 0, multiplePoint = 1, ignoreError}) {
  addPoint = parseInt(addPoint, 10)
  multiplePoint = parseFloat(multiplePoint)

  let price = 0
  try {
    price = evalFormula(formulaReplacer({formula, replacement}))
  } catch (e) {
    // ignore eval error for tools
    if (!ignoreError) throw e
  }
  const ranges = []
  // choose a minimum range which include the price
  // and take 6 price ranges for budget options
  for (let i in prices) {
    if (prices[i] < price) continue
    if (ranges.length === 6) break
    ranges.push([prices[i - 1], prices[i]])
  }
  const strings = priceRangesToString(ranges)

  const options = ranges.map((range, i) => ({
    range,
    point: calcAddPoint({range, addPoint, multiplePoint}),
    text: strings[i],
  }))
  options.push({
    range: [],
    point: calcAddPoint({range: ranges[1] || ranges[0], addPoint, multiplePoint}), // use second option's point
    text: '見当がつかない・プロに相談',
  })
  return options
}

export function evalFormula(formula) {
  // helper functions for eval
  /* eslint-disable */
  function decay1(x, min, max, rate) {
    return 1 - Math.cbrt((x - min)/(max - min)) * rate
  }

  function decay2(x, min, max, rate) {
    return 1 - Math.sqrt((x - min)/(max - min)) * rate
  }
  /* eslint-enable */

  return eval(formula)
}
