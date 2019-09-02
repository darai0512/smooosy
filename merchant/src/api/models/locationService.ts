export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  key: { type: String, required: true },
  name: { type: String, required: true },
  parentKey: { type: String, required: true },
  parentName: { type: String, required: true },
  path: { type: String, required: true, default: '' },
  keyPath: { type: String, required: true, default: '' },
  isGroup: { type: Boolean, default: false },
  count: Number,
  profiles: [{type: Schema.Types.ObjectId, ref: 'Profile'}],
  leads: [{type: Schema.Types.ObjectId, ref: 'Lead'}],
  reviews: [{type: Schema.Types.ObjectId, ref: 'Review'}],
  proServices: [{type: Schema.Types.ObjectId, ref: 'ProService'}],
  proAnswers: [{type: Schema.Types.ObjectId, ref: 'ProAnswer'}],
  relatedReviews: [{type: Schema.Types.ObjectId, ref: 'Review'}],
  relatedProServices: [{type: Schema.Types.ObjectId, ref: 'ProService'}],
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, locationService) {
      delete locationService.__v
      return locationService
    },
  },
})

schema.index({key: 1, parentKey: 1})
schema.index({keyPath: 1})
schema.index({service: 1})

module.exports = mongoose.model('LocationService', schema)
