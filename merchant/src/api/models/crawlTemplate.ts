export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  name: String,
  baseUrl: String,
  source: { type: String, enum: ['actions', 'script'], default: 'actions' },
  script: String,
  actions: [],
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

module.exports = mongoose.model('CrawlTemplate', schema)
