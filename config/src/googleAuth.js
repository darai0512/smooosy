const ENV = process.env.TARGET_ENV || process.env.NODE_ENV

const googleAuth = ENV === 'production' ? {
  clientId: '1064345697016-3d4sleft1ijhpjbm4h2gfc5a7gs75n1v',
} : {
  clientId: '1064345697016-lbold8f98c8lobjjp1ilvep10iseki8j',
}

export default googleAuth
