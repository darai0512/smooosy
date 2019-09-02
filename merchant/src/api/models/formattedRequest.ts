export {}
require('mongoose-geojson-schema')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  request: {type: Schema.Types.ObjectId, ref: 'Request', required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  title: String,
  public: Boolean,
  status: String,
  loc: Schema.Types.Point,
  address: String,
  prefecture: String,
  city: String,
  description: [{
    type: {type: String},
    label: String,
    answers: [{
      text: String,
      image: String,
      point: Number,
      checked: Boolean,
    }],
  }],
  point: Number,
  meets: [{
    feature: Boolean,
    chats: [{
      text: String,
      pro: Boolean,
    }],
    price: Number,
    priceType: String,
  }],
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, obj) {
      delete obj.__v
      return obj
    },
  },
})

schema.index({request: 1}, {unique: true})

schema
  .virtual('customer')
  .get(function() {
    return 'KSTNHMY'[(+new Date(this.createdAt)) % 7]
  })

schema
  .virtual('searchTitle')
  .get(function() {
    return (this.title || '[titleを設定]')
      .replace(/{{location([^}]*)}}/g, (m, c1) => this.address ? this.address + c1 : '')
      .replace(/{{price}}/g, this.averagePrice ? this.averagePrice.toLocaleString() + '円' : '')
  })

schema
  .virtual('averagePrice')
  .get(function() {
    const fixed = this.meets.filter(m => m.priceType === 'fixed')
    if (fixed.length === 0) return 0
    return Math.floor(fixed.reduce((sum, m) => sum + m.price, 0) / fixed.length / 100) * 100
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

module.exports = mongoose.model('FormattedRequest', schema)
