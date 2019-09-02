export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema


const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  checked: {type: Boolean, required: true, default: false},
  link: {type: String, required: true},
  type: {type: String, required: true, enum: [
    'newRequest', // pro
    'newContact', // pro
    'newChat', // both
    'workStart', // pro
    'meetEnd', // user
    'paymentFailed', // pro
    'reviewDone', // pro
    'reviewAppend', // pro
    'reviewReply', // user
    'identificationValid', // pro
    'identificationInvalid', // pro
    'newMeet', // user
    'bookingRequest', // pro
    'remindMeets', // user
    'thanks', // both
    'addEmail', // both
    'lowBudget', // pro
    'refund', // pro
    'refundStarterPoint', // pro
    'pointBack', // pro
  ]},
  title: {type: String, required: true},
  description: {type: String, required: true},
  target: {
    model: { type: String, enum: [
      'Request', 'Meet', 'User', 'Schedule', 'Profile', 'ProService',
    ] },
    item: { type: Schema.Types.ObjectId, refPath: 'target.model' },
  },
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, notice) {
      delete notice.__v
      return notice
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

schema.index({ user: 1, createdAt: -1 })
schema.index({ user: 1, type: 1, target: 1 })

module.exports = mongoose.model('Notice', schema)
