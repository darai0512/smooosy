export {}
const { ObjectID } = require('mongodb')
const config = require('config')
const { ProfileIntroduction } = require('../models')
const { S3 } = require('../lib/aws')

module.exports = {
  showForAdmin,
  createForAdmin,
  updateForAdmin,
  removeForAdmin,
  signedUrlForAdmin,
}

async function showForAdmin(req, res) {
  const profileIntroductions = await ProfileIntroduction.find({profile: req.params.profileId})
  res.json(profileIntroductions)
}

async function createForAdmin(req, res) {
  const exist = await ProfileIntroduction.findOne({profile: req.body.profile, target: req.body.target})
  if (exist) return res.status(400).json({message: 'already exist'})
  const profileIntroduction = await ProfileIntroduction.create(req.body)
  res.json(profileIntroduction)
}

async function updateForAdmin(req, res) {
  let profileIntroduction = await ProfileIntroduction.findOne({_id: req.params.id})
  if (profileIntroduction === null) return res.status(404).json({message: 'not found'})
  const body = {
    profile: req.body.profile.id,
    target: req.body.target,
    reference: req.body.reference,
    message: req.body.message,
    image: req.body.image,
    caption: req.body.caption,
    prices: req.body.prices,
  }
  profileIntroduction = await ProfileIntroduction.findByIdAndUpdate(profileIntroduction.id, {$set: body})
  res.json(profileIntroduction)
}

async function removeForAdmin(req, res) {
  let profileIntroduction = await ProfileIntroduction.findOne({_id: req.params.id})
  if (profileIntroduction === null) return res.status(404).json({message: 'not found'})
  profileIntroduction = await ProfileIntroduction.findByIdAndRemove(profileIntroduction.id)
  res.json(profileIntroduction)
}

async function signedUrlForAdmin(req, res) {
  const id = new ObjectID()
  const key = `introductions/${id}.${req.query.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
  const url = `${config.get('bucketOrigin')}/${key}?`
  res.json({signedUrl, url, id})
}