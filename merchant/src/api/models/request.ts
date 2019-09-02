export {}
require('mongoose-geojson-schema')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { FlowTypes, interviewDescription } = require('@smooosy/config')
const { PriceConfigMap } = require('../lib/pricing/requests')
const evaluatePrices = require('../lib/pricing/evaluatePrices')
const getBudgetBasedDistance = require('../lib/getBudgetBasedDistance')
const priceValueResultSchema = require('./priceValueResultSchema')
const { compObjRefs } = require('../lib/util')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

mongoose.model('EditLog', new Schema({
  after: {type: String, required: true},
  before: {type: String, required: true},
  description: String,
  editType: {
    type: String,
    enum: ['interview', 'additionalStatus', 'description', 'cancelPass', 'point', 'distance', 'status', 'supportStatus', 'phone'],
    required: true,
  },
  request: {type: Schema.Types.ObjectId, ref: 'Request', required: true},
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
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
}))

const schema = new Schema({
  customer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  category: String,
  status: {type: String, required: true, enum: [
    'open', 'close', 'suspend',
  ], default: 'open'},
  suspendReason: String,
  showReason: Boolean,
  deleted: Boolean,
  loc: Schema.Types.Point,
  location: {type: Schema.Types.ObjectId, ref: 'Location'},
  address: String,
  prefecture: String,
  city: String,
  description: [{
    query: {type: Schema.Types.ObjectId, ref: 'Query'},
    type: {type: String},
    subType: String,
    label: String,
    usedForPro: Boolean,
    answers: [{
      // option has no document type because it's a subdocument in Query
      option: Schema.Types.ObjectId,
      usedForPro: Boolean,
      number: Number,
      text: String,
      image: String,
      point: Number,
      pointMultiplier: Number,
      range: [Number],
      checked: Boolean,
      note: String,
      date: Date,
      start: String,
      end: String,
    }],
  }],
  canWorkRemotely: Boolean,
  duration: Number,
  pt: Number, // 依頼の真性度 0 - 100
  point: Number,
  price: {
    min: Number,
    max: Number,
    avg: Number,
  },
  usePriceValueBudget: Boolean,
  priceValueResult: priceValueResultSchema,
  priceModels: {
    type: [String],
  },
  phone: String,
  distance: Number,
  sent: [{type: Schema.Types.ObjectId, ref: 'Profile'}],
  specialSent: [{type: Schema.Types.ObjectId, ref: 'Profile'}],
  meets: [{type: Schema.Types.ObjectId, ref: 'Meet'}],
  pendingMeets: [{type: Schema.Types.ObjectId, ref: 'Meet'}],
  passed: [{
    profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
    reason: String,
  }],
  additionalStatus: String,
  supportStatus: String,
  time: Number,
  referrer: String,
  stack: [String],
  ip: String,
  interview: [{
    type: String,
    enum: Object.keys(interviewDescription),
  }],
  flowType: {
    type: String,
    enum: [FlowTypes.PPC, FlowTypes.MANUAL],
    default: FlowTypes.MANUAL,
  },
  editLog: [{type: Schema.Types.ObjectId, ref: 'EditLog'}],
  copy: Boolean,
  limitDate: Date,
  discountReason: String,
  nearbyPros: Number,
  smsAgree: Boolean, // TODO: SMS 通知期間（リリース翌日）がすぎたら削除して良い
  matchMoreEnabled: Boolean,

  // Requests that have this flag set to true will not be matched
  finishedMatching: Boolean,

  // any parameters that modify how the matching algorithm works go in here
  matchParams: {
    // Determine whether to use pro's job requirements to match against
    // user's request conditions and use that match as a ranking criteria
    // This variable should be used only in the matching algorithm.
    useConditionalMatching: Boolean,
    // Whether to show "exact match" tag for pros who have filled out job requirements.
    // This variable is used both in the matching algorithm and to control
    // the pro experience.
    showExactMatch: Boolean,
    // Determine whether to use the ideal matching algorithm
    useIdealMatching: Boolean,
    // Determine whether to use the ideal matching algorithm in shadow
    useIdealMatchingShadow: Boolean,
  },
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, obj) {
      delete obj.__v

      // 管理系fields
      // 欲しい場合はleanまたはtoObjectする
      delete obj.distance
      delete obj.pt
      delete obj.additionalStatus
      delete obj.supportStatus
      delete obj.time
      delete obj.stack
      delete obj.ip
      delete obj.editLog
      delete obj.copy
      delete obj.limitDate
      delete obj.nearbyPros
      delete obj.priceModels
      delete obj.priceValueResult
      delete obj.matchParams

      return obj
    },
  },
})

