export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lineId: { type: String, required: true },
  text: { type: String },
  template: { type: String },
  click: { type: Boolean, default: false },
  clickedAt: Date,
}, {
  timestamps: true,
  versionKey: false,
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

module.exports = mongoose.model('LineLog', schema)
