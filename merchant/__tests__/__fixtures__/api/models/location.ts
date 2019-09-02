export {}
import '../../../../src/api/lib/mongo'

const { Location } = require('../../../../src/api/models')

const geo = require('./geo')

const createLocationData = async (props: any = {}) => {
  const defaults: any = {
    isPublished: true,
    group: [],
    name: '東京都',
    key: 'tokyo',
    distance: 40000,
    loc: geo.points.tokyo,
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    depth: 0,
    keyPath: 'tokyo',
  }

  return await Location.create({ ...defaults, ...props })
}

module.exports = {
  createLocationData,
}