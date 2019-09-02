export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const schema = new Schema({
  profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
  service: {type: Schema.Types.ObjectId, ref: 'Service'},
  target: {type: Schema.Types.ObjectId, refPath: 'reference'},
  reference: {
    type: 'String', enum: [ 'Service', 'Category' ],
  },
  image: String,
  caption: String,
  message: String,
  prices: [{
    title: String,
    value: String,
  }],
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

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('ProfileIntroduction', schema)