export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  title: String,
  detail: String,
  assignee: {type: Schema.Types.ObjectId, ref: 'User'},
  type: {type: String, enum: ['licence', 'identification', 'interview', 'deactivate', 'negativeChat', 'other']},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  request: {type: Schema.Types.ObjectId, ref: 'Request'},
  meet: {type: Schema.Types.ObjectId, ref: 'Meet'},
  chat: {type: Schema.Types.ObjectId, ref: 'Chat'},
  done: {type: Boolean, default: false},
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

module.exports = mongoose.model('CSTask', schema)