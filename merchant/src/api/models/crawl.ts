export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  name: String,
  inputType: { type: String, enum: [ 'url', 'template' ], default: 'url' },
  inputUrls: [{
    type: String,
  }],
  inputTemplate: {type: Schema.Types.ObjectId, ref: 'CrawlTemplate'},
  template: {type: Schema.Types.ObjectId, ref: 'CrawlTemplate'},
  services: [{type: Schema.Types.ObjectId, ref: 'Service'}],
  status: {
    type: String, enum: [
      'draft', 'waiting', 'progress', 'done', 'error', 'inserted',
    ],
  },
  result: [],
  executedAt: Date,
  counters: {
    insertCount: { type: Number, default: 0 },
    phone: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    formUrl: { type: Number, default: 0 },
    url: { type: Number, default: 0 },
  },
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

module.exports = mongoose.model('Crawl', schema)
