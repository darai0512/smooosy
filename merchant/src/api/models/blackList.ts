import { Schema, Document, model} from 'mongoose'
import * as mongooseLeanVirtuals from 'mongoose-lean-virtuals'

import { models } from '../interfaces'

const schema = new Schema({
  target: {type: String, required: true, enum: [
    'email', 'name', 'input', 'ip', 'phone', 'instance_id',
  ], default: 'email'},
  type: {type: String, required: true, enum: [
    'exact', 'prefix', 'suffix', 'partial', 'regexp',
  ], default: 'exact'},
  enabled: {type: Boolean, default: false},
  text: String,
  note: String,
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

schema.pre('update', async function(next) {
  this.setOptions({runValidators: true})
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.setOptions({
    runValidators: true,
    new: true,
  })
  return next()
})

schema.plugin(mongooseLeanVirtuals)

export default model<models.Blacklist.Model & Document>('BlackList', schema)
