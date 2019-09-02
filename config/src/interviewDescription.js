/*
 * request modelのenumに使われているので
 * フラグを消す時は既存documentからも消す必要がある
 */
const interviewDescription = {
  admin: '運営による停止（見積もり不可）',
  early: '回答がはやすぎる',
  ngwords: 'NGワードが含まれる',
  testwords: 'テストワードが含まれる',
  notname: '名前が漢字以外の１文字のみ',
  blacklist: '入力欄チェックルールに該当する',
  repeat: '数字以外の同じ文字が連続している',
  service: '要聞き取りのサービス',
  protest: 'プロの依頼テスト？',
  duplicate: '重複依頼？',
  anonymous: '匿名希望？',
  hasEmail: 'メッセージにemailが含まれている',
  hasPhone: 'メッセージに電話番号が含まれている',
  bounce: 'メールバウンス',
  highPrice: '選択された価格が高い',
  highPoint: '請求ポイントが高い',
  phone: 'ブラックリストに含まれる電話番号',
  ip: 'ブラックリスト含まれるIP',
  personName: '人名が入力されている',
  viaLead: 'あんかけメール経由',
  viaNewRequest: 'あんかけページ経由',
  viaHelp: 'ヘルプページ経由',
  viaPro: 'プロページ経由',
}

export default interviewDescription
