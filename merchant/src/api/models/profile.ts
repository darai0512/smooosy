export {}
require('mongoose-geojson-schema')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { mongoIdToShortId } = require('../lib/mongoid')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const schema = new Schema({
  name: {type: String, required: true},
  pro: {type: Schema.Types.ObjectId, ref: 'User'},
  services: [{type: Schema.Types.ObjectId, ref: 'Service'}],
  signupCategory: {type: Schema.Types.ObjectId, ref: 'Category'},
  category: String,
  loc: {type: Schema.Types.Point, required: true},
  zipcode: {type: String, default: ''},
  address: String,
  prefecture: String,
  city: String,
  distance: Number,
  visiting: Boolean,
  visited: Boolean,
  description: String,
  accomplishment: String,
  advantage: String,
  url: String,
  media: {
    type: [{type: Schema.Types.ObjectId, ref: 'Media'}],
    default: [],
  },
  faq: [{
    question: String,
    answer: String,
  }],
  templates: [{
    title: String,
    price: Number,
    priceType: {type: String, enum: [
      'fixed', 'hourly', 'float', 'needMoreInfo', 'tbd',
    ], default: 'fixed'},
    chat: String,
  }],
  reviews: [{type: Schema.Types.ObjectId, ref: 'Review'}],
  reviewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  mainScore: Number,
  score: Number,
  suspend: String,
  licences: [{
    type: {type: String},
    info: String,
    licence: {type: Schema.Types.ObjectId, ref: 'Licence'},
    status: {type: String, enum: [
      'valid', 'invalid', 'pending',
    ]},
    image: String,
  }],
  experience: Number,
  employees: Number,
  hideProfile: Boolean,
  deactivate: Boolean,
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

function transform(doc, profile) {
  delete profile.__v
  if (profile.deactivate) {
    profile.name = '【退会済】'
    profile.description = ''
    profile.accomplishment = ''
    profile.advantage = ''
    profile.url = ''
    profile.address = ''
    profile.prefecture = ''
    profile.city = ''
    profile.averageRating = 0
    profile.media = []
    profile.templates = []
    profile.reviews = []
    profile.licences = []
  }
  profile.templates = profile.templates || []
  return profile
}

schema.index({loc: '2dsphere', score: -1})
schema.index({pro: 1, createdAt: 1})

schema
  .virtual('shortId')
  .get(function() {
    return mongoIdToShortId(this.id || this._id)
  })

schema
  .virtual('stat', {
    ref: 'ProStat',
    localField: 'pro',
    foreignField: 'pro',
    justOne: true,
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

schema.methods.calcScore = async function() {
  this.reviewCount = this.reviews.length || 0

  let score = 0
  score += this.description ? 10 : 0
  score += this.accomplishment ? 2 : 0
  score += this.advantage ? 2 : 0
  score += this.media.length > 20 ? 5 :
           this.media.length > 10 ? 4 :
           this.media.length > 5 ? 3 :
           this.media.length > 2 ? 2 :
           this.media.length > 0 ? 1 : 0
  score += this.reviews.length > 100 ? 20 :
           this.reviews.length > 75 ? 19 :
           this.reviews.length > 50 ? 18 :
           this.reviews.length > 40 ? 17 :
           this.reviews.length > 30 ? 16 :
           this.reviews.length > 20 ? 15 :
           this.reviews.length > 10 ? 14 :
           this.reviews.length > 5 ? 13 :
           this.reviews.length > 3 ? 12 :
           this.reviews.length > 1 ? 11 :
           this.reviews.length > 0 ? 10 : 0

  const hiredCount = await this.model('Meet').countDocuments({profile: this.id, hiredAt: {$exists: true}})
  score += hiredCount > 20 ? 15 :
           hiredCount > 10 ? 12 :
           hiredCount > 5 ? 10 :
           hiredCount > 2 ? 8 :
           hiredCount > 0 ? 5 : 0

  const reviews = await this.model('Review').find({profile: this.id})
  this.averageRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  this.score = score * (this.averageRating || 2) / 2

  // mainScore
  const mediaCount = await this.model('ProService').countDocuments({user: this.pro, service: {$in: this.services}, 'media.0': {$exists: true}})
  let mainScore = 0
  const textSize = (this.description ? this.description.length : 0) + (this.advantage ? this.advantage.length : 0)
  mainScore += textSize > 700 ? 40 :
           textSize > 600 ? 35 :
           textSize > 500 ? 30 :
           textSize > 400 ? 25 :
           textSize > 300 ? 20 :
           textSize > 200 ? 15 :
           textSize > 100 ? 10 :
           textSize > 0 ? 5 : 0
  mainScore += this.accomplishment ? 2 : 0
  mainScore += this.url ? 2 : 0
  mainScore += this.media.length
  mainScore += mediaCount * 5
  this.mainScore = mainScore

  // category
  const services = await this.model('Service').find({_id: { $in: this.services }}).select('tags')

  let mainCategory: any = {}
  let mainCount = 0
  const categories = await this.model('Category').find()
  for (const c of categories) {
    const count = services.filter(s => s.tags.indexOf(c.name) !== -1).length
    if (mainCount < count) {
      mainCategory = c
      mainCount = count
    }
  }
  this.category = mainCategory.name
  return await this.model('Profile').findByIdAndUpdate(this.id, {
    $set: {
      averageRating: this.averageRating,
      score: this.score,
      mainScore: this.mainScore,
      category: this.category,
      reviewCount: this.reviewCount,
    },
  })
}

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('Profile', schema)
