export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  profile: {type: Schema.Types.ObjectId, ref: 'Profile', required: true},
  request: {type: Schema.Types.ObjectId, ref: 'Request', required: true},
}, {
  timestamps: true,
})

schema.pre('update', async function(next) {
  this.setOptions({runValidators: true})
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.setOptions({runValidators: true, new: true})
  return next()
})

module.exports = mongoose.model('MatchExclusive', schema)
