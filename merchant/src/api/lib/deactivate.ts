export {}
const config = require('config')
const { S3 } = require('./aws')
const { User, Profile, ProService, Media, Service, Notice, ProStat, Memo } = require('../models')
const Payjp = require('payjp')(config.get('payment.secret'))
const { noticeRemoveMedia } = require('../routes/media')
const { CloudFront } = require('../lib/aws')
const sendgrid = require('../lib/sendgrid')
const { slack } = require('./util')

module.exports = {
  deactivateUser,
  removeEmail,
}

async function deactivateUser(user, operatorName) {
  if (!user) return
  // ユーザをdeactivate
  await removeUserInformation(user)

  // proStatをdeactivate
  await removeProStat(user._id)

  // プロフィールをdeactivate
  await removeProfileInformation(user._id)

  // プロサービスをdisabled
  await ProService.updateMany({user: user._id}, {disabled: true})

  // 通知を削除
  await Notice.deleteMany({user: user._id})

  // 画像の削除
  const userImageKey = await removeUserImage(user)
  const mediaKeys = await removeMedia(user)

  await CloudFront.cacheInvalidation([userImageKey, ...mediaKeys])

  // SendGrid から email 削除
  await removeEmail(user.email)

  // 退会理由をtoolsから閲覧できるようにメモに追加
  await addDeactivateReasonToMemo(user, operatorName)
}

async function removeUserInformation(user) {
  // クレジットカード顧客ID情報を削除
  if (user.payjpId) {
    await Payjp.customers.delete(user.payjpId).catch(e => console.error(e))
  }

  const $set = {
    lastname: '【退会済】',
    email: `${user._id}@deleted.deleted`,
    deactivate: true,
  }
  const $unset = {
    firstname: true,
    phone: true,
    googleId: true,
    facebookId: true,
    lineId: true,
    payjpId: true,
    conveniCode: true,
    requestDeactivate: true,
  }
  await User.findByIdAndUpdate(user._id, {$set, $unset})
}

async function removeProfileInformation(userId) {
  const $set = {
    name: '【退会済】',
    deactivate: true,
    templates: [],
    media: [],
  }
  const $unset = {
    address: true,
    description: true,
    accomplishment: true,
    advantage: true,
    url: true,
    faq: true,
    zipcode: true,
  }
  await Profile.updateMany({pro: userId}, {$set, $unset})
}

async function removeProStat(userId) {
  const $set = {
    email: `${userId}@deleted.deleted`,
    profileNames: [],
  }
  const $unset = {
    address: true,
    phone: true,
  }
  await ProStat.updateOne({pro: userId}, {$set, $unset})
}

async function removeMedia(user) {
  await ProService.updateMany({user: user._id}, {$set: {media: []}})
  const media = await Media.find({user: user._id}).populate({path: 'user', select: 'lastname'})
  const mediaIds = media.map(m => m._id)

  const services = await Service.find({pickupMedia: { $in: mediaIds }})
  const keys = []
  for (const s of services) {
    for (const index in s.pickupMedia) {
      const media = s.pickupMedia[index]
      if (mediaIds.includes(media.toString())) {
        s.pickupMedia[index] = undefined
      }
    }
    s.pickupMedia = s.pickupMedia.filter(m => m)
    await s.save()
  }

  for (const m of media) {
    const key = `media/${m._id}.${m.ext || 'jpg'}`
    await S3.deleteObject({key}).catch((e) => console.error(e))
    await Media.findByIdAndRemove(m._id)
    await noticeRemoveMedia(m)
    keys.push('/img/' + key)
  }
  return keys
}

async function removeUserImage(user) {
  const key = `users/${user._id}.jpg`

  await S3.deleteObject({key}).catch((e) => console.error(e))
  user.imageUpdatedAt = undefined

  if (user.identification && user.identification.image) {
    for (const key of user.identification.image) {
      await S3.deleteObject({key}).catch((e) => console.error(e))
    }
  }
  await User.findByIdAndUpdate(user._id, {$unset: {identification: 1}})
  return '/img/' + key
}

async function removeEmail(email) {
  const [, body] = await sendgrid.get().search({email}).catch((e) => {
    slack({ message: e.message, room: 'ops'})
    console.error(e)
    return []
  })
  if (!body || body.recipient_count === 0 || !body.recipients || body.recipients.length === 0) {
    return
  }
  const id = body.recipients[0].id // do not use _id because this is a response of sendgrid
  await sendgrid.get().delete([id]).catch((e) => {
    slack({ message: e.message, room: 'ops'})
    console.error(e)
  })
}

async function addDeactivateReasonToMemo(user, operatorName) {
  const text = '退会処理実行\n退会理由：' + (user.deactivateReason || 'なし')
  await Memo.create({username: operatorName || user.lastname, text: text, item: user._id, reference: 'User'})
}