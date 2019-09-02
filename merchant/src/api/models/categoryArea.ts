export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  place: {type: String, required: true},
  key: {type: String, required: true},
  categoryKey: {type: String, required: true},
  category: {type: Schema.Types.ObjectId, ref: 'Category', required: true},
  description: {type: String},
  pageDescription: {type: String},
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

module.exports = mongoose.model('CategoryArea', schema)
