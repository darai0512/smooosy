import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
import * as mongooseLeanVirtuals from 'mongoose-lean-virtuals'

interface ReviewModel extends Document {
  profile: ObjectId,
  rating: number,
  username: string,
  text?: string,
  details: {
    title: string,
    answer: string,
  }[],
  user?: ObjectId,
  meet?: ObjectId,
  service?: ObjectId,
  reply?: string,
}

const schema: Schema = new Schema({
  profile: {type: Schema.Types.ObjectId, ref: 'Profile', required: true},
  rating: {type: Number, required: true, min: 1, max: 5},
  username: {type: String, required: true},
  text: String,
  details: [
    {
      title: String,
      answer: String,
    },
  ],
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  meet: {type: Schema.Types.ObjectId, ref: 'Meet'},
  service: {type: Schema.Types.ObjectId, ref: 'Service'},
  reply: String,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, review) {
      delete review.__v
      return review
    },
  },
})
schema.plugin(mongooseLeanVirtuals)

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

export default model<ReviewModel>('Review', schema)
