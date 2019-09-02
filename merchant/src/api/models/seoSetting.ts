export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  category: {type: Schema.Types.ObjectId, ref: 'Category', required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service'},
  relatedServices: [{type: Schema.Types.ObjectId, ref: 'Service'}],
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
    transform: (doc, m) => {
      delete m.__v
      return m
    },
  },
  toJSON: {
    virtuals: true,
    transform: (doc, m) => {
      delete m.__v
      return m
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

schema.index({ category: 1, service: 1 }, { unique: true })

module.exports = mongoose.model('SeoSetting', schema)