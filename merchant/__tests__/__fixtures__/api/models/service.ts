export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { Service } = require('../../../../src/api/models')
const { createCategory } = require('./category')

const createService = async (props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }
  if (!props.category) {
    props.category = await createCategory()
  }

  const defaults: any = {
    key: `test-service${props._id}`,
    name: 'テストサービス',
    queries: [],
    tags: [
      props.category.name,
    ],
    description: 'テストサービスの説明',
    imageUpdatedAt: new Date(),
    enabled: true,
    providerName: 'テストサービス',
    priority: 80,
    pageTitle: 'テストサービスのタイトル',
    pageDescription: 'テストサービスページの説明',
    pickupMedia: [],
    basePoint: 5,
    priceComment: '<div style="font-size: 13px;white-space:initial;">\nSMOOOSYでの見積もり価格の分布です。\n<br /><br />\n<b>価格を左右する要素：</b>\n<br /><br />\n<ol>\n<li><b>撮影時間の長さ</b>（メイクシーン・挙式・披露宴・二次会のどれを撮影するのかによって価格が変動します）</li>\n<li><b>オプション</b>（ビデオ撮影、エンドロール、アルバム作成があると価格が大きく変わります）</li>\n<li><b>撮影時期</b>（春や秋、週末はハイシーズンとなります）</li>\n</div>',
    interview: false,
    needMoreInfo: false,
    similarServices: [],
    wpId: 11,
    pageInformation: [
      {
        type: 'text',
        column: 2,
        title: 'タイトル',
        text: 'テキスト',
      },
      {
        type: 'text',
        column: 2,
        title: 'タイトル',
        text: 'テキスト',
      },
    ],
  }

  return await Service.create({ ...defaults, ...props })
}

module.exports = {
  createService,
}
