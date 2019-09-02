import React from 'react'
import qs from 'qs'

const base = 'https://maps.googleapis.com/maps/api/staticmap'
const apikey = 'AIzaSyBwFm0d0j3Nd4Jx1yWAUFYLisLAWFoqk-Q'

const GoogleMapStatic = (props) => {
  const { width = 400, height = 200, center, zoom, markers = [], style } = props

  const params = {
    language: 'ja',
    key: apikey,
    scale: 2,
    center: center.lat ? `${center.lat},${center.lng}` : center,
    zoom,
    size: `${width}x${height}`,
    markers: markers.map(m => `size:small|color:${m.icon}|${m.lat},${m.lng}`),
  }

  return (
    <img src={`${base}?${qs.stringify(params, {arrayFormat: 'repeat'})}`} width={width} height={height} style={style} />
  )
}

export default GoogleMapStatic
