export {}
const { ObjectID } = require('mongodb')
const config = require('config')

const { S3 } = require('../lib/aws')
const { Licence } = require('../models')

module.exports = {
  index,
  show,
  signedUrl,
  removeImage,
  // admin
  updateForAdmin,
  createForAdmin,
}

async function index(req, res) {
  const licences = await Licence.find()
  res.json(licences)
}

async function show(req, res) {
  const licence = await Licence.findById(req.params.id)
  if (!licence) res.status(404).json({message: 'not found'})
  res.json(licence)
}

async function signedUrl(req, res) {
  const id = new ObjectID()
  const key = `licences/${id}.${req.query.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
  const imageUrl = `${config.get('bucketOrigin')}/${key}?`
  res.json({signedUrl, key, imageUrl})
}

async function removeImage(req, res) {
  const key = req.query.key
  await S3.deleteObject({key}).catch((e) => console.error(e))
  res.json({})
}

async function updateForAdmin(req, res) {
  const licence = await Licence.findByIdAndUpdate(req.params.id, req.body, {new: true})
  if (!licence) res.status(404).json({message: 'not found'})

  res.json(licence)
}

async function createForAdmin(req, res) {
  await Licence.create(req.body)
  res.send()
}
