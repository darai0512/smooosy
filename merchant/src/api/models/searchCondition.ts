export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { searchConditions } = require('@smooosy/config')

const conditionSchema = new Schema({
  name: {
    type: String,
    enum: Array.from(new Set(
      ['others'].concat(...[searchConditions.pro, searchConditions.lead, searchConditions.request].map(s => Object.keys(s)))
    )),
  },
  type: {
    type: String,
    enum: Object.values(searchConditions.types),
  },
  data: [String],
})

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  conditions: [{ type: conditionSchema }],
  name: {type: String, required: true},
  type: {type: String, enum: ['pro', 'request', 'lead']},
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

function transform(doc, obj) {
  delete obj.__v
  return obj
}

module.exports = mongoose.model('SearchCondition', schema)
