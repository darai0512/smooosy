export {}
const config = require('config')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  type: {type: String, default: 'text', enum: [
    'text', 'image', 'file', 'audio', 'booking', 'invoice', 'price',
  ]},
  text: String,
  ext: String,
  system: Boolean,
  read: Boolean,
  booking: {
    schedule: {type: Schema.Types.ObjectId, ref: 'Schedule'},
    action: {type: String,  enum: [
      'request', 'decline', 'accept', 'cancel',
    ]},
  },
  accounting: {type: Schema.Types.ObjectId, ref: 'Accounting'},
  emotionalScore: Number,
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

schema
  .virtual('url')
  .get(function() {
    switch (this.type) {
      case 'image':
        return `${config.get('bucketOrigin')}/chats/${this.id}.${this.ext || 'jpg'}?${this.updatedAt.getTime()}`
      case 'file':
      case 'invoice':
      case 'audio':
        return `${config.get('s3Origin')}/chats/${this.id}.${this.ext}?${this.updatedAt.getTime()}`
      default:
        return null
    }
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


module.exports = mongoose.model('Chat', schema)
