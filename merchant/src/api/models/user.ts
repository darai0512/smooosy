export {}
const config = require('config')
const mongoose = require('mongoose')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')
const Schema = mongoose.Schema
const crypto = require('crypto')
const moment = require('moment')
const ProStat = require('./proStat')
const userVirtuals = require('../lib/virtuals/user')
const { mongoIdToShortId } = require('../lib/mongoid')
const { isEmail, notificationTypes, timeNumbers } = require('@smooosy/config')

const notification = {}
for (const type of Object.keys(notificationTypes)) {
  notification[type] = {
    email: {type: Boolean, default: true},
    line: {type: Boolean, default: true},
  }
}

const schema = new Schema({
  lastname: {type: String, required: true},
  firstname: {type: String},
  email: { type: String, unique: true, sparse: true, trim: true, validate: {
    isAsync: false,
    validator: function(v) {
      return isEmail(v)
    },
    message: '{VALUE} is not valid email.',
  }},
  bounce: Boolean,
  phone: {type: String},
  password: {type: String},
  token: {type: String},
  pro: {type: Boolean, default: false},
  corporation: {type: Boolean, default: false},
  admin: Number,
  tools: {
    twilioWorkerSid: String,
  },
  googleId: String,
  facebookId: String,
  lineId: {type: String, default: null},
  imageUpdatedAt: Date,
  notification: notification,
  // pros
  refer: {
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    sendMeet: Boolean,
  },
  profiles: [{type: Schema.Types.ObjectId, ref: 'Profile'}],
  payjpId: String,
  conveniCode: [{
    code: String, // コンビニ支払い待ちのtrans_codeをhash化
    expiredAt: Date,
    status: {type: String, enum: ['waiting', 'cancel']},
  }],
  identification: {
    status: {type: String, enum: [
      'valid', 'invalid', 'pending',
    ]},
    invalidReason: String,
    image: [String],
    uploadedAt: Date,
  },
  schedule: {
    dayOff: {type: [Boolean], default: new Array(7).fill(false)},
    startTime: Number,
    endTime: Number,
  },
  inboundLink: Boolean,
  deactivate: Boolean,
  requestDeactivate: Date,
  deactivateReason: String,
  lastAccessedAt: Date,
  isIdBase: Boolean,
  isMatchMore: Boolean,
  isInArrears: Boolean,
  hasActiveCard: Boolean,
  needSocialRename: Boolean,
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

function transform(doc, user) {
  delete user.__v
  user.password = !!user.password
  user.lineId = !!user.lineId
  if (user.deactivate) {
    delete user.phone
    delete user.token
    user.facebookId = !!user.facebookId
    user.googleId = !!user.googleId
    delete user.isIdBase
    user.image = `${config.get('bucketOrigin')}/users/anonymous.png?`
    user.lastname = '【退会済】'
    delete user.firstname
  }
  return user
}

schema.index({ email: 1 }, { unique: true })
schema.index({ token: 1 })
schema.index({ 'refer.user': 1, 'refer.sendMeet': 1 })

schema.virtual('id').get(function() {
  return this._id.toString()
})

schema
  .virtual('shortId')
  .get(function() {
    return mongoIdToShortId(this._id)
  })

schema
  .virtual('image')
  .get(function() {
    return userVirtuals.image(this)
  })

schema
  .virtual('intercomHash')
  .get(function() {
    const hmac = crypto.createHmac('sha256', config.get('intercom.secretKey'))
    return hmac.update(this._id.toString()).digest('hex')
  })

schema
  .virtual('setupBusinessHour')
  .get(function() {
    return userVirtuals.setupBusinessHour(this)
  })

schema.static('cipher', function(password, id) {
  return crypto.pbkdf2Sync(password, id, 96, 32, 'sha512').toString('hex')
})

schema.method('verify', function(password) {
  return (
    // emailベースは後方互換性のため
    this.password === this.model('User').cipher(password, this.email) ||
    this.password === this.model('User').cipher(password, this.id)
  )
})

schema.method('isDeactivatable', async function() {
  const count = await this.model('Request').count({
    customer: this._id,
    $or: [
      { status: 'open', createdAt: {$gt: moment().subtract(timeNumbers.requestExpireHour, 'hour')} }, // 期限以内
      { status: 'open', 'meets.0': {$exists: true} }, // 応募があるのにopen
      { status: 'close', createdAt: { $gt: moment().subtract(1, 'month')} }, // 成約
    ],
  })
  return count === 0
})

schema.static('generateToken', function() {
  const length = 32
  const chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_-'
  const rnd = crypto.randomBytes(length)
  const ret = []
  for (let i = 0; i < length; i++) {
    ret.push(chars[rnd[i] % chars.length])
  }
  return ret.join('')
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


const postSave = async function(doc, next) {
  if (doc.pro) {
    const stat = await doc.model('ProStat').findOne({pro: doc._id}).select('-updatedAt')
    if (stat) {
      await stat.calc()
      await doc.model('ProStat').findByIdAndUpdate(stat.id, {$set: stat.toObject()})
    } else {
      const proStat = new ProStat()
      proStat.pro = doc._id
      await proStat.calc()
      await proStat.save()
    }
  }
  next()
}

schema.post('findOneAndUpdate', postSave)
schema.post('save', postSave)

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('User', schema)
