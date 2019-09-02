export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
import * as mongooseLeanVirtuals from 'mongoose-lean-virtuals'

const {hashToBucket, compObjRefs} = require('../lib/util')

const schema = new Schema({
  priority: {type: Number, required: true},
  name: {type: String, required: true},
  startAt: { type: Date },
  endAt: { type: Date },
  services: [
    {type: Schema.Types.ObjectId, ref: 'Service'},
  ],
  value: {
    bool: Boolean,
  },
  isEnabled: Boolean,
  rollout: {
    type: {
      start: {
        type: Number,
        required: true,
      },
      end: {
        type: Number,
        required: true,
      },
    },
    validate: [
      {
        validator: r => r.start <= r.end,
        message: 'rollout start must be <= rollout end',
      },
      {
        validator: r => 0 <= r.start && r.start <= 100,
        message: 'rollout start must be in [0, 100]',
      },
      {
        validator: r => 0 <= r.end && r.end <= 100,
        message: 'rollout end must be in [0, 100]',
      },
    ],
    required: true,
  },
  admin: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, m) => {
      m.id = m._id
      delete m.__v
      return m
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

schema.statics.getBoolValue = async function(name, context = {}) {
  const values = await this.getMatchingConfigs({
    ...context,
    name,
  })

  if (!values.length) {
    return false
  }

  return values[0].value.bool
}

schema.statics.getMatchingConfigs = async function(context) {
  const now = new Date()

  const searchParams: any[] = [
    { isEnabled: true },
    { $or: [
      { startAt: { $exists: false } },
      { startAt: { $lte: now } },
    ] },
    { $or: [
      { endAt: { $exists: false } },
      { endAt: { $gte: now } },
    ] },
  ]

  if (context.name) {
    searchParams.push({ name: context.name })
  }

  const serviceParams: any[] = [
    { 'services.0': { $exists: false } },
  ]

  if (context.services) {
    serviceParams.push({ services: { $in: context.services } })
  }

  if (!context.admin) {
    searchParams.push({ admin: { $ne: true } })
  }

  searchParams.push({ $or: serviceParams })

  const runtimeConfigs = await this.find({ $and: searchParams }).lean({virtuals: true})

  return runtimeConfigs.filter(rc => {
    if (rc.rollout.start > 0 || rc.rollout.end < 100) {
      const hash = hashToBucket(context.seed, rc.name, 100)

      if (hash < rc.rollout.start || hash >= rc.rollout.end) {
        return false
      }
    }

    return true
  }).sort((a, b) => {
    return b.priority - a.priority
  })
}

schema.statics.getConfigNameForRequest = async function(r) {
  return this._getConfigName(r._id, r.service, await this.find({ isEnabled: true }).lean())
}

schema.statics.getConfigNameForId = async function(id, service) {
  return this._getConfigName(id, service, await this.find({ isEnabled: true }).lean())
}

schema.statics._getConfigName = function(id, service, runtimeConfigs) {
  const validConfigs = runtimeConfigs.filter(rc => {
    if (rc.services && rc.services.length > 0 && !rc.services.find(s => compObjRefs(s, service))) {
      return false
    }

    const hash = hashToBucket(id.toString(), rc.name, 100)

    if (hash < rc.rollout.start || hash >= rc.rollout.end) {
      return false
    }

    return true
  }).sort((a, b) => {
    return b.priority - a.priority
  })

  return validConfigs && validConfigs[0] && validConfigs[0].name
}

schema.statics.toUserJSON = function(RuntimeConfig) {
  return {
    _id: RuntimeConfig._id,
    name: RuntimeConfig.name,
    value: RuntimeConfig.value,
    services: RuntimeConfig.services,
  }
}

module.exports = mongoose.model('RuntimeConfig', schema)