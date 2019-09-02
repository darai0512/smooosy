export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  text: String,
  tags: [String],
  isPublished: {type: Boolean, default: false},
  proAnswers: [{type: Schema.Types.ObjectId, ref: 'ProAnswer'}],
  publishedProAnswerCount: {type: Number, default: 0},
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

schema.index({tags: 1})

module.exports = mongoose.model('ProQuestion', schema)
