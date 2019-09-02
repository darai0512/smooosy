export {}
const config = require('config')
const maps = require('@google/maps')

let client
function googleMaps() {
  if (!client) {
    client = maps.createClient({
      key: config.get('google.apiKey'),
      language: 'ja',
      Promise,
    })
  }

  return {
    geocode: obj => client.geocode(obj).asPromise().then(res => res.json.results[0]),
  }
}


module.exports = {
  googleMaps,
}
