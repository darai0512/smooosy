export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  path: {type: String, required: true},
  word: {type: String, required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  title: String,
  description: String,
  prefecture: Boolean,
  count: Number,
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

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

module.exports = mongoose.model('Keyword', schema)
