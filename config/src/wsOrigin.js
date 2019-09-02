const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const wsOrigin = ENV === 'production' ? 'https://ws.smooosy.jp' : 'http://localhost:8000'

export default wsOrigin
