export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { isEmail } = require('@smooosy/config')

const schema = new Schema({
  template: { type: String },
  address: {
    type: String,
    validate: {
      validator: isEmail,
      message: '{VALUE} is not a valid email address',
    },
  },
  subject: { type: String },
  html: { type: String },
  request: { type: Schema.Types.ObjectId, ref: 'Request' },
  meet: { type: Schema.Types.ObjectId, ref: 'Meet' },
  substitutions: Object,
  open: { type: Boolean, default: false },
  openedAt: Date,
  click: { type: Boolean, default: false },
  clickedAt: Date,
  bounce: { type: Boolean, default: false },
  bouncedAt: Date,
}, {
  timestamps: true,
  versionKey: false,
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

schema.index({ address: 1, createdAt: -1 })
schema.index({ template: 1, createdAt: -1 })
schema.index({ request: 1, template: 1 })

module.exports = mongoose.model('MailLog', schema)
