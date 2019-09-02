export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  convert: String,
  field: String,
  fields: Schema.Types.Mixed,
  infoLabel: String,
  key: { type: String, required: true  },
  method: String,
  name: { type: String, required: true },
  needImage: { type: Boolean, default: false },
  needText: { type: Boolean, default: true },
  search: String,
  url: String,
  validator: String,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
})

module.exports = mongoose.model('Licence', schema)
