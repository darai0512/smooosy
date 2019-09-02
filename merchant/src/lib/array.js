/*
 * make combinations of array
 *
 * [1,2] => [ [1], [2], [1, 2] ]
 * [1,2,3] => [ [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3] ]
 */
export function combinations(array) {
  return [].concat(...array.map((_, i) => combinations_n(array, i + 1)))
}

function combinations_n(array, n) {
  if (n <= 0 || array.length < n) return []
  if (n === array.length) return [array]
  if (n === 1) return array.map(a => [a])

  // array.length is in [2, array.length - 1]
  const combs = []
  for (let i = 0; i <= array.length - n + 1; i++) {
    const tailCombs = combinations_n(array.slice(i + 1), n - 1)
    combs.push(...tailCombs.map(c => [array[i], ...c]))
  }
  return combs
}
