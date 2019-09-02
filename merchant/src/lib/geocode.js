import axios from 'axios'
const apikey = 'AIzaSyBwFm0d0j3Nd4Jx1yWAUFYLisLAWFoqk-Q'

class GeocodeError extends Error {
  constructor(...arg) {
    super(...arg)
    this.name = 'GeocodeError'
  }
}

export function fixLongitude(lng) {
  if (lng) lng = lng - Math.floor((lng + 180) / 360) * 360 // -180から180の間に収める
  return lng
}

export function latlngToGeoJSON({lat, lng}) {
  return {
    type: 'Point',
    coordinates: [ lng, lat ],
  }
}

export function geocode({lat, lng, address}) {
  lng = fixLongitude(lng)
  const params = {
    key: apikey,
    language: 'ja',
    address: address ? address.replace(/([\d０-９]{3})[-ー]([\d０-９]{4})/, (m, p1, p2) => `${p1}${p2}`) : null,
    latlng: lat && lng ? `${lat},${lng}` : null,
  }
  return axios
    .get('https://maps.google.com/maps/api/geocode/json', {params})
    .then(res => res.data)
    .then(({results, status}) => {
      if (status === 'OK') {
        return results
      }
      throw new GeocodeError('invalid request')
    })
}

export function getAddressFromGeocodeResult(results) {
  const result = results.find(r => {
    const types = [].concat(...r.address_components.map(a => a.types))
    const prefecture = r.address_components.find(a => a.types.includes('administrative_area_level_1'))
    // ローマ字は除外
    const hasEnglishPref = prefecture && prefecture.short_name && /^[a-zA-Z\s]+$/.test(prefecture.short_name)
    // https://maps.multisoup.co.jp/blog/1952/
    // result which has more detail address appears in earlier
    return (
      types.includes('country') // 国
      && prefecture // pref
      && !hasEnglishPref
      // && types.includes('postal_code') // zipcode
      // && types.includes('locality') // city
      // && (types.includes('sublocality_level_1') || types.includes('sublocality_level_2')) // town
    )
  })

  if (!result) throw new Error('invalid geocode results')

  const components = result.address_components.reverse()
  const findType = type => address => address.types.includes(type)

  const country = components.find(findType('country')).long_name
  if (country !== '日本') throw new Error('Not in Japan')

  const zipcode = (components.find(findType('postal_code')) || {}).long_name
  const prefecture = components.find(findType('administrative_area_level_1')).long_name
  let city = (components.find(findType('locality')) || {}).long_name
  let town = (components.find(a => findType('sublocality_level_1')(a) || findType('sublocality_level_2')(a)) || {}).long_name

  // exception
  if (city === '須惠町') {
    city = '須恵町'
    town = town.replace('惠', '恵')
  } else if (/八丈島/.test(city)) {
    city = '八丈町'
    town = ''
  } else if (/三宅島/.test(city)) {
    city = '三宅村'
    town = ''
  }

  return { zipcode, prefecture, city, town }
}

export function parseGeocodeResults(results) {
  const result = getAddressFromGeocodeResult(results)
  if (!result.city) throw new Error('invalid geocode results')

  return result
}

export function getGPS() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        })
      }, (error) => {
        let message = ''
        let denied = false
        if (error.code === error.TIMEOUT || error.code === error.UNKNOWN_ERROR || error.code === error.POSITION_UNAVAILABLE) {
          message = '位置情報取得に失敗しました'
        } else if (error.code === error.PERMISSION_DENIED) {
          message = '位置情報取得を許可してください'
          denied = true
        }
        reject({message, denied})
      })
    } else {
      reject({message: 'このブラウザでは位置情報の取得に対応していません'})
    }
  })
}
