import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
export interface QueryHistoryModel extends Document {
  activeQuery: ObjectId,
  queries: ObjectId[],
}

const schema: Schema = new Schema({
  // The view of this query to everyone else, so that it keeps the same ID
  // This query's ID doesn't change, but all of its data will change, and it
  // will contain the data of `queries[queries.length - 1]`
  activeQuery: { type: Schema.Types.ObjectId, ref: 'Query' },

  // An edit history of this query
  // queries[0] is the original query
  // queries[1] is the first edit, and so on.
  // queries[queries.length - 1] is the currently active version of the query
  queries: [{ type: Schema.Types.ObjectId, ref: 'Query' }],
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

export default model<QueryHistoryModel>('QueryHistory', schema)
