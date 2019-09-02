export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const schema = new Schema({
  proQuestion: {type: Schema.Types.ObjectId, ref: 'ProQuestion'},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
  pro: {type: Schema.Types.ObjectId, ref: 'User'},
  isPublished: {type: Boolean, default: true},
  loc: {type: Schema.Types.Point, required: true},
  prefecture: String,
  text: String,
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

schema.index({proQuestion: 1, prefecture: 1, isPublished: 1})
schema.index({loc: '2dsphere'})

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('ProAnswer', schema)
