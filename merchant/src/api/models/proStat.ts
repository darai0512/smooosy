export {}
require('mongoose-geojson-schema')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const moment = require('moment')

const proStats = require('../lib/proStats')

const lookbackDates = [ 'last1Month', 'last3Months' ]

const schema = new Schema({
  pro: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  profiles: [{type: Schema.Types.ObjectId, ref: 'Profile'}],
  email: String,
  profileNames: [String],
  address: [String],
  phone: String,
  lastAccessedAt: Date,
  receiveCount: Number,
  meetsCount: Number,
  hiredCount: Number,
  hiredRate: Number,
  hiredPrice: Number,
  chargePrice: Number,
  returnOnInvestment: Number,
  limitedPoint: Number,
  registeredAt: Date,

  // 先月の実績
  receiveCountLastMonth: Number,
  meetsCountLastMonth: Number,
  hiredCountLastMonth: Number,
  hiredPriceLastMonth: Number,
  chargePriceLastMonth: Number,
  returnOnInvestmentLastMonth: Number,

  // xxxLast3Monthsは3ヶ月間の1ヶ月あたりの平均・xxxLast1Monthは最近1ヶ月の値
  receiveCountLast3Months: Number,
  receiveCountLast1Month: Number,
  hiredCountLast3Months: Number,
  hiredCountLast1Month: Number,
  meetsCountLast3Months: Number,
  meetsCountLast1Month: Number,
  meetRateLast3Months: Number,
  meetRateLast1Month: Number,

  increaseMeetCount: Boolean,
  increaseMeetRate: Boolean,

  byService: [{
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    byLookbackDate: [{
      lookbackDate: { type: 'String', enum: lookbackDates },
      meetRate: Number,
      receiveCount: Number,
      meetsCount: Number,
      hiredCount: Number,
      hiredRate: Number,
      hiredPrice: Number,
    }],
  }],
}, {
  timestamps: true,
  versionKey: false,
  toObject: {
    virtuals: true,
    transform,
  },
  toJSON: {
    virtuals: true,
    transform,
  },
})

function transform(doc, obj) {
  delete obj.__v
  return obj
}

schema.index({profiles: 1})

schema
  .virtual('profile', {
    ref: 'Profile',
    localField: 'pro',
    foreignField: 'pro',
    justOne: true,
  })


schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

schema.methods.calc = async function() {
  const [user, profiles, meets, transactions] = await Promise.all([
    this.model('User').findOne({_id: this.pro}).select('email phone lastAccessedAt createdAt').lean(),
    this.model('Profile').find({pro: this.pro}).select('id name address').lean(),
    this.model('Meet').find({pro: this.pro}).select('createdAt hiredAt status price priceType service').lean(),
    this.model('PointTransaction').find({user: this.pro}).select('createdAt type point price').lean(),
  ])

  if (user === null) return

  this.lastAccessedAt = user.lastAccessedAt
  this.registeredAt = user.createdAt
  this.email = user.email
  this.phone = user.phone

  this.profiles = profiles.map(p => p._id)
  this.profileNames = profiles.map(p => p.name)
  this.address = profiles.map(p => p.address)

  const receive = await this.model('Request').find({sent: { $in: this.profiles }}).select('createdAt service')

  this.setAllTimeStats({receive, meets, transactions })
  this.setPreviousMonthStats({ receive, meets, transactions })
  this.setLast1MonthStats({ receive, meets, transactions })
  this.setLast3MonthsStats({ receive, meets, transactions })
  this.setPerServiceStats({ receive, meets })

  this.increaseMeetCount = this.meetsCountLast3Months < this.meetsCountLast1Month

  this.increaseMeetRate = this.meetRateLast3Months < this.meetRateLast1Month
}

schema.methods.setAllTimeStats = function({receive, meets, transactions}) {
  const {
    receiveCount, meetsCount, hiredCount, hiredRate, hiredPrice, chargePrice,
    returnOnInvestment, limitedPoint,
  } = proStats.calculate({ receive, meets, transactions })

  this.receiveCount = receiveCount
  this.meetsCount = meetsCount
  this.hiredCount = hiredCount
  this.hiredRate = hiredRate
  this.hiredPrice = hiredPrice
  this.chargePrice = chargePrice
  this.returnOnInvestment = returnOnInvestment
  this.limitedPoint = limitedPoint
}

schema.methods.setPreviousMonthStats = function({receive, meets, transactions}) {
  // 先月の実績
  const startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate()
  const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate()
  const isLastMonth = d => startOfLastMonth <= d && d <= endOfLastMonth

  const { meetsCount, receiveCount, hiredCount, hiredPrice, chargePrice, returnOnInvestment,
  } = proStats.calculate({
    receive, meets, transactions, filter: isLastMonth,
  })

  this.meetsCountLastMonth = meetsCount
  this.receiveCountLastMonth = receiveCount
  this.hiredCountLastMonth = hiredCount
  this.hiredPriceLastMonth = hiredPrice
  this.chargePriceLastMonth = chargePrice
  this.returnOnInvestmentLastMonth = returnOnInvestment
}

schema.methods.setLast1MonthStats = function({receive, meets, transactions}) {
  // 過去1ヶ月
  const today = new Date()
  const oneMonthAgo = today.setMonth(today.getMonth() - 1)
  const isWithin1Month = d => d >= oneMonthAgo

  const { meetsCount, meetRate, receiveCount, hiredCount,
  } = proStats.calculate({
    receive, meets, transactions, filter: isWithin1Month,
  })

  this.receiveCountLast1Month = receiveCount
  this.meetsCountLast1Month = meetsCount
  this.meetRateLast1Month = meetRate
  this.hiredCountLast1Month = hiredCount
}

schema.methods.setLast3MonthsStats = function({receive, meets, transactions}) {
  // 過去3ヶ月
  const today = new Date()
  const threeMonthsAgo = today.setMonth(today.getMonth() - 3)
  const isWithin3Months = d => d >= threeMonthsAgo

  const { meetsCount, meetRate, receiveCount, hiredCount,
  } = proStats.calculate({
    receive, meets, transactions, filter: isWithin3Months,
  })

  this.receiveCountLast3Months = receiveCount / 3
  this.meetsCountLast3Months = meetsCount / 3
  this.meetRateLast3Months = meetRate
  this.hiredCountLast3Months = hiredCount / 3
}

schema.methods.setPerServiceStats = function({receive, meets}) {
  const today = new Date()
  const oneMonthAgo = today.setMonth(today.getMonth() - 1)
  const threeMonthsAgo = today.setMonth(today.getMonth() - 12)

  this.byService = Object.values(proStats.calculateByService({
    receive,
    meets,
    lookbackDateMap: {
      last1Month: oneMonthAgo,
      last3Months: threeMonthsAgo,
    },
  }))
}

module.exports = mongoose.model('ProStat', schema)
