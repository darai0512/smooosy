export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  path: { type: String, required: true },
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, townpage) {
      delete townpage.__v
      return townpage
    },
  },
})

module.exports = mongoose.model('Townpage', schema)
