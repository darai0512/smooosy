export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  title: { type: String, required: true },
  urls: [{ type: String, required: true }],
  source: { type: String, required: true },
  description: String,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, scraping) {
      delete scraping.__v
      return scraping
    },
  },
})

module.exports = mongoose.model('Scraping', schema)
