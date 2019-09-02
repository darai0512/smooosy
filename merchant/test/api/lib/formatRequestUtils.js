const test = require('ava')

const { makeLookupTable, shouldFormatRequest, anonymize, anonymizeRequest } = require('../../../src/api/lib/formatRequestUtils')
const { LocationType, makeRequest } = require('../helpers/request')

test('makeLookupTable', async t => {
  const tokyo = makeRequest(LocationType.Tokyo)
  const kyoto = makeRequest(LocationType.Kyoto)

  const requests = [ tokyo ]

  const lookupTable = makeLookupTable(requests)

  t.false(await shouldFormatRequest(tokyo, lookupTable))

  t.true(await shouldFormatRequest(kyoto, lookupTable))
})

const text1 = '柄澤史也様\n\n初めまして。井上隆と申します。柄澤さまは江東区にお住まいということで、とても親近感を感じております！\nぜひ椿山荘でのご結婚式を撮影させていただければ幸いです。'
const anonymized1 = '〇〇〇〇様\n\n初めまして。〇〇と申します。〇〇さまは江東区にお住まいということで、とても親近感を感じております！\nぜひ椿山荘でのご結婚式を撮影させていただければ幸いです。'

const text2 = '結婚式当日のスナップ写真撮影のお値段は12,000円になります。\nカメラマンは柄澤史也様がご希望な11時支度から16時30分披露宴お開きまで全て撮影します。カメラマンは支度開始時間の30分前現場に入らせて頂きます。\n挙式から披露宴送賓まで500カット以上の撮影(メイクシーンの撮影サービス)全データ色修正、レタッチをしてDVDでの納品となります。\n撮って出しエンドロールは挙式まで撮影した写真を使用して編集したエンドロールをお開きまでに上映用のDVDでお仕上げで23,000円になります。'
const anonymized2 = '結婚式当日のスナップ写真撮影のお値段はXXX円になります。\nカメラマンは〇〇〇〇様がご希望な11時支度から16時30分披露宴お開きまで全て撮影します。カメラマンは支度開始時間の30分前現場に入らせて頂きます。\n挙式から披露宴送賓まで500カット以上の撮影(メイクシーンの撮影サービス)全データ色修正、レタッチをしてDVDでの納品となります。\n撮って出しエンドロールは挙式まで撮影した写真を使用して編集したエンドロールをお開きまでに上映用のDVDでお仕上げでXXX円になります。'

const text3 = '私の連絡先を記載しておきます。電話番号:090-1111-2222、メールアドレス:info@smooosy.com'
const anonymized3 = '私の連絡先を記載しておきます。電話番号:PHONE_NUMBER、メールアドレス:EMAIL_ADDRESS'

const text4 = '住所はこちらです: 〒107-0052、東京都港区赤坂4-22-19-601'
const anonymized4 = '住所はこちらです:〒ZIP_CODE、東京都港区赤坂4-22-19-601'

test.skip('anonymize', t => {
  t.is(anonymize(text1), anonymized1)
  t.is(anonymize(text2), anonymized2)
  t.is(anonymize(text3), anonymized3)
  t.is(anonymize(text4), anonymized4)
})

const request = {
  description: [
    {
      label: 'test1',
      type: 'multiple',
      answers: [ { text: text1 }, { text: text2 } ],
    },
    {
      label: 'test2',
      type: 'textarea',
      answers: [ { text: text3 } ],
    },
  ],
  meets: [
    {
      chats: [ { text: text1 }, { text: text4 } ],
    },
    {
      chats: [ { text: text3 }, { text: text4 } ],
    },
  ],
}

const anonymizedRequest = {
  description: [
    {
      label: 'test1',
      type: 'multiple',
      answers: [ { text: anonymized1 }, { text: anonymized2 } ],
    },
    {
      label: 'test2',
      type: 'textarea',
      answers: [ { text: anonymized3 } ],
    },
  ],
  meets: [
    {
      chats: [ { text: anonymized1 }, { text: anonymized4 } ],
    },
    {
      chats: [ { text: anonymized3 }, { text: anonymized4 } ],
    },
  ],
}

test.skip('anonymizeRequest', t => {
  t.is(JSON.stringify(anonymizeRequest(request)), JSON.stringify(anonymizedRequest))
})
