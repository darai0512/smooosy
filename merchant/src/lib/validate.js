import { ngwords, isEmail } from '@smooosy/config'

const regexp = new RegExp(ngwords.join('|'), 'i')
export const descriptionMin = 70


export function hasNGWords(word) {
  return regexp.test(word)
}

export function hasEmail(word) {
  return /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\b/.test(word)
}

export function hasPhone(word) {
  return /\b0\d{9,10}\b/.test((word || '').replace(/-/g, ''))
}

export function hasURL(word) {
  return /\bhttps?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+\b/.test(word)
}

export function emailValidator(email) {
  const errors = {}
  if (!email) {
    errors.email = '必須項目です'
  } else if (!isEmail(email)) {
    errors.email = '正しいアドレスを入力してください'
  }

  return errors
}

export function emailWarn(email) {
  if (!email) return

  if (email.includes('@docomo.ne.jp')) {
    return '「docomo.ne.jp」はメールが届かない恐れがあります。Gmailなど、携帯キャリア以外のメールアドレスでお願いします。'
  } else if (email.includes('@ezweb.ne.jp')) {
    return '「ezweb.ne.jp」はメールが届かない恐れがあります。Gmailなど、携帯キャリア以外のメールアドレスでお願いします。'
  } else if (email.includes('@softbank.ne.jp')) {
    return '「softbank.ne.jp」はメールが届かない恐れがあります。Gmailなど、携帯キャリア以外のメールアドレスでお願いします。'
  }
}

export function passwordValidator(password, label = 'password') {
  const errors = {}
  if (!password) {
    errors[label] = '必須項目です'
  } else if (password.length < 6) {
    errors[label] = 'パスワードは6文字以上です'
  }

  return errors
}

export function phoneValidator(phone, required) {
  const errors = {}
  if (!phone) {
    if (required) {
      errors.phone = '必須項目です'
    }
  } else if (!/^(0[5-9]0\d{8}|0[1-9][1-9]\d{7})$/.test(phone.replace(/-/g, ''))) {
    errors.phone = '正しい電話番号を入力してください'
  }

  return errors
}

export function profileValidator(values) {
  const errors = {
    ...profileDescriptionValidator(values),
    ...profileAccomplishmentValidator(values),
    ...profileAdvantageValidator(values),
  }

  if (values.experience < 1) {
    errors.experience = '0以下は指定できません'
  }
  if (values.employees < 1) {
    errors.employees = '0以下は指定できません'
  }

  return errors
}

export function profileDescriptionValidator(values) {
  const errors = {}
  if (!values.description) {
    errors.description = '必須項目です'
  } else if (hasNGWords(values.description)) {
    errors.description = 'NGワードが含まれています'
  } else if (hasEmail(values.description)) {
    errors.description = 'メールアドレスが含まれています'
  } else if (hasPhone(values.description)) {
    errors.description = '電話番号が含まれています'
  } else if (hasURL(values.description)) {
    errors.description = 'URLが含まれています'
  } else if (values.description.length < descriptionMin) {
    errors.description = `あと${descriptionMin-values.description.length}文字以上入力してください`
  }
  return errors
}

export function profileAccomplishmentValidator(values) {
  const errors = {}
  if (hasNGWords(values.accomplishment)) {
    errors.accomplishment = 'NGワードが含まれています'
  } else if (hasEmail(values.accomplishment)) {
    errors.accomplishment = 'メールアドレスが含まれています'
  } else if (hasPhone(values.accomplishment)) {
    errors.accomplishment = '電話番号が含まれています'
  } else if (hasURL(values.accomplishment)) {
    errors.accomplishment = 'URLが含まれています'
  }
  return errors
}

export function profileAdvantageValidator(values) {
  const errors = {}
  if (hasNGWords(values.advantage)) {
    errors.advantage = 'NGワードが含まれています'
  } else if (hasEmail(values.advantage)) {
    errors.advantage = 'メールアドレスが含まれています'
  } else if (hasPhone(values.advantage)) {
    errors.advantage = '電話番号が含まれています'
  } else if (hasURL(values.advantage)) {
    errors.advantage = 'URLが含まれています'
  }
  return errors
}

export function requestValidateAnonymousName(name) {
  name = trimWhitespace(name)
  if (!name) {
    return { empty: true }
  }

  let ret = {}
  // ASCII(英数字記号)
  const notname = /^[\x20-\x7E]+$/
  const anonymous = /.*とくめい|匿名|名無し|ななし.*/

  if (anonymous.test(name)) {
    ret.isAnonymous = true
  }
  if (notname.test(name) && name.length === 1) {
    // 1文字のみの場合
    ret.notName = true
  }
  return ret
}

export function trimWhitespace(value) {
  if (typeof value === 'string') {
    return value.replace(/^[\s\u3000\u00A0]+|[\s\u3000\u00A0]+$/g, '')
  }
  return value
}

export function isAcceptablFileMime(list, mime) {
  for (let l of list) {
    if (new RegExp('^' + l.replace('*', '.+') + '$').test(mime)) {
      return true
    }
  }
  return false
}
