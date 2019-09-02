export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  type: {type: String, required: true, enum: [
    'phone', 'consulting', 'job', 'block',
  ]},
  status: {type: String, enum: [
    'pending', 'decline', 'accept', 'cancel',
  ]},
  meet: {type: Schema.Types.ObjectId, ref: 'Meet'},
  startTime: Date,
  endTime: Date,
  info: {
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    phone: String,
    address: String,
  },
  recurrence: {type: String, enum: [
    'week', 'month',
  ]},
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, schedule) {
      delete schedule.__v
      return schedule
    },
  },
})

schema.index({user: 1})

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

module.exports = mongoose.model('Schedule', schema)
