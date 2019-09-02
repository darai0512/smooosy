export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const schema = new Schema({
  layout: [
    {
      type: { type: String, default: 'text', enum: [
        'pickupProfiles', 'pickupProAnswers', 'requestExample', 'whatIs',
        'pageDescription', 'pageInformation', 'proMedia',
      ]},
      column: { type: Number, min: 1, max: 12 },
      options: {
        price: { type: Boolean, default: false },
        pickupMedia: { type: Boolean, default: false },
        zipbox: { type: Boolean, default: false },
      },
    },
  ],
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

schema.plugin(mongooseLeanVirtuals)

schema.virtual('id').get(function() {
  return this._id.toString()
})

module.exports = mongoose.model('PageLayout', schema)
