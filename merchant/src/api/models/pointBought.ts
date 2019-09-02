export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  point: {type: Number, required: true},
  starterPoint: Number,
  starterPointRunOutAt: Date,
  starterPointRefunded: Boolean,
  lastUpdatedAt: Date,
  deleted: Boolean,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, data) {
      delete data.__v
      return data
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


module.exports = mongoose.model('PointBought', schema)
