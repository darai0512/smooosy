const test = require('ava')
const { fixLongitude, parseGeocodeResults } = require('../../src/lib/geocode')

test('範囲外の緯度を変換する', t => {
  t.is(fixLongitude(0), 0)
  t.is(fixLongitude(130), 130)
  t.is(fixLongitude(179), 179)
  t.is(fixLongitude(181), -179)
  t.is(fixLongitude(-179), -179)
  t.is(fixLongitude(-181), 179)
})

test('英語の住所は利用しない', t => {
  const results = [
    {
      address_components: [
        {long_name: 'Jonanmachi', short_name: 'Jonanmachi', types: ['political', 'sublocality', 'sublocality_level_2']},
        {long_name: 'Kurume', short_name: 'Kurume', types: ['locality', 'political']},
        {long_name: 'Fukuoka Prefecture', short_name: 'Fukuoka Prefecture', types: ['administrative_area_level_1', 'political']},
        {long_name: '日本', short_name: 'JP', types: ['country', 'political']},
        {long_name: '830-0022', short_name: '830-0022', types: ['postal_code']},
      ],
      formatted_address: '日本、〒830-0022 Fukuoka Prefecture, Kurume, Jonanmachi, 15',
      types: ['establishment', 'food', 'point_of_interest', 'restaurant'],
    },
    {
      address_components: [
        {long_name: '830-0022', short_name: '830-0022', types: ['postal_code']},
        {long_name: '日本', short_name: 'JP', types: ['country', 'political']},
        {long_name: '福岡県', short_name: '福岡県', types: ['administrative_area_level_1', 'political']},
        {long_name: '久留米市', short_name: '久留米市', types: ['locality', 'political']},
        {long_name: '城南町', short_name: '城南町', types: ['political', 'sublocality', 'sublocality_level_2']},
        {long_name: '１５', short_name: '１５', types: ['political', 'sublocality', 'sublocality_level_4']},
        {long_name: '３', short_name: '３', types: ['premise']},
        {long_name: '久留米市役所', short_name: '久留米市役所', types: ['premise']},
      ],
      formatted_address: '日本、〒830-0022 福岡県久留米市城南町１５−３ 久留米市役所',
      types: ['premise'],
    },
  ]

  const { prefecture } = parseGeocodeResults(results)

  t.notRegex(prefecture, /^[A-Za-z\s]+$/)
})
