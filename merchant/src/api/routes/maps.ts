export {}
const config = require('config')
const querystring = require('querystring')
const axios = require('axios')

const { Location } = require('../models')

module.exports = {
  show,
}

async function show(req, res) {
  const location = await Location.findById(req.params.id).populate('map')

  if (!location || !location.map || !location.map.data) {
    return res.status(404).json({message: 'not found'})
  }

  const data = JSON.parse(location.map.data)

  const paths = data.coordinates.map(c => {
    if (data.type === 'Polygon') {
      return c
    } else if (data.type === 'MultiPolygon') {
      return c[0]
    }
  }).map(p => `fillcolor:0xE8000050|color:0x00000090|weight:1|enc:${p}`)

  const o = {
    size: `${req.params.width}x${req.params.height}`,
    key: config.get('google.apiKey'),
    path: paths,
    language: 'ja',
    region: 'JP',
  }

  const qs = querystring.stringify(o)

  axios({
    method: 'GET',
    url: `https://maps.googleapis.com/maps/api/staticmap?${qs}`,
    responseType: 'stream',
  }).then(mapRes => {
    res.set('Content-Type', 'image/png')
    mapRes.data.pipe(res)
  })
}
