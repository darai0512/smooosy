const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const imageOrigin = ENV === 'production' ? '/img' : '/img'

export default imageOrigin
