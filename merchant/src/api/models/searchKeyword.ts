export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  keyword: {type: String, required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  searchVolume: {type: Number, required: true},
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

schema.index({keyword: 1}, {unique: true})

module.exports = mongoose.model('SearchKeyword', schema)
