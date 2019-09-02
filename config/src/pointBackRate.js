const pointsConsumedToRate = {
  20: 0,
  200: 0.05,
  500: 0.07,
  1000: 0.1,
  2000: 0.12,
}
const pointBackRate = {
  calc: (point) => {
    for (const key of Object.keys(pointsConsumedToRate)) {
      if (point < key) return pointsConsumedToRate[key]
    }
    return 0.15
  },
  pointUntilNextRate: (point) => {
    for (const key of Object.keys(pointsConsumedToRate)) {
      if (point < key) return Number(key) - Number(point)
    }
    return 0
  },
}

export default pointBackRate
