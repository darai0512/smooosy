const logType = ['call', 'email']

const actionType = {
  pro: ['ONB', 'コンシェル', 'プロからの要望', 'その他'],
  user: ['通常', '既読にしよう'],
  lead: ['通常'],
}

const resultType = [
  'NA',
  'NA, LM',
  '0120',
  '不正なCTC# (他人・存在しない)',
  'DONE',
]

export default {
  logType,
  actionType,
  resultType,
}
