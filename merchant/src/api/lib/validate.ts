export {}
const { ngwords } = require('@smooosy/config')

module.exports = {
  requestValidateText,
  requestValidateNames,
  requestValidateName,
}

function hasEmail(word) {
  return /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\b/.test(word)
}

function hasPhone(word) {
  return /\b0\d{9,10}\b/.test((word || '').replace(/-/g, ''))
}

function requestValidateText(text) {
  const ret = []

  // 数字以外の同じ文字が連続10回
  const seqLetter = /(\D)\1{9}/
  const testlist = ['テスト', 'test']
  const nglist = [...ngwords]
  const tests = new RegExp(testlist.join('|'), 'i')
  const ngs = new RegExp(nglist.join('|'), 'i')

  if (ngs.test(text)) {
    ret.push('ngwords')
  }
  if (tests.test(text)) {
    ret.push('testwords')
  }
  if (seqLetter.test(text.trim())) {
    ret.push('repeat')
  }
  if (hasEmail(text)) {
    ret.push('hasEmail')
  }
  if (hasPhone(text)) {
    ret.push('hasPhone')
  }

  return ret
}

function requestValidateNames(firstname, lastname) {
  return {...requestValidateName(firstname), ...requestValidateName(lastname)}
}

function requestValidateName(name) {
  const ret: any = {}
  if (!name) return ret

  // ASCII(英数字記号)ひらがな全角カタカナ半角カタカナ（漢字以外の１文字だけの場合）
  const notname = /^[\x20-\x7E\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F]+$/
  // 同じ文字が連続2回
  const seq = /(.)\1{1}/
  // 要注意ワード
  const testlist = ['テスト', 'test']
  const nglist = [...ngwords]
  const tests = new RegExp(testlist.join('|'), 'i')
  const anonymous = /.*とくめい|匿名|名無し|ななし.*/
  const ngs = new RegExp(nglist.join('|'), 'i')

  if (ngs.test(name)) {
    ret.isNG = true
  }
  if (tests.test(name)) {
    ret.isTest = true
  }
  if (seq.test(name)) {
    ret.isRepeat = true
  }
  if (anonymous.test(name)) {
    ret.isAnonymous = true
  }
  if (hasEmail(name)) {
    ret.hasEmail = true
  }
  if (hasPhone(name)) {
    ret.hasPhone = true
  }
  if (notname.test(name) && name.length === 1) {
    // 1文字のみの場合
    ret.isNotName = true
  }

  return ret
}
