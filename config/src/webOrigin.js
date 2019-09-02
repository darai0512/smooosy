const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const webOrigin = ENV === 'production' ? '' : 'http://localhost:3000'

export default webOrigin
