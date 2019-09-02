const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const wpOrigin = ENV === 'production' ? '/media' : 'https://dev.smooosy.jp/media'

export default wpOrigin
