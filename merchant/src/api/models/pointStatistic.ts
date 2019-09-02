export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  key: {type: String, required: true}, // YYYY-MM
  income: {
    bought: Number,
    limited: Number,
  },
  outgo: {
    bought: Number,
    limited: Number,
  },
  earned: Number,
  transaction: {type: Schema.Types.ObjectId, ref: 'PointTransaction'},
}, {
  timestamps: true,
  toObject: {
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

schema.index({user: 1, key: 1})

module.exports = mongoose.model('PointStatistic', schema)
