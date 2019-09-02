export {}
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const schema = new Schema({
  key: {type: String, required: true, unique: true},
  name: {type: String, required: true, unique: true},
  pageTitle: String,
  pageMetaDescription: String,
  mediaListPageDescription: String,
  description: String, // ショートキャッチ
  pageDescription: String, // ロングキャッチ
  priority: {type: Number, default: 0},
  providerName: {type: String, default: 'プロ'},
  parent: {
    type: String,
    enum: ['event', 'lifestyle', 'business', 'lesson'],
    required: true,
  },
  pageInformation: [
    {
      type: { type: String, default: 'text', enum: [
        'text', 'zipbox',
      ]},
      column: { type: Number, min: 1, max: 12 },
      title: String,
      text: String,
      image: String,
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      alt: String,
    },
  ],
  wpId: Number,
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

schema.plugin(mongooseLeanVirtuals)

module.exports = mongoose.model('Category', schema)