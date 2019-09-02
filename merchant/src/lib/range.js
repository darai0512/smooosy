export function generateContinuousMap(min, max) {
  const map = {}

  const arr = [...new Array(max - min + 1)]

  arr.forEach((o, i) => {
    const value = i + min
    map[value] = { value, range: [value], number: value }
  })

  return map
}

export function generateRangeMap(min, max, stepSize) {
  // e.g.
  // min: 20, max: 90, stepSize: 25
  // => 20 - 44, 45-70, 70-89 (3 steps)
  // => Math.ceil((90 - 20)/25) => Math.ceil(2.8) => 3
  const numSteps = Math.ceil((max - min)/stepSize)

  const map = {}
  const arr = [...new Array(numSteps)]

  arr.forEach((o, i) => {
    const lower = min + i * stepSize
    const upper = Math.min(min + (i + 1) * stepSize - 1, max - 1)

    map[`${lower}〜${upper}`] = {
      value: `${lower}〜${upper}`,
      range: [lower, upper],
      number: (lower + upper)/2.,
    }
  })

  map[`${max}〜`] = {
    value: `${max}〜`,
    range: [max],
    number: max,
  }

  return map
}
