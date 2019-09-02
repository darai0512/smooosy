export {}
const { Media, Profile, Service, Category, ProService } = require('../models')
const { S3 } = require('../lib/aws')
const { slack } = require('../lib/util')

module.exports = {
  indexMediaList,
  upsertMediaList,
  index,
  create,
  update,
  remove,
  createForAdmin,
  updateForAdmin,
  // helper
  noticeRemoveMedia,
}

async function indexMediaList(req, res) {
  if (!req.query.profile) return res.status(404).json({message: 'not found'})

  const proServices = await ProService
    .find({profile: req.query.profile})
    .populate({
      path: 'service',
      select: 'id name',
    })
    .populate({path: 'media'})

  res.json(proServices)
}

async function upsertMediaList(req, res) {
  req.body.user = req.user.id
  delete req.body.id
  const proService = await ProService.findOneAndUpdate(
    {user: req.body.user, service: req.body.service},
    {$set: {media: req.body.media}},
  )
  if (!proService) return res.status(404).json({message: 'not found'})

  const populated = await ProService
    .findOne({user: req.body.user, service: req.body.service})
    .populate({
      path: 'service',
      select: 'id name',
    })
    .populate({path: 'media'})

  res.json(populated)
}

async function index(req, res) {
  const query = {
    user: req.user.id,
  }
  const media = await Media.find(query)

  res.json(media)
}

async function create(req, res) {
  req.body.user = req.user.id
  req.body.ext = req.body.ext || 'jpg'
  const mime = req.body.mime
  delete req.body.mime
  const media = await Media.create(req.body)

  const key = `media/${media._id}.${media.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: mime})
  const mediaWithSignedUrl = Object.assign({}, media.toObject(), {signedUrl})
  res.json(mediaWithSignedUrl)
}

async function update(req, res) {
  let media = await Media.findOne({_id: req.params.id, user: req.user.id})
  if (media === null) return res.status(404).json({message: 'not found'})

  media = await Media.findByIdAndUpdate(media.id, {$set: req.body})
  res.json(media)
}

async function remove(req, res) {
  const id = req.params.id
  const media = await Media.findOneAndRemove({_id: id, user: req.user.id}).populate({path: 'user', select: 'lastname'})
  if (media === null) return res.status(404).json({message: 'not found'})

  // CP、SP側で使われていたら通知する
  await noticeRemoveMedia(media)

  const key = `media/${id}.${media.ext || 'jpg'}`
  S3.deleteObject({key}).catch((e) => console.error(e))

  const profiles = await Profile.find({media: id})
  for (const profile of profiles) {
    await Profile.findByIdAndUpdate(profile.id, {$pull: {media: id}})
    await profile.calcScore()
  }

  await ProService.updateMany(
    { media: id },
    { $pull: { media: id } },
  )

  res.json(media)
}

async function createForAdmin(req, res) {
  req.body.user = req.params.id
  req.body.ext = req.body.ext || 'jpg'
  const mime = req.body.mime
  delete req.body.mime
  const media = await Media.create(req.body)

  const key = `media/${media._id}.${media.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: mime})
  const mediaWithSignedUrl = Object.assign({}, media.toObject(), {signedUrl})
  res.json(mediaWithSignedUrl)
}

async function updateForAdmin(req, res) {
  let media = await Media.findOne({_id: req.params.id})
  if (media === null) return res.status(404).json({message: 'not found'})

  media = await Media.findByIdAndUpdate(media.id, {$set: req.body})
  res.json(media)
}

// helper
async function noticeRemoveMedia(media) {

  // CP、SP側で使われていたら通知する
  if (media && media.type === 'image') {
    const services = await Service.find({ $or: [
      {pickupMedia: media},
      {pageInformation: { $elemMatch: { image: media.url } }},
    ]}).select('name')
    const categories = await Category.find({pageInformation: { $elemMatch: { image: media.url } }}).select('key name')
    if (services.length > 0 || categories.length > 0) {
      const message = `:cold_sweat: ${media.user.lastname}様の画像が削除されました：${media.url}\n${services.length > 0 ? `対象サービスページ：${services.map(s => `<https://smooosy.com/tools/#/services/${s.id}|${s.name}>`).join(',')}\n` : ''}${categories.length > 0 ? `対象カテゴリページ：${categories.map(c => `<https://smooosy.com/tools/#/categories/${c.key}|${c.name}>`).join(',')}\n` : ''}`
      await slack({message, room: 'seo'})
    }
  }
}
