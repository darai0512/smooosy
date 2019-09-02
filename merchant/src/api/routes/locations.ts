export {}
const { Location } = require('../models')

module.exports = {
  index,
  create,
  show,
  update,
  remove,
  getNearLocations,
}

async function index(req, res) {
  const keyPath = req.query.keyPath
  const cond: any = {}
  if (keyPath) {
    if (keyPath === 'japan') cond.parentKey = 'japan'
    else cond.keyPath = new RegExp(`^${keyPath}.*`)
  }
  const locations = await Location.find(cond)
  res.json(locations)
}

async function create(req, res) {
  // パスの重複を防ぐ
  const exist = await Location.count({$or: [{path: req.body.path}, {keyPath: req.body.keyPath}]})
  if (exist > 0) return res.status(400).json()
  const location = await Location.create(req.body)

  res.json(location)
}

async function show(req, res) {
  const location = await Location.findOne({_id: req.params.id}).populate('group')
  if (location === null) return res.status(404).json({message: 'not found'})
  const childLocations = await Location.find({keyPath: new RegExp(`^${location.keyPath}.*`), _id: {$ne: location.id}})
  let nearLocations = []
  const keyPaths = location.keyPath.split(',')
  keyPaths.pop()
  const query: any = {_id: {$ne: location._id}}
  if (req.query.isLocationGroup === 'false') {
    query.keyPath = location.depth === 0 ? new RegExp(`^${location.keyPath},.*`) : new RegExp(`^${keyPaths.join(',')},.*`)
  }
  nearLocations = await Location.aggregate([
    {
      $geoNear: {
        spherical: true,
        near: location.loc,
        distanceField: 'way',
        maxDistance: location.distance,
        limit: 1000,
        query,
      },
    },
    {
      $project: {
        id: '$_id',
        parentKey: '$parentKey',
        parentName: '$parentName',
        key: '$key',
        name: '$name',
        loc: '$loc',
        distance: '$distance',
        path: '$path',
        keyPath: '$keyPath',
        isPublished: '$isPublished',
        diff: { $subtract: [ '$distance', '$way' ] },
      },
    },
  ])

  res.json({location, childLocations, nearLocations})
}


async function update(req, res) {
  let location = await Location.findOne({_id: req.params.id})
  if (location === null) return res.status(404).json({message: 'not found'})
  // パスの重複を防ぐ
  const exist = await Location.count({_id: {$ne: location.id}, $or: [{path: req.body.path}, {keyPath: req.body.keyPath}]})
  if (exist > 0) return res.status(400).json()

  location = await Location.findByIdAndUpdate(location.id, {$set: req.body})
  res.json(location)
}

async function remove(req, res) {
  const location = await Location.findByIdAndRemove(req.params.id)
  if (location === null) return res.status(404).json({message: 'not found'})

  res.json()
}


async function getNearLocations(req, res) {
  const location = await Location.findOne({_id: req.params.id})
  if (location === null || !req.query.lat || !req.query.lng || !req.query.distance) return res.status(404).json({message: 'not found'})

  const loc = {
    type: 'Point',
    coordinates: [ Number(req.query.lng), Number(req.query.lat)],
  }
  const distance = Number(req.query.distance)
  let nearLocations = []
  const keyPaths = location.keyPath.split(',')
  keyPaths.pop()

  const query: any = {_id: {$ne: location._id}}
  if (req.query.isLocationGroup === 'false') {
    query.keyPath = location.depth === 0 ? new RegExp(`^${location.keyPath},.*`) : new RegExp(`^${keyPaths.join(',')},.*`)
  }
  nearLocations = await Location.aggregate([
    {
      $geoNear: {
        spherical: true,
        near: loc,
        distanceField: 'way',
        maxDistance: distance,
        limit: 1000,
        query,
      },
    },
    {
      $project: {
        id: '$_id',
        parentKey: '$parentKey',
        parentName: '$parentName',
        key: '$key',
        name: '$name',
        loc: '$loc',
        distance: '$distance',
        path: '$path',
        keyPath: '$keyPath',
        isPublished: '$isPublished',
        diff: { $subtract: [ '$distance', '$way' ] },
      },
    },
  ])

  res.json({nearLocations})
}