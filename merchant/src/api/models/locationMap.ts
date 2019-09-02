export {}
require('mongoose-geojson-schema')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  // encoded polyline GeoJSON representing this area
  data: String,
}, {
  timestamps: true,
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, location) {
      delete location.__v
      return location
    },
  },
})

module.exports = mongoose.model('LocationMap', schema)
