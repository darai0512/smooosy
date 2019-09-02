export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  title: {type: String, required: true},
  body: {type: String, required: true},
  isPublished: {type: Boolean, default: false},
  usedCount: {type: Number, default: 0},
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, meetTemplate) {
      delete meetTemplate.__v
      return meetTemplate
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

module.exports = mongoose.model('MeetTemplate', schema)
