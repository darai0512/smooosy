import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

interface AccountingModel extends Document {
  data: {
    from: {
      name: string,
      zip: string,
      address: string,
      transfer: {
        bankName: string,
        bankAccount: string,
        bankAccountType: string,
      },
    },
    name: string,
    nameSuffix: string,
    items: [{
      name: string,
      price: number,
      amount: number,
    }],
  },
  meet?: ObjectId,
}

const schema: Schema = new Schema({
  data: {
    from: {
      name: String,
      zip: String,
      address: String,
      transfer: {
        bankName: String,
        bankAccount: String,
        bankAccountType: String,
      },
    },
    name: {type: String, require: true},
    nameSuffix: String,
    items: [{
      name: String,
      price: Number,
      amount: Number,
    }],
  },
  meet: { type: Schema.Types.ObjectId, ref: 'Meet' },
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

export default model<AccountingModel>('Accounting', schema)