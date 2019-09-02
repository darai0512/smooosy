export {}
const config = require('config')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

import priceValueSchema from './priceValueSchema'
const { relativeTime } = require('../lib/date')

const schema = new Schema({
  key: {type: String},
  name: {type: String, required: true},
  category: {type: Schema.Types.ObjectId, ref: 'Category'},
  tags: [{type: String}],
  priority: {type: Number, default: 0},
  queries: [{type: Schema.Types.ObjectId, ref: 'Query'}],
  allowsTravelFee: Boolean,
  proQuestions: [{type: Schema.Types.ObjectId, ref: 'ProQuestion'}],
  enabled: {type: Boolean, default: false},
  deleted: {type: Boolean, default: false},
  providerName: {type: String, default: 'プロ'},
  pageTitle: {type: String}, // titleタグ
  pageMetaDescription: {type: String}, // meta description
  description: {type: String}, // ショートキャッチ
  pageDescription: {type: String}, // ロングキャッチ
  pageInformation: [
    {
      type: { type: String, default: 'text', enum: [
        'text', 'zipbox', 'price',
      ]},
      column: { type: Number, min: 1, max: 12 },
      title: String,
      text: String,
      image: String,
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      alt: String,
      ratio: String,
    },
  ],
  pageLayouts: {
    top: {type: Schema.Types.ObjectId, ref: 'PageLayout'},
    pref: {type: Schema.Types.ObjectId, ref: 'PageLayout'},
    city: {type: Schema.Types.ObjectId, ref: 'PageLayout'},
  },
  imageUpdatedAt: Date,
  pickupMedia: [{type: Schema.Types.ObjectId, ref: 'Media'}],
  priceComment: String,
  basePoint: Number,
  interview: {type: Boolean, default: false},
  needMoreInfo: {type: Boolean, default: false},
  similarServices: [{type: Schema.Types.ObjectId, ref: 'Service'}],
  recommendServices: [{type: Schema.Types.ObjectId, ref: 'Service'}],
  eliminateTime: {type: Number, default: 60},
  wpId: Number,
  distance: Number,
  budgetBasedDistanceFormula: {
    isEnabled: Boolean,
    minBudget: Number,
    multiplier: Number,
  },
  requestCount: { type: Number, default: 0 },
  mediaListPageDescription: {type: String},
  spContentTopFlag: { type: Boolean }, // TODO: 移行後消す
  priceEstimateQueries: [{
    query: {type: Schema.Types.ObjectId, ref: 'Query'},
    options: [{type: Schema.Types.ObjectId, ref: 'Option'}],
  }],
  budgetMin: Number,
  budgetMax: Number,
  priceArticleId: Number,
  matchMoreEditable: Boolean, // pro can edit MatchMore setting
  matchMoreEnabled: Boolean, // customer can instantMatch pros
  maxPointCost: Number,
  averagePoint: {type: Number, default: 0},
  manualAveragePoint: {type: Number, default: 0},
  estimatePriceType: {type: String, default: 'fixed', enum: [
    'fixed', 'float', 'minimum',
  ]},
  // schema used to generate a "budget price" for the service
  // if usePriceValueBudget is enabled
  priceValues: [priceValueSchema],
  pricesToPoints: [{
    price: Number,
    points: Number,
  }],
  usePriceValueBudget: Boolean,
  // Enables target locations for the service.
  // Pros will see city-level area selection in the pro service location
  // setting page and will be ranked higher for requests that match their
  // target locations.
  useTargetLocations: Boolean,
  showTargetLocationsToPros: Boolean,
  // this is for the service which has only one base-price.
  // used for ProService.priceValues and for calculating price.
  // when not being single base-price, this has to be null.
  singleBasePriceQuery: {
    title: String,
    helperText: String,
    label: String,
  },
  // If this is enabled, pros will see job requirements in the pro service page
  showJobRequirements: Boolean,
  // Show annotation in InstantResultPage
  // If null, nothing is shown
  instantResultAnnotation: String,
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

schema.plugin(mongooseLeanVirtuals)

schema.index({tags: 1, priority: -1})

schema.virtual('id').get(function() {
  return this._id.toString()
})

schema
  .virtual('image')
  .get(function() {
    if (!this.imageUpdatedAt) {
      return `${config.get('bucketOrigin')}/services/noimage.png?`
    }

    const time = this.imageUpdatedAt.getTime()
    return `${config.get('bucketOrigin')}/services/${this._id}.jpg?${time}`
  })

schema.methods.calcMeetEstimation = async function() {
  const requests = await this.model('Request')
    .find({service: this._id, 'meets.0': {$exists: true}})
    .populate({
      path: 'meets',
      select: 'createdAt',
      options: {
        sort: 'createdAt',
      },
    })
    .select('meets createdAt')
    .lean()
  const meetCounts = requests.map(r => r.meets.length).sort((a, b) => a - b)
  const timeToFirstMeets = requests.map(r => r.meets[0].createdAt - r.createdAt).sort((a, b) => a - b)

  const count = {
    median: meetCounts[Math.round(meetCounts.length / 2) - 1],
    Q3: meetCounts[Math.round(meetCounts.length * 3 / 4) - 1],
  }
  const estimatedMeetCount = {
    from: 1,
    to: 3,
  }

  // convert to minutes
  const time = {
    median: timeToFirstMeets[Math.round(timeToFirstMeets.length / 2) - 1] / 1000 / 60,
    Q1: timeToFirstMeets[Math.round(timeToFirstMeets.length / 4) - 1] / 1000 / 60,
  }
  const timeToFirstMeet = {
    from: '1時間',
    to: '5時間',
  }

  // # of meets is enough (not less than 10)
  if (requests.length >= 10) {
    estimatedMeetCount.from = Math.min(Math.max(1, count.median), 4) // 1~4
    estimatedMeetCount.to = Math.min(5, Math.max(count.Q3, estimatedMeetCount.from + 1, 3)) // 2~5 && to > from
    // median is not too large (not more than 5 hrs)
    if (time.median <= 300) {
      const now: any = new Date()
      timeToFirstMeet.from = relativeTime(now - time.Q1 * 1000 * 60, now, {noSuffix: true})
      timeToFirstMeet.to = relativeTime(now - time.median * 1000 * 60, now, {noSuffix: true})
    }
  }

  return {timeToFirstMeet, estimatedMeetCount}
}

module.exports = mongoose.model('Service', schema)
