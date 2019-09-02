export {}
const maxmind = require('maxmind')
const path = require('path')
const { slack } = require('./util')

module.exports = {
  getCityPostalFromIp,
}

let cityLookup
try {
  cityLookup = maxmind.openSync(path.join(__dirname, '..', 'GeoLite2-City.mmdb'))
} catch (e) {
  slack({message: e, room: 'ops'})
}
function getCityPostalFromIp(ip) {
  if (!cityLookup) return null
  const result = cityLookup.get(ip)
  if (result) {
    return { city: result.city, postal: result.postal }
  }
  return null
}
