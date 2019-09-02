export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  userId: String,
  displayName: String,
  pictureUrl: String,
  statusMessage: String,
  blocked: { type: Boolean, default: false },
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

schema.index({userId: 1}, {unique: true})

module.exports = mongoose.model('LineProfile', schema)
