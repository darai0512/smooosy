export {}
import { Schema } from 'mongoose'

export default {
  type: {type: String, enum: [
    'singleBase', 'base', 'discount', 'addon', 'travelFee',
  ]},
  answers: [Schema.Types.ObjectId],
  requestConditions: [{
    key: {type: String, enum: [ 'distance' ]},
    rangeValue: {lowerBound: Number, upperBound: Number},
    type: {type: String, enum: [ 'range' ]},
  }],
  value: Number,
}
