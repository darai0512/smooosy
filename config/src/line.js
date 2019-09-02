const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const line = ENV === 'production' ? {
  clientId: '1597584209',
  friendQR: 'http://qr-official.line.me/M/KvrlRfkQu2.png',
  friendLink: 'https://line.me/R/ti/p/%40dmg4696i',
} : {
  clientId: '1595433500',
  friendQR: 'http://qr-official.line.me/M/qAAGpV2arB.png',
  friendLink: 'https://line.me/R/ti/p/%40uaq6046p',
}

export default line
