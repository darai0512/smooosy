import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

interface ServiceAreaModel extends Document {
  place: string,
  key: string,
  serviceKey: string,
  service: ObjectId,
  description?: string,
  pageDescription?: string,
}

const schema: Schema = new Schema({
  place: {type: String, required: true},
  key: {type: String, required: true},
  serviceKey: {type: String, required: true},
  service: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
  description: {type: String},
  pageDescription: {type: String},
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
})

export default model<ServiceAreaModel>('ServiceArea', schema)
