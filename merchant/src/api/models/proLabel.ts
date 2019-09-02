import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface ProLabelModel {
  text: string,
  services: ObjectId[],
  userEditable: boolean,
}

const schema: Schema = new Schema({
  text: {type: String, required: true},
  services: [{type: Schema.Types.ObjectId, ref: 'Service', required: true}],
  userEditable: {type: Boolean, default: false},
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
})

schema.index({services: 1})

schema.pre('findOneAndUpdate', async function(next) {
  this.setOptions({
    new: true,
  })
  return next()
})

export default model<ProLabelModel & Document>('ProLabel', schema)
