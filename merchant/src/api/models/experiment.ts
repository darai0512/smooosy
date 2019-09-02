export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const {hashToBucket} = require('../lib/util')

const constraintTypes = {
  Browser: 'Browser',
  Device: 'Device',
}

const constraintSchema = new Schema({
  type: { type: String, enum: Object.values(constraintTypes), required: true },
  value: { type: String, required: true },
})

const constraintNodeSchema = new Schema()

constraintNodeSchema.add({
  type: { type: String, enum: ['value', 'operator'] },
  children: [ constraintNodeSchema ],
  value: { type: constraintSchema },
  operator: { type: String, enum: ['AND', 'OR']},
})

const schema = new Schema({
  name: { type: String, required: true, unique: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  // Buckets are the experimental groups that we put each
  // individual user into (e.g. control, treatment).
  // Each user ends up in exactly one bucket per experiment.
  buckets: {
    type: [{
      name: { type: String, required: true },
      start: { type: Number, min: 0, max: 100, required: true },
      end: { type: Number, min: 0, max: 100, required: true },
    }],
    required: true,
    validate: [
      {
        validator: function atLeastOneBucket() {
          return this.buckets.length > 0
        },
        msg: 'must have at least one bucket',
      },
      {
        validator: function bucketRangesAddTo100() {
          return this.buckets.reduce((acc, b) => {
            return acc + (b.end - b.start)
          }, 0) === 100
        },
        msg: 'bucket ranges must add up to 100',
      },
      {
        validator: function endAtGreaterThanStartAt() {
          return this.endAt > this.startAt
        },
        msg: 'endDate must be greater than startDate',
      },
      {
        validator: function bucketNamesMustBeUnique() {
          const bucketMap = {}

          for (const b of this.buckets) {
            if (bucketMap[b.name]) {
              return false
            }

            bucketMap[b.name] = true
          }

          return true
        },
        msg: 'bucket names must be unique',
      },
    ],
  },
  paths: [String],
  // Constraints on who the experiment will be rolled out to.
  // These are OR'd together, not AND'd together.
  constraints: { type: constraintNodeSchema },
  // Rollout represents the percentage of all users that
  // the experiment is rolled out to.
  rollout: {
    type: {
      start: { type: Number, min: 0, max: 100, required: true },
      end: { type: Number, min: 0, max: 100, required: true },
    },
    required: true,
  },
  isActive: { type: Boolean, required: true },
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: (doc, m) => {
      delete m.__v
      return m
    },
  },
})

schema.pre('validate', function(next) {
  if (!this.constraints) {
    return next()
  }

  if (!validateConstraints(this.constraints)) {
    return next(new Error('invalid constraints - some constraint in the tree has the wrong structure'))
  }

  next()
})

function validateConstraints(constraint) {
  // for some reason, constraint.value is undefined, even though it's set
  constraint = JSON.parse(JSON.stringify(constraint))
  const childrenSet = !!constraint.children &&
    constraint.children.length > 0 && !!constraint.operator && constraint.type === 'operator'
  const valueSet = !!constraint.value && constraint.type === 'value'

  if (childrenSet === valueSet) {
    return false
  }

  if (valueSet) {
    return true
  }

  if (childrenSet) {
    return constraint.children.filter(c => {
      return validateConstraints(c)
    }).length === constraint.children.length
  }
}

schema.methods.getBucketNameForUser = function({
  instanceId,
  platform,
  url,
}) {
  if (!this._isRolledOutForUser(instanceId)) {
    return null
  }

  if (!this._evaluateConstraints(platform, url)) {
    return null
  }

  return this._getBucketNameForUser(instanceId)
}

schema.methods._evaluateConstraints = function({ os: { family = '' } = {}, name = '' } = {}, url) {
  if (this.paths && this.paths.length) {
    if (!url) return false

    let match = false
    for (const path of this.paths) {
      if (url.includes(path)) {
        match = true
        break
      }
    }
    if (!match) return false
  }

  if (!this.constraints) {
    return true
  }

  return evaluateConstraintNode(
    this.constraints, { os: { family }, name }
  )
}

function evaluateConstraintNode(node, { os: { family }, name }) {
  node = node.toObject ? node.toObject() : node

  if (node.children && node.children.length > 0) {
    const results = node.children.reduce((acc, n) => {
      acc.push(evaluateConstraintNode(n, { os: { family }, name }))
      return acc
    }, [])

    if (node.operator === 'AND') {
      return results.length === results.filter(n => n).length
    } else if (node.operator === 'OR') {
      return results.filter(n => n).length > 0
    }
  }

  if (node.value.type === constraintTypes.Browser) {
    return node.value.value === name
  } else if (node.value.type === constraintTypes.Device) {
    return family && family.includes(node.value.value)
  }
}

// We hash a user's instanceId to a number 0 - 100
// this number will be used be used for:
// instanceId + experiment name - determining if the user qualifies for an active experiment
// instanceId + experiment name + 'bucket' - determining what experiment bucket the user falls into
// We want to use different seeds for each step because for experiments with a limited
// rollout, we'd end up only choosing users which will end up falling into some specific bucket

schema.methods._isRolledOutForUser = function(instanceId) {
  const bucket = hashToBucket(instanceId, 'rollout', 100)
  return this.rollout.start <= bucket && bucket < this.rollout.end
}

schema.methods._getBucketNameForUser = function(instanceId) {
  const bucket = hashToBucket(instanceId, this.name, 100)

  return this.buckets.find(b => {
    return b.start <= bucket && bucket < b.end
  }).name
}

schema.statics.hashToBucket = hashToBucket

schema.index({ name: 1 })

module.exports = mongoose.model('Experiment', schema)