export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  username: {type: String, required: true},
  text: {type: String, required: true},
  item: {type: Schema.Types.ObjectId, refPath: 'reference'},
  reference: String,
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

schema.index({item: 1})

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

module.exports = mongoose.model('Memo', schema)
