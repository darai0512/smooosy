export {}
const radians = (deg) => {
  return deg * Math.PI / 180
}

// 緯度経度から距離の計算
const getDistance = (p1, p2) => {
  if (!p1 || !p2) return 0
  const x = Math.cos(radians(p1.coordinates[1])) *
    Math.cos(radians(p2.coordinates[1])) *
    Math.cos(radians(p2.coordinates[0]) - radians(p1.coordinates[0])) +
    Math.sin(radians(p1.coordinates[1])) *
    Math.sin(radians(p2.coordinates[1]))

  return 6378.14 * Math.acos(Math.max(-1, Math.min(1, x)))
}

module.exports = {
  getDistance,
}