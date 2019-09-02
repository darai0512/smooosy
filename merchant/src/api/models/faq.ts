import { Schema, model, Document } from 'mongoose'

interface FaqModel extends Document {
  title: string,
  body: string,
  type: string,
  category: string,
  beforeSignup?: boolean,
}

const schema: Schema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, required: true, enum: ['pro', 'user'] },
  category: { type: String, required: true },
  beforeSignup: Boolean,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, faq) {
      delete faq.__v
      return faq
    },
  },
})

export default model<FaqModel>('Faq', schema)
