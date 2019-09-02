import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
import * as mongooseLeanVirtuals from 'mongoose-lean-virtuals'

interface LeadModel extends Document {
  name?: string,
  lastname?: string,
  firstname?: string,
  email: string,
  zipcode?: string,
  address?: string,
  phone?: string,
  fax?: string,
  url?: string,
  formUrl?: string,
  source?: string,
  industry?: string[],
  services?: ObjectId[],
  date: Date,
  bounce?: boolean,
  checked: boolean,
  registered: boolean,
  export?: boolean,
  validated?: boolean,
  category?: string,
  description?: string,
  notDuplicate?: boolean,
  crawled: boolean,
  posted: boolean,
  postFailed?: boolean,
}

const schema: Schema = new Schema({
  name: String,
  lastname: String,
  firstname: String,
  email: { type: String, unique: true, sparse: true, trim: true },
  zipcode: String,
  address: String,
  phone: String,
  fax: String,
  url: String,
  formUrl: String,
  source: String,
  industry: [String],
  services: [{type: Schema.Types.ObjectId, ref: 'Service'}],
  date: Date,
  bounce: Boolean,
  checked: {type: Boolean, default: false},
  registered: {type: Boolean, default: false},
  export: Boolean,
  validated: Boolean,
  category: String,
  description: String,
  notDuplicate: Boolean,
  crawled: {type: Boolean, default: false},
  posted: {type: Boolean, default: false},
  postFailed: Boolean,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, lead) {
      delete lead.__v
      return lead
    },
  },
  read: 'secondaryPreferred',
})

schema.index({email: 1})
schema.index({industry: 1})

schema.virtual('id').get(function() {
  return this._id.toString()
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

export default model<LeadModel>('Lead', schema)
