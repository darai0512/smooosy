export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { MeetStatusType, discountReasons } = require('@smooosy/config')

const priceValueResultSchema = require('./priceValueResultSchema')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')


const schema = new Schema({
  pro: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile', required: true},
  customer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  request: {type: Schema.Types.ObjectId, ref: 'Request', required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  status: {type: String, required: true, enum: [
    'waiting', 'progress', 'done', 'exclude',
  ], default: 'waiting'},
  chatStatus: {type: String, enum: [MeetStatusType.UNREAD, MeetStatusType.READ, MeetStatusType.RESPONDED], default: 'unread'},
  remindReason: String,
  excludeReason: String,
  archive: Boolean,
  price: {type: Number, min: 0, required: true},
  priceType: {type: String, required: true, enum: [
    'fixed', 'hourly', 'float', 'needMoreInfo', 'tbd', 'minimum',
  ], default: 'fixed'},
  priceValues: priceValueResultSchema,
  chats: [{type: Schema.Types.ObjectId, ref: 'Chat'}],
  review: {type: Schema.Types.ObjectId, ref: 'Review'},
  read: Boolean,
  readByPro: Boolean,
  displayPhone: Boolean,
  point: Number,
  discounts: [{
    reason:  {type: String, enum: Object.keys(discountReasons)},
    point: Number,
  }],
  refund: Boolean,
  hiredAt: Date,
  additionalStatus: String,
  count: Number,
  accounting: {type: Schema.Types.ObjectId, ref: 'Accounting'},
  isCreatedByUser: Boolean,
  proResponseStatus: {type: String, enum: [
    'inReview', 'autoAccept', 'tbd', 'accept', 'decline',
  ]},
  isExactMatch: Boolean,
  distance: Number,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
    transform,
  },
  toJSON: {
    virtuals: true,
    transform,
  },
})

function transform(doc, obj) {
  delete obj.__v
  return obj
}

schema.index({pro: 1})
schema.index({request: 1})
schema.index({customer: 1})
schema.index({createdAt: 1})
schema.index({service: 1})
schema.index({profile: 1})

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

const postRemove = (doc, next) => {
  doc.model('Chat').remove({_id: {$in: doc.chats}})
  next()
}

schema.post('findOneAndRemove', postRemove)
schema.post('remove', postRemove)

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('Meet', schema)
