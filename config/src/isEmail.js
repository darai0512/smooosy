function isEmail(email) {
  try {
    const emailParts = email.split('@')
    const domain = emailParts.pop()
    const user = emailParts.join('@')
    const userRegexp = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\.]+$/
    /* eslint-disable */
    const quotedEmailUserRegexp = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i
    /* eslint-enable */
    const domainParts = domain.split('.')

    const tld = domainParts.pop()
    if (!domainParts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
      return false
    }
    // disallow spaces
    if (/[\s\u2002-\u200B\u202F\u205F\u3000\uFEFF\uDB40\uDC20]/.test(tld)) {
      return false
    }

    //// DOMAIN PART
    for (let part, i = 0; i < domainParts.length; i++) {
      part = domainParts[i]
      part = part.replace(/_/g, '')
      if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
        return false
      }
      // disallow full-width chars
      if (/[\uff01-\uff5e]/.test(part)) {
        return false
      }
      if (part[0] === '-' || part[part.length - 1] === '-') {
        return false
      }
    }

    //// USER PART
    if (!user.length) return false
    // quoted user
    if (user[0] === '"') {
      const innerUser = user.slice(1, user.length - 1)
      return quotedEmailUserRegexp.test(innerUser)
    }
    // normal user
    const userParts = user.toLowerCase().split('.')
    for (var i = 0; i < userParts.length; i++) {
      if (userParts[i].length && !userRegexp.test(userParts[i])) {
        return false
      }
    }
    return true
  } catch (e) {
    return false
  }
}

export default isEmail
