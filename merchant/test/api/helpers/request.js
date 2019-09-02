const LocationType = {
  Tokyo: 'tokyo',
  Kyoto: 'kyoto',
}

const LocationTypeToLocationData = {
  'tokyo': {
    prefecture: '東京都',
    city: '港区',
  },
  'kyoto': {
    prefecture: '京都府',
    city: '伏見区',
  },
}

function makeRequest(locationType, meetCount) {
  const locationData = LocationTypeToLocationData[locationType]
  meetCount = typeof meetCount === 'number' ? meetCount : 5

  // Not all data filled in. Data should be filled in here
  // on a need basis.
  return {
    service: '123',
    prefecture: locationData.prefecture,
    city: locationData.city,
    meets: [...Array(meetCount)].map((_, i) => ({
      pro: i,
    })),
  }
}

module.exports = {
  makeRequest,
  LocationType,
}
