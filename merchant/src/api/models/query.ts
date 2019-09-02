export {}
const config = require('config')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

import { PricesToPointsSchema } from './pricesToPointsSchema'

const optionSchema = new Schema({
  min: Number,
  max: Number,
  defaultNumber: Number,
  unit: {type: String, default: ''},
  skipQueryIds: [{type: Schema.Types.ObjectId, ref: 'Query'}],
  text: String,
  note: String,
  notePlaceholder: String,
  point: Number,
  pointMultiplier: Number,
  price: Number,
  imageUpdatedAt: Date,
  type: {type: String, enum: [
    'selector',
    'slider',
    'counter',
  ]},
  canWorkRemotely: Boolean,
  usedForPro: Boolean,
  removeTravelFee: Boolean,
  // for selector, this represents the size of each selection option step
  // i.e. min: 20, max: 50, stepSize: 10 -> ['20-29', '30-39', '40-49', '50+']
  stepSize: Number,
}, {
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

optionSchema
  .virtual('image')
  .get(function() {
    return this.imageUpdatedAt ? `${config.get('bucketOrigin')}/options/${this.id}.jpg?${this.imageUpdatedAt.getTime()}` : null
  })

const schema = new Schema({
  text: {type: String, required: true},
  helperText: String,
  proText: String,
  proHelperText: String,
  proPriceHelperText: String,
  summary: String,
  type: {type: String, required: true, enum: [
    'singular',
    'multiple',
    'calendar',
    'location',
    'textarea',
    'image',
    'price',
    'number',
  ]},
  subType: { type: String, enum: [
    'none',
    'multiple',
    'fixed',
    'duration',
    'required',
    'formula',
  ]},
  placeholder: String,
  tags: [{type: String}],
  options: [optionSchema],
  prices: [Number],
  minPrice: Number,
  maxPrice: Number,
  addPoint: Number,
  multiplePoint: Number,
  formula: String,
  usedForPro: Boolean,
  // Indicates when the query was copied to production, if ever.
  copiedToProductionAt: Date,
  // If this is true, a pro can submit a valid "answer" this question with no
  // options chosen at all. This is useful for questions where we're asking if
  // a pro offers a certain addon and leaving the box unchecked means "no".
  noOptionsChosenOkForPro: Boolean,
  priceFactorType: {type: String, enum: [
    'base', 'discount', 'addon',
  ]},
  // If this is set, we add up all the answer price values, then map them to a point value.
  usePriceToPoint: { type: Boolean, select: false },
  // Specifies the mapping between the price calculated based on this query's
  // answers and its point value.
  priceToPoints: { type: PricesToPointsSchema, select: false },
  auditMetadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  // The actual query whose data this query contains
  // If this query is the active query, then this will be different from _id
  // If this query is a historical query, this will just be unset
  historicalQuery: { type: Schema.Types.ObjectId, ref: 'Query' },
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

module.exports = mongoose.model('Query', schema)
