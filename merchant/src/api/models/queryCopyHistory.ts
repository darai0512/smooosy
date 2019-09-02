export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  operator: { type: Schema.Types.ObjectId, ref: 'User' },
  service: { type: Schema.Types.ObjectId, ref: 'Service' },
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: (doc, m) => {
      delete m.__v
      return m
    },
  },
})

module.exports = mongoose.model('QueryCopyHistory', schema)