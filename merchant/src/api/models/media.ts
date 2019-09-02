export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')
const mediaVirtuals = require('../lib/virtuals/media')

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  type: {type: String, required: true, enum: [ 'image', 'video' ]},
  video: { youtube: String },
  text: String,
  ext: String,
  rotation: Number,
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

schema.index({user: 1})

schema
  .virtual('url')
  .get(function() {
    return mediaVirtuals.url(this)
  })

schema.plugin(mongooseLeanVirtuals)

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

module.exports = mongoose.model('Media', schema)
