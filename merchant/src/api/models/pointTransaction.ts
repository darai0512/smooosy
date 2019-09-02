export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  operator: {type: Schema.Types.ObjectId, ref: 'User'},
  point: {type: Number, required: true},
  expiredAt: Date,
  type: {type: String, enum: [
    'bought', 'autoCharge', 'limited', 'consume', 'expire', 'delete', 'refund', 'refundStarterPoint',
  ]},
  platform: {type: String, enum: [
    'payjp',   // PAY.JP https://pay.jp/
    'epsilon', // GMOイプシロン https://www.epsilon.jp/
    'manual',  // 手動での付与（現在は銀行振込のみ）
  ]},
  method: {type: String, enum: [
    'creditcard',   // platform='payjp'   クレジットカード
    'netbank',      // platform='epsilon' ネットバンキング
    'conveni',      // platform='epsilon' コンビニ決済
    'banktransfer', // platform='manual'  銀行振込
  ]},
  orderNumber: String,
  price: Number,
  campaign: String,
  description: String,
  // for refund
  request: {type: Schema.Types.ObjectId, ref: 'Request'},
  meet: {type: Schema.Types.ObjectId, ref: 'Meet'},
  breakdown: [{
    point: Number,
    expiredAt: Date,
  }],
  refund: Boolean,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, transactions) {
      delete transactions.__v
      return transactions
    },
  },
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

schema.index({user: 1, type: 1})
schema.index({type: 1})
schema.index({user: 1, campaign: 1})

module.exports = mongoose.model('PointTransaction', schema)
