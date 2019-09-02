export {}
const config = require('config')
const moment = require('moment')
const { Meet, Chat, User } = require('../models')
const { emailNewChat } = require('../lib/email')
const { getEmotion, slack } = require('../lib/util')
const { S3 } = require('../lib/aws')
const { BigQueryInsert } = require('./bigquery')
const { webOrigin, MeetStatusType } = require('@smooosy/config')
const { handleCSTaskNegativeChat } = require('./cstasks')

module.exports = {
  signedUrl,
  create,
  remove,
  read,
}

async function signedUrl(req, res) {
  // あらかじめchatを作成する
  // 実際に投稿された際にcreatedAtの更新とmeet.chatsへの追加を行う
  const chat = await Chat.create({
    user: req.user.id,
    type: req.query.type,
    ext: req.query.ext,
  })
  const key = `chats/${chat.id}.${chat.ext}`
  const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
  const url = `${config.get('bucketOrigin')}/${key}?`
  res.json({signedUrl, url, id: chat.id})
}

/**
 * メッセージ投稿
 *
 * @param meetId
 * @param text
 * @param files すでに作成済みの画像chatsのid配列
 */
async function create(req, res) {
  const meet = await Meet
    .findOne({_id: req.body.meetId, $or: [{pro: req.user.id}, {customer: req.user.id}]})
    .populate({
      path: 'customer',
      select: 'lastname',
    })
    .populate({
      path: 'profile',
      select: 'name',
    })
  if (meet === null) return res.status(404).json({message: 'not found'})

  req.body.user = req.user.id
  const fileIds = req.body.files || []
  delete req.body.files

  const $set: any = {}
  const $push = {chats: []}
  let chat
  if (req.body.text) {
    chat = await Chat.create(req.body)
    const score = await getEmotion(req.body.text)
    if (score !== null) {
      req.body.emotionalScore = score
      // ネガティブ発言
      if (score <= -0.8) {
        const text = `${req.body.text.slice(0, 20)}...スコア:${score}`
        const isPro = req.user.id.toString() === meet.pro.toString()
        const message = `メッセージにネガティブな内容が含まれています:angry:
依頼: ${webOrigin}/tools/#/stats/requests/${meet.request}
発言者: ${isPro ? meet.profile.name : meet.customer.lastname}様
メッセージ: ${text}
`
        await slack({message, room: 'cs'})
        await handleCSTaskNegativeChat({request: meet.request, user: req.user.id, profile: isPro ? meet.profile._id : null, meet, chat, detail: text})
        // TODO: 精度がよかったらチャット生成前に止める仕組みが必要？
      }
    }

    if (meet.customer.equals(chat.user)) {
      $set.chatStatus = MeetStatusType.RESPONDED
    }
    $push.chats.push(chat.id)
  }

  // 追加の画像を保存
  if (fileIds.length) {
    const chats = await Chat.find({
      _id: { $in: fileIds },
    })
    const createdAt = moment()
    // 並び順保証・createdAtはsaveしないと更新されない
    for (const chat of chats) {
      chat.createdAt = createdAt.add({ms: 1}).toDate()
      await chat.save()
      if (meet.customer.equals(chat.user)) {
        $set.chatStatus = MeetStatusType.RESPONDED
      }
    }
    $push.chats.push(...fileIds)
  }

  await Meet.findByIdAndUpdate(meet.id, {$push, $set})
  res.json({})

  // 画像のみの場合return
  if (!chat) return

  BigQueryInsert(req, {
    event_type: 'meet_chat',
    event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.toString(), meet_id: meet.id, chat_id: chat.id }),
  })

  // MatchMoreでプロが受けていない場合は通知しない
  if (['inReview', 'tbd', 'decline'].includes(meet.proResponseStatus)) return

  const fromUser = req.user
  let user, toPro
  if (meet.pro.equals(fromUser.id)) {
    user = await User.findOne({_id: meet.customer})
    toPro = false
  } else {
    user = await User.findOne({_id: meet.pro})
    toPro = true
  }
  emailNewChat({
    user,
    fromUser,
    toPro,
    meet,
    chat,
  })
}

// meetに紐づいていないchatの削除
async function remove(req, res) {
  const chat = await Chat.findOne({_id: req.params.id, user: req.user.id})
  if (chat === null) return res.status(404).json({message: 'not found'})

  if (['image', 'file', 'audio', 'invoice'].includes(chat.type)) {
    const key = `chats/${chat.id}.${chat.ext}`
    await S3.deleteObject({key}).catch((e) => console.error(e))
  }
  await Chat.findByIdAndRemove(chat.id)

  res.json({})
}

async function read(req, res) {
  await Chat.findByIdAndUpdate(req.params.id, {$set: {read: true}})

  const emptyGif = Buffer.from('R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64')
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': emptyGif.length,
    'Cache-Control': 'public, max-age=0',
  })
  res.end(emptyGif)
}
