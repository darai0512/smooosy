export {}
const crypto = require('crypto')
const config = require('config')

module.exports = {
  encrypt,
  decrypt,
}

// SEEDを変えるとdecryptできなくなるので注意
const SEED = config.get('encryptSeed')

function encrypt(text) {
  if (!text) {
    console.error('Encrypt receive empty argument')
    return ''
  }
  const cipher = crypto.createCipher('aes-256-cbc-hmac-sha256', SEED)
  cipher.update(text, 'utf8', 'hex')
  return cipher.final('hex')
}

function decrypt(hash) {
  if (!hash) {
    console.error('Decrypt receive empty argument')
    return ''
  }
  const decipher = crypto.createDecipher('aes-256-cbc-hmac-sha256', SEED)
  decipher.update(hash, 'hex', 'utf8')
  return decipher.final('utf8')
}
