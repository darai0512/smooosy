import interviewDescription from './interviewDescription'
const types = {
  CATEGORY: 'category',
  DATE_RANGE: 'dateRange',
  NUMBER_RANGE: 'numberRange',
  PERCENT_RANGE: 'percentRange',
  RATE: 'rate',
  REGEXP: 'regexp',
  CHECKBOX: 'checkbox',
  SERVICE: 'service',
  MULTI_SELECT: 'multiSelect',
}

/*
 * searchCondition modelのenumに使われているので
 * フラグを消す時は既存documentからも消す必要がある
 */
const proSearchConditions = {
  category: {
    label: 'カテゴリ',
    type: types.CATEGORY,
  },
  service: {
    label: 'サービス',
    type: types.SERVICE,
  },
  registeredAt: {
    label: '登録日',
    type: types.DATE_RANGE,
    placeholder: '2018/03/01',
  },
  lastAccessedAt: {
    label: '最終ログイン日',
    type: types.DATE_RANGE,
    placeholder: '2018/03/01',
  },
  chargePrice: {
    label: '課金額',
    type: types.NUMBER_RANGE,
    unit: '円',
  },
  receiveCount: {
    label: '依頼受取数',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  receiveCountLast1Month: {
    label: '依頼受取数(1ヶ月)',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  receiveCountLast3Months: {
    label: '依頼受取数(3ヶ月)',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  meetsCount: {
    label: '見積もり数',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  meetsCountLast1Month: {
    label: '見積もり数(1ヶ月)',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  meetsCountLast3Months: {
    label: '見積もり数(3ヶ月)',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  meetRate: {
    label: '見積もり率',
    type: types.PERCENT_RANGE,
    unit: '%',
  },
  meetRateLast1Month: {
    label: '見積もり率(1ヶ月)',
    type: types.PERCENT_RANGE,
    unit: '%',
  },
  meetRateLast3Months: {
    label: '見積もり率(3ヶ月)',
    type: types.PERCENT_RANGE,
    unit: '%',
  },
  hiredCount: {
    label: '成約数',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  hiredCountLast1Month: {
    label: '成約数(1ヶ月)',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  hiredCountLast3Months: {
    label: '成約数(3ヶ月)',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
  hiredRate: {
    label: '成約率',
    type: types.PERCENT_RANGE,
    unit: '%',
  },
  returnOnInvestment: {
    label: 'ROI',
    type: types.NUMBER_RANGE,
  },
  increaseMeetRate: {
    label: '見積もり率変化',
    type: types.RATE,
    items: ['増加', '減少'],
  },
  increaseMeetCount: {
    label: '見積もり数変化',
    type: types.RATE,
    items: ['増加', '減少'],
  },
  address: {
    label: '住所',
    type: types.REGEXP,
  },
  email: {
    label: 'メールアドレス',
    type: types.REGEXP,
  },
  phone: {
    label: '電話番号',
    type: types.REGEXP,
  },
  profileNames: {
    label: '名前',
    type: types.REGEXP,
  },
  availableRequest: {
    label: '応募可能依頼',
    type: types.NUMBER_RANGE,
    unit: '件',
  },
}

const requestSearchConditions = {
  createdAt: {
    label: '依頼作成日',
    name: 'createdAt',
    type: types.DATE_RANGE,
  },
  category: {
    label: 'カテゴリ',
    name: 'category',
    type: types.CATEGORY,
  },
  service: {
    label: 'サービス',
    name: 'service',
    type: types.SERVICE,
  },
  address: {
    label: '住所',
    name: 'address',
    type: types.REGEXP,
  },
  point: {
    label: 'ポイント',
    name: 'point',
    type: types.NUMBER_RANGE,
  },
  price: {
    label: '予算',
    name: 'price',
    type: types.NUMBER_RANGE,
  },
  meets: {
    label: '見積もり数',
    name: 'meets',
    type: types.NUMBER_RANGE,
  },
  // TODO: api未実装
  //date: {
  //  label: '日程',
  //  name: 'date',
  //  type: types.DATE_RANGE,
  //},
  status: {
    label: 'ステータス',
    name: 'status',
    type: types.CHECKBOX,
    items: [
      {label: '募集中', name: 'open'},
      {label: '成約', name: 'close'},
      {label: 'キャンセル', name: 'suspend'},
      {label: '削除', name: 'deleted'},
      {label: '期限切れ', name: 'expired'},
    ],
  },
  interview: {
    label: 'フラグ',
    name: 'interview',
    type: types.MULTI_SELECT,
    items: [{label: 'Any', name: 'any'}].concat(Object.keys(interviewDescription).map(i => ({label: interviewDescription[i], name: i}))),
  },
  option: {
    label: 'その他',
    name: 'option',
    type: types.CHECKBOX,
    items: [{label: 'ユーザー画像あり', name: 'picture'}, {label: '全件未読', name: 'unread'}, {label: '電話番号あり', name: 'hasPhoneNum'}],
  },
}

const leadSearchConditions = {
  industry: {
    label: '業種(カンマ区切り)',
    type: types.REGEXP,
  },
  services: {
    label: 'サービス',
    type: types.SERVICE,
  },
  date: {
    label: '取得日',
    type: types.DATE_RANGE,
    options: { hideTo: true },
  },
  createdAt: {
    label: '読み込み日',
    type: types.DATE_RANGE,
    options: { hideTo: true },
  },
  email: {
    label: 'メールアドレス',
    type: types.REGEXP,
  },
  phone: {
    label: '電話番号',
    type: types.REGEXP,
  },
  fax: {
    label: 'FAX番号',
    type: types.REGEXP,
  },
  name: {
    label: '名前',
    type: types.REGEXP,
  },
  source: {
    label: 'データ元',
    type: types.REGEXP,
  },
  address: {
    label: '住所',
    type: types.REGEXP,
  },
  post: {
    label: 'お問い合わせ投稿',
    items: [{name: 'posted', label: '投稿済'}, {name: 'notPosted', label: '未投稿'}, {name: 'postFailed', label: '投稿失敗'}, {name: 'formUrl', label: 'フォームURLあり'}],
    type: types.CHECKBOX,
  },
}

export default {pro: proSearchConditions, request: requestSearchConditions, lead: leadSearchConditions, types}
