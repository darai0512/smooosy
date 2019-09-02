const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const univOrigin = ENV === 'production' ? '/univ' : '/univ'

export default univOrigin
