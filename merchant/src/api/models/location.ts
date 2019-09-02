export {}
require('mongoose-geojson-schema')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  key: {type: String, required: true},
  name: {type: String, required: true},
  parentKey: {type: String, required: true},
  parentName: {type: String, required: true},
  loc: Schema.Types.GeoJSON, // 地点情報
  // currently, this contains a list  of encoded polylines that represent this area
  map: {type: Schema.Types.ObjectId, ref: 'LocationMap'},
  distance: Number, // 距離
  code: String, // 地域コード
  isPublished: {type: Boolean, default: false},
  isStation: Boolean,
  path: {type: String, unique: true, required: true}, // 経路列挙パス(東京都,港区,赤坂)
  keyPath: {type: String, unique: true, required: true}, // 経路列挙パス(tokyo,minato,akasaka)
  depth: {type: Number, required: true}, // 階層の深さ
  group: [{type: Schema.Types.ObjectId, ref: 'Location'}], // Group
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


schema.pre('update', async function(next) {
  this.options.runValidators = true
  return next()
})
schema.pre('findOneAndUpdate', async function(next) {
  this.options.runValidators = true
  this.options.new = true
  return next()
})

schema.index({loc: '2dsphere'})

schema.statics.findLocations = async function(origin, distance) {
  // find all nearby cities using cheap search (intersection of circles)
  return this.find({
    depth: 1,
    // exclude area locations
    $or: [{group: {$exists: false}}, {group: {$size: 0}}],
    loc: {
      $near: {
        $geometry: origin,
        $maxDistance: distance,
      },
    },
    isPublished: true,
  }).select('id')
}


module.exports = mongoose.model('Location', schema)
