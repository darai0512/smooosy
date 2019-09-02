export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  searchKeyword: {type: Schema.Types.ObjectId, ref: 'SearchKeyword', required: true},
  keyword: { type: String },
  location: { type: String },
  date: { type: Date },
  rank: { type: String },
  url: {type: String},
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


module.exports = mongoose.model('SearchKeywordRanking', schema)
