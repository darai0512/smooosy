export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const { matchingBuckets } = require('../lib/matching/buckets')

const schema = new Schema({
  request: {type: Schema.Types.ObjectId, ref: 'Request', required: true},
  proService: {type: Schema.Types.ObjectId, ref: 'ProService', required: true},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile', required: true},
  isExactMatch: {type: Boolean},

  // Which matching algorithm bucket does this pro belong to?
  // See buckets.js for additional documentation on the meaning of
  // different bucket values
  matchingBucket: {
    type: 'String',
    enum: Object.values(matchingBuckets),
  },
  meetRate: Number,
  expectedMeetRate: Number,
  matchingAlgorithm: String,
  userBucket: String,
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

schema.statics.createIfNotExists = async function(data) {
  return this.update({
    request: data.request,
    proService: data.proService,
  }, { $setOnInsert: data }, { upsert: true })
}

schema.index({ request: 1, proService: 1 }, { unique: true })

module.exports = mongoose.model('Contact', schema)
