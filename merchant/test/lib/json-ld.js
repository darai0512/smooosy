const test = require('ava')
const { generateSchemaMeta } = require('../../src/lib/json-ld')

const data = {
  top: {
    input: {
      title: 'SMOOOSY - あなたにぴったりのプロが見つかるサービス',
      description: 'あなたにぴったりのプロを見つけよう。SMOOOSYはプロに仕事を依頼できるプラットフォームです。家族写真からイベントカメラマンまで、様々なこだわりを叶えてくれるプロが待っています。',
      url: 'https://dev.smooosy.com',
      shareImage: 'https://dev.smooosy.com/images/icon.png',
      width: 320,
      height: 320,
      structuredDataType: 'WebSite',
    },
    expected: {'@context': 'http://schema.org', '@type': 'WebSite', 'name': 'SMOOOSY - あなたにぴったりのプロが見つかるサービス', 'description': 'あなたにぴったりのプロを見つけよう。SMOOOSYはプロに仕事を依頼できるプラットフォームです。家族写真からイベントカメラマンまで、様々なこだわりを叶えてくれるプロが待っています。', 'image': {'@type': 'ImageObject', 'url': 'https://dev.smooosy.com/images/icon.png', 'width': 320, 'height': 320}, 'url': 'https://dev.smooosy.com', 'potentialAction': {'@type': 'SearchAction', 'target': 'https://dev.smooosy.com?q={search_term}', 'query-input': 'required name=search_term'}},
  },
  service: {
    input: {
      title: '結婚式写真の出張撮影カメラマン【口コミ・料金で比較】',
      description: '結婚式の出張撮影カメラマンを口コミとあわせて一挙に紹介！実績・ポートフォリオ写真・口コミやウエディングフォト撮影の相場価格も公開中。挙式も披露宴も二次会も、ご希望の予算内で思い通りの写真撮影を実現しましょう。',
      url: 'https://dev.smooosy.com/services/',
      shareImage: 'https://dev.smooosy.com/img/services/587dc25995ad46628c642336.jpg?1524643580900&w=1200&h=630&t=r',
      width: 1200,
      height: 630,
      structuredDataType: 'Product',
      rating: {
        avg: 4.89,
        count: 540,
      },
    },
    expected: {'@context': 'http://schema.org', '@type': 'Product', 'name': '結婚式写真の出張撮影カメラマン【口コミ・料金で比較】', 'description': '結婚式の出張撮影カメラマンを口コミとあわせて一挙に紹介！実績・ポートフォリオ写真・口コミやウエディングフォト撮影の相場価格も公開中。挙式も披露宴も二次会も、ご希望の予算内で思い通りの写真撮影を実現しましょう。', 'image': {'@type': 'ImageObject', 'url': 'https://dev.smooosy.com/img/services/587dc25995ad46628c642336.jpg?1524643580900&w=1200&h=630&t=r', 'width': 1200, 'height': 630}, 'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': 4.89, 'reviewCount': 540}},
  },
  serviceLocalBusiness: {
    input: {
      title: '港区の車の板金塗装【口コミ・料金で比較】',
      description: '東京都港区の車の板金塗装を無料で一括見積もり。あなたのこだわり・要望に合わせてプロが最適な提案・見積もりをしてくれます。車の板金塗装はSMOOOSYで。',
      url: 'https://dev.smooosy.com/services/automobile-body-repair-and-paint/tokyo/minato',
      shareImage: 'https://dev.smooosy.com/img/services/591954419a828369f3dd2a30.jpg?1524643580900&w=1200&h=630&t=r',
      width: 1200,
      height: 630,
      structuredDataType: 'LocalBusiness',
      service: 'noservice',
      rating: {
        avg: 4.87,
        count: 148,
      },
      postalCode: '107-0052',
      addressRegion: '東京都',
      addressLocality: '港区',
    },
    expected: {
      '@context': 'http://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://dev.smooosy.com/services/automobile-body-repair-and-paint/tokyo/minato',
      'name': '港区の車の板金塗装【口コミ・料金で比較】',
      'description': '東京都港区の車の板金塗装を無料で一括見積もり。あなたのこだわり・要望に合わせてプロが最適な提案・見積もりをしてくれます。車の板金塗装はSMOOOSYで。',
      'image': {'@type': 'ImageObject', 'url': 'https://dev.smooosy.com/img/services/591954419a828369f3dd2a30.jpg?1524643580900&w=1200&h=630&t=r', 'width': 1200, 'height': 630},
      'address': {'@type': 'PostalAddress', 'postalCode': '107-0052', 'addressCountry': 'JP', 'addressRegion': '東京都', 'addressLocality': '港区'},
      'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': 4.87, 'reviewCount': 148},
    },
  },
  categorySpecificLocalBusiness: {
    input: {
      title: '港区の車の板金塗装【口コミ・料金で比較】',
      description: '東京都港区の車の板金塗装を無料で一括見積もり。あなたのこだわり・要望に合わせてプロが最適な提案・見積もりをしてくれます。車の板金塗装はSMOOOSYで。',
      url: 'https://dev.smooosy.com/services/automobile-body-repair-and-paint/tokyo/minato',
      shareImage: 'https://dev.smooosy.com/img/services/591954419a828369f3dd2a30.jpg?1524643580900&w=1200&h=630&t=r',
      width: 1200,
      height: 630,
      structuredDataType: 'LocalBusiness',
      category: 'tax-accountant',
      rating: {
        avg: 4.87,
        count: 148,
      },
      postalCode: '107-0052',
      addressRegion: '東京都',
      addressLocality: '港区',
    },
    expected: {
      '@context': 'http://schema.org',
      '@type': 'LegalService',
      '@id': 'https://dev.smooosy.com/services/automobile-body-repair-and-paint/tokyo/minato',
      'name': '港区の車の板金塗装【口コミ・料金で比較】',
      'description': '東京都港区の車の板金塗装を無料で一括見積もり。あなたのこだわり・要望に合わせてプロが最適な提案・見積もりをしてくれます。車の板金塗装はSMOOOSYで。',
      'image': {'@type': 'ImageObject', 'url': 'https://dev.smooosy.com/img/services/591954419a828369f3dd2a30.jpg?1524643580900&w=1200&h=630&t=r', 'width': 1200, 'height': 630},
      'address': {'@type': 'PostalAddress', 'postalCode': '107-0052', 'addressCountry': 'JP', 'addressRegion': '東京都', 'addressLocality': '港区'},
      'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': 4.87, 'reviewCount': 148},
    },
  },
  serviceSpecificLocalBusiness: {
    input: {
      title: '港区の車の板金塗装【口コミ・料金で比較】',
      description: '東京都港区の車の板金塗装を無料で一括見積もり。あなたのこだわり・要望に合わせてプロが最適な提案・見積もりをしてくれます。車の板金塗装はSMOOOSYで。',
      url: 'https://dev.smooosy.com/services/automobile-body-repair-and-paint/tokyo/minato',
      shareImage: 'https://dev.smooosy.com/img/services/591954419a828369f3dd2a30.jpg?1524643580900&w=1200&h=630&t=r',
      width: 1200,
      height: 630,
      structuredDataType: 'LocalBusiness',
      category: 'car-maintenance',
      service: 'automobile-body-repair-and-paint',
      rating: {
        avg: 4.87,
        count: 148,
      },
      postalCode: '107-0052',
      addressRegion: '東京都',
      addressLocality: '港区',
    },
    expected: {
      '@context': 'http://schema.org',
      '@type': 'AutoBodyShop',
      '@id': 'https://dev.smooosy.com/services/automobile-body-repair-and-paint/tokyo/minato',
      'name': '港区の車の板金塗装【口コミ・料金で比較】',
      'description': '東京都港区の車の板金塗装を無料で一括見積もり。あなたのこだわり・要望に合わせてプロが最適な提案・見積もりをしてくれます。車の板金塗装はSMOOOSYで。',
      'image': {'@type': 'ImageObject', 'url': 'https://dev.smooosy.com/img/services/591954419a828369f3dd2a30.jpg?1524643580900&w=1200&h=630&t=r', 'width': 1200, 'height': 630},
      'address': {'@type': 'PostalAddress', 'postalCode': '107-0052', 'addressCountry': 'JP', 'addressRegion': '東京都', 'addressLocality': '港区'},
      'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': 4.87, 'reviewCount': 148},
    },
  },
  profile: {
    input: {
      title: '事業者名 - 東京都港区',
      description: '事業者自己紹介\n実績\nアピールポイント',
      url: 'https://dev.smooosy.com/p/W_jzmnW7jKjd2WsJ',
      shareImage: 'https://dev.smooosy.com/img/users/5933115891430c0de8ea69e0.jpg?1496519215980&w=320&h=320',
      width: 320,
      height: 320,
      structuredDataType: 'LocalBusiness',
      rating: {
        avg: 5,
        count: 71,
      },
      postalCode: '107-0052',
      addressRegion: '東京都',
      addressLocality: '港区',
    },
    expected: {
      '@context': 'http://schema.org',
      '@type': 'LocalBusiness',
      'name': '事業者名 - 東京都港区',
      'description': '事業者自己紹介\n実績\nアピールポイント',
      'image': {
        '@type': 'ImageObject',
        url: 'https://dev.smooosy.com/img/users/5933115891430c0de8ea69e0.jpg?1496519215980&w=320&h=320',
        width: 320,
        height: 320,
      },
      'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': 5, 'reviewCount': 71},
      '@id': 'https://dev.smooosy.com/p/W_jzmnW7jKjd2WsJ',
      'address': {'@type': 'PostalAddress', 'postalCode': '107-0052', 'addressCountry': 'JP', 'addressRegion': '東京都', 'addressLocality': '港区'},
    },
  },
  media: {
    input: {
      title: '結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！',
      description: '結婚式のカメラマンは持ち込みの外注カメラマンがおすすめ！今回は、結婚式カメラマンを一挙63名ご紹介！それぞれのスタジオの作品を掲載していますので、結婚式カメラマンを外注しようか式場の専属カメラマンにしようかお悩みのカップルは必見です。結婚式カメラマンを外注するメリットや気になる費用の話など、見逃せない情報満載です。',
      url: 'https://dev.smooosy.com/services/wedding-photographers/media/729',
      shareImage: 'https://dev.smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722.jpg',
      width: 1200,
      height: 630,
      structuredDataType: 'Article',
      rating: {
        avg: 4.89,
        count: 545,
      },
      published: '2017-08-21T10:56:33',
      modified: '2019-03-13T14:01:32',
      author: 'Aki',
    },
    expected: {'@context': 'http://schema.org', '@type': 'Article', 'name': '結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！', 'description': '結婚式のカメラマンは持ち込みの外注カメラマンがおすすめ！今回は、結婚式カメラマンを一挙63名ご紹介！それぞれのスタジオの作品を掲載していますので、結婚式カメラマンを外注しようか式場の専属カメラマンにしようかお悩みのカップルは必見です。結婚式カメラマンを外注するメリットや気になる費用の話など、見逃せない情報満載です。', 'image': {'@type': 'ImageObject', 'url': 'https://dev.smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722.jpg', 'width': 1200, 'height': 630}, 'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': 4.89, 'reviewCount': 545}, 'headline': '結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！', 'publisher': {'@type': 'Organization', 'name': 'SMOOOSY', 'url': 'https://smooosy.com', 'logo': 'https://smooosy.com/images/logo.png', 'sameAs': ['https://www.facebook.com/smooosy', 'https://twitter.com/smooosy', 'http://instagram.com/smooosy']}, 'datePublished': '2017-08-21T10:56:33+09:00', 'dateModified': '2019-03-13T14:01:32+09:00', 'author': {'@type': 'Person', 'name': 'Aki'}},
  },
}

Object.keys(data).forEach(key => {
  test(`generateScehma for ${key}`, async t => {
    const output = generateSchemaMeta(data[key].input)
    const expected = data[key].expected
    t.deepEqual(output, expected)
  })
})
