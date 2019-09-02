import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

interface ThankModel extends Document {
  from: ObjectId,
  to: ObjectId,
}

const schema: Schema = new Schema({
  from: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  to: {type: Schema.Types.ObjectId, ref: 'User', required: true},
}, {
  timestamps: true,
})

schema.index({ to: 1, from: 1, createdAt: -1 })

export default model<ThankModel>('Thank', schema)
