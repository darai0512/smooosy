export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { logType, actionType, resultType } = require('@smooosy/config').csLogs

const schema = new Schema({
  caller: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  type: {type: String, enum: logType, required: true},
  action: {type: String, enum: Array.from(new Set([].concat(...Object.values(actionType))))},
  result: {type: String, enum: resultType},
  time: {type: Number, min: 0, default: 0},
  note: String,
  isMemo: {type: Boolean, default: false},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  request: {type: Schema.Types.ObjectId, ref: 'Request'},
  lead: {type: Schema.Types.ObjectId, ref: 'Lead'},
}, {
  timestamps: true,
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

module.exports = mongoose.model('CSLog', schema)
