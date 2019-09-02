const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const payment = {
  pricePerPoint: {
    withTax: 162, // 150 * 1.08
    profit: 135, // 142 (average cost of point in yen) * ~5% refund rate on
  },
  // disable discount point price
  table: {
    810: 5,
    3240: 20,
    8100: 50,
    16200: 100,
    81000: 500,
    162000: 1000,
  },
  payjp: {
    script: 'https://js.pay.jp/',
    public: ENV === 'production' ? 'pk_live_dfbfb43c32f4eb930094b39f' : 'pk_test_c925d28747e054959b7ec6aa',
  },
  epsilon: {
    contractCode: '66065390',
  },
  cardBrandImages: {
    visa: '//checkout.pay.jp/images/creditcard/visa.png',
    mastercard: '//checkout.pay.jp/images/creditcard/mastercard.png',
    jcb: '//checkout.pay.jp/images/creditcard/jcb.png',
    americanexpress: '//checkout.pay.jp/images/creditcard/americanExpress.png',
    discover: '//checkout.pay.jp/images/creditcard/discover.png',
  },
  conveniTypes: {
    '21': {
      name: 'ファミリーマート',
      image: '/images/logo_famima.png',
      codeLabel: '注文番号',
      howto: '1. Famiポートのトップメニューの中から「コンビニでお支払」を選択します。\n2. 次画面のメニューの中から「収納票発行」を選択します。\n3. 画面に指示に従って「企業コード」と、「注文番号」を入力します。\n4. Famiポートより「Famiポート申込券」が発行されます。\n5. 「Famiポート申込券」をお持ちの上、レジにて代金をお支払下さい。',
    },
    '31': {
      name: 'ローソン',
      image: '/images/logo_lawson.png',
      phoneRequired: true,
      codeLabel: 'お支払い受付番号',
      howto: '1. Loppiのトップ画面の中から、「インターネット受付」をお選びください。\n2. 次画面のジャンルの中から「インターネット受付」をお選びください。\n3. 画面に従って「お支払い受付番号」と、ご注文いただいた際の「電話番号」をご入力下さい。\n4. Loppiより「申込券」が発券されます。\n5. 「申込券」お持ちの上、レジにて代金をお支払い下さい。',
    },
    '32': {
      name: 'セイコーマート',
      image: '/images/logo_seico.png',
      phoneRequired: true,
      codeLabel: '受付番号',
      howto: '1. セイコーマートクラブステーション（情報端末）のトップ画面の中から、「インターネット受付」をお選び下さい。\n2. 画面に従って「受付番号」と、お申し込み時の「電話番号」を入力ください。\n3. 「申込券（計3枚）」が発券されます。\n4. 「申込券（計3枚）」をお持ちの上、レジにて代金をお支払い下さい。',
    },
    '33': {
      name: 'ミニストップ',
      image: '/images/logo_ministop.png',
      phoneRequired: true,
      codeLabel: 'お支払い受付番号',
      howto: '1. Loppiのトップ画面の中から、「インターネット受付」をお選びください。\n2. 次画面のジャンルの中から「インターネット受付」をお選びください。\n3. 画面に従って「お支払い受付番号」と、ご注文いただいた際の「電話番号」をご入力下さい。\n4. Loppiより「申込券」が発券されます。\n5. 「申込券」お持ちの上、レジにて代金をお支払い下さい。',
    },
  },
  netbankTypes: {
    rakuten: {
      name: '楽天銀行',
      image: '/images/logo_rakuten.png',
    },
    jnb: {
      name: 'ジャパンネット銀行',
      image: '/images/logo_jnb.png',
    },
    payeasy: {
      code: '88',
      name: 'その他の銀行（ペイジー）',
      image: '/images/logo_payeasy.png',
      codeLabel: '確認番号',
      howto: '○銀行ATMでお支払い\n「Pay-easy」マークのあるATMから「税金・料金払込」をお選びください。\n○ネットバンキングでお支払い\n各金融機関のネットバンキングへログインし、「税金・料金振込」をお選びください。',
    },
  },
}

export default payment
