export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  request: {type: Schema.Types.ObjectId, ref: 'Request'},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
  pro: {type: Schema.Types.ObjectId, ref: 'User'},
  customer: {type: Schema.Types.ObjectId, ref: 'User'},
  text: String,
  type: {type: String},
  resolved: Boolean,
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

module.exports = mongoose.model('Feedback', schema)