schema.virtual('isExactMatch')

schema.index({createdAt: -1})
schema.index({customer: 1, createdAt: -1})
schema.index({sent: 1, createdAt: -1})
// This index is required to use `$geoNear` in search/aggregation
schema.index({loc: '2dsphere'})

schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})


const postRemove = async function(doc, next) {
  const meets = await doc.model('Meet').find({_id: {$in: doc.meets}})
  for (const meet of meets) {
    // meetのhookを呼ぶ
    await doc.model('Meet').findByIdAndRemove(meet.id)
  }
  next()
}

schema.post('findOneAndRemove', postRemove)
schema.post('remove', postRemove)

schema.methods.calcPoint = async function(basePoint, queries) {

  // 法人フラグ
  const customer = await this.model('User').findOne({_id: this.customer}).select('corporation')

  // 自由記入欄
  const messageLength = this.description.reduce((sum, d) => {
    const text = d.type === 'textarea' && d.answers[0] && d.answers[0].text ? d.answers[0].text : ''
    return sum + text.length
  }, 0)

  // 過去の依頼とモーダル時間
  const requestCount = await this.model('Request').count({
    customer: this.customer,
    createdAt: { $lt: this.createdAt },
  })

  const obj = this.toObject()

  obj.description.forEach(d => {
    const query = queries.find(q => compObjRefs(q, d.query))

    if (query) {
      d.usePriceToPoint = query.usePriceToPoint
      d.priceToPoints = query.priceToPoints

      if (query.options) {
        d.answers.forEach(a => {
          const option = query.options.find(o => compObjRefs(o, a.option)) || {}
          a.price = option.price
        })
      }
    }
  })

  const request = {
    basePointValue: basePoint || 0,
    description: obj.description,
    phone: !!this.phone,
    corporation: customer && customer.corporation,
    requestCount,
    time: this.time,
    nearbyPros: this.nearbyPros,
    limitDate: this.limitDate,
    createdAt: this.createdAt,
    messageLength,
    isFreeRequest: false,
    priceValueResult: this.priceValueResult,
    priceModels: this.priceModels,
    pricesToPoints: this.pricesToPoints,
  }

  let priceResults

  try {
    priceResults = evaluatePrices(PriceConfigMap, request)
  } catch (err) {
    console.error(err)
    console.error(JSON.stringify(request))
    throw err
  }

  return {
    priceResults,
  }
}

schema.methods.calcNearbyPros = async function() {
  return await this.model('Profile').count({
    pro: {$ne: this.customer},
    services: this.service,
    suspend: {$exists: false},
    deactivate: {$ne: true},
    loc: {
      $near: {
        $geometry: this.loc,
        $maxDistance: 60 * 1000,
      },
    },
  })
}

schema.static('getBudgetBasedDistance', async function(request) {
  if (!request.price || !request.price.avg) {
    return request.distance
  }

  const budgetBasedDistanceFormula = await this.model('Service').findOne({ _id: request.service }).select('budgetBasedDistanceFormula').lean()

  if (!budgetBasedDistanceFormula || !budgetBasedDistanceFormula.isEnabled) {
    return request.distance
  }

  return getBudgetBasedDistance(
    request.price.avg,
    request.distance,
    budgetBasedDistanceFormula,
  )
})

// 見積もり期待度を計算
schema.methods.calcProbability = async function() {
  let pt = 100

  // 電話番号なしは減点
  if (!this.phone) pt -= 20

  // 予算で減点
  for (const d of this.description) {
    let p = 0, max = 0
    for (const a of d.answers) {
      if (a.point && a.point > max) max = a.point
      if (a.checked && a.point && a.point > p) p = a.point
    }
    if (max > 0) {
      pt *= 0.6 + 0.4 * (p / max)
    }
  }

  // 自由記入欄
  const messageLength = this.description.reduce((sum, d) => {
    const text = d.type === 'textarea' && d.answers[0] && d.answers[0].text ? d.answers[0].text : ''
    return sum + text.length
  }, 0)
  pt *= messageLength ? 0.5 + Math.min(0.5, Math.max(0, Math.sqrt(messageLength + 20) / 15)) : 0.3

  // 整数にする
  return Math.round(pt)
}

schema.methods.createEditLog = async function(log) {
  log.request = this.id
  return this.model('EditLog').create(log)
}

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('Request', schema)
