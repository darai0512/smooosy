export {}

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const Location = require('./location')
import priceValueSchema from './priceValueSchema'
const config = require('config')

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  profile: {type: Schema.Types.ObjectId, ref: 'Profile', required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  jobRequirements: [{
    query: {type: Schema.Types.ObjectId, ref: 'Query'},
    // no ref because options are embedded doc within query
    answers: [Schema.Types.ObjectId],
  }],
  loc: {type: Schema.Types.Point, required: true},
  zipcode: String,
  address: String,
  prefecture: String,
  city: String,
  distance: {type: Number},
  budget: {type: Number, default: 0, required: true},
  priceValues: [priceValueSchema],
  chargesTravelFee: {type: Boolean, default: false},
  setupDescriptions: {type: Boolean, default: false},
  setupLocation: {type: Boolean, default: false},
  setupJobRequirements: {type: Boolean, default: false},
  setupPriceValues: {type: Boolean, default: false},
  setupBudget: {type: Boolean, default: false},
  disabled: Boolean,
  isPromoted: Boolean,
  catchphrase: String,
  description: String,
  accomplishment: String,
  advantage: String,
  media: {
    type: [{type: Schema.Types.ObjectId, ref: 'Media'}],
    default: [],
  },
  // Locations a pro is eligible to select for getting jobs, based on their
  // origin location (loc)
  candidateLocations: [{type: Schema.Types.ObjectId, ref: 'Location'}],
  // Locations that a pro actually wants to get jobs in - subset of candidateLocations
  targetLocations: [{type: Schema.Types.ObjectId, ref: 'Location'}],
  // labels different for each service
  // chosen by pro
  labels: [{type: Schema.Types.ObjectId, ref: 'ProLabel'}],
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
    transform: (doc, m) => {
      delete m.__v
      return m
    },
  },
  toJSON: {
    virtuals: true,
    transform: (doc, m) => {
      delete m.__v
      return m
    },
  },
})

schema.plugin(mongooseLeanVirtuals)

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})

schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

schema.index({ user: 1, service: 1 }, { unique: true })
schema.index({ profile: 1, service: 1 })
schema.index({ loc: '2dsphere', service: 1 })
schema.index({ user: 1, disabled: 1 })

// Updates all pro services associated with the given profile.
// If distance is not passed in, the user's previously set distance is used.
schema.statics.updateLocations = async function({userId, profileId, origin, distance, address, prefecture, city, zipcode}) {
  // find all services associated with profile
  const proServices = await this.find({ user: userId, profile: profileId })
    .select('distance address prefecture city zipcode')
    .populate('service', 'distance showTargetLocationsToPros')

  return Promise.all(proServices.map(async ps => {
    ps.distance = distance || ps.distance
    ps.address = address || ps.address
    ps.prefecture = prefecture || ps.prefecture
    ps.city = city || ps.city
    ps.zipcode = zipcode || ps.zipcode
    ps.loc = origin || ps.loc
    if (ps.service.showTargetLocationsToPros) {
      const [ candidateLocations, targetLocations ] = await ps.getLocations(origin, distance)
      ps.candidateLocations = candidateLocations
      ps.targetLocations = targetLocations
    }
    ps.setupLocation = true

    return ps.save()
  }))
}

// Gets a user's candidate and target locations based on given origin point
// Requires:
// - service.distance
// - service.showTargetLocationsToPros
schema.methods.getLocations = async function(origin, distance) {
  const candidateDistance = config.get('location.candidateLocationDistance')
  const defaultTargetDistance = config.get('location.targetLocationDistance')

  const targetDistance = distance ||
    this.distance ||
    this.service.distance ||
    defaultTargetDistance

  return Promise.all([
    Location.findLocations(origin, candidateDistance),
    Location.findLocations(origin, targetDistance),
  ])
}

module.exports = mongoose.model('ProService', schema)