export {}
const redis = require('../lib/redis')
const { ObjectID } = require('mongodb')
const moment = require('moment')
const validator = require('validator')
const { linebot, linemsg } = require('../lib/line')

const { User, LineProfile, LineLog } = require('../models')
const { webOrigin } = require('@smooosy/config')

module.exports = {
  checkFriend,
  webhook,
  pushMessage,
  track,
}

async function checkFriend(req, res) {
  const lineProfile = await LineProfile.findOne({userId: req.user.lineId}).select('blocked')
  res.json(!!lineProfile && !lineProfile.blocked)
}

async function webhook(req, res) {
  for (let i = 0; i < req.body.events.length; i++) {
    const event = req.body.events[i]
    const lineId = event.source.userId
    const user = await User.findOne({ lineId })

    switch (event.type) {
      case 'message': {
        const text = event.message.text
        if (user) {
          // XXX TODO: 連携済みのときに話しかけられたらどうするか
          receiveMessage(user, text)
        }
        break
      }

      case 'follow': {
        linebot
          .get(`/profile/${lineId}`)
          .then(res => res.data)
          .then(data => {
            data.blocked = false
            return LineProfile.findOneAndUpdate(
              { userId: lineId },
              data,
              { upsert: true, new: true, runValidators: true }
            )
          }).catch(e => {
            console.error(e)
            return LineProfile.findOneAndUpdate(
              { userId: lineId },
              { blocked: false },
              { upsert: true, new: true, runValidators: true }
            )
          })

        if (user) {
          pushMessage({
            lineId,
            text: `${user.lastname}様、友達追加ありがとうございます！`,
          } as any)
        } else {
          suggestConnect(lineId)
        }
        break
      }

      case 'unfollow':
        await LineProfile.findOneAndUpdate(
          { userId: event.source.userId },
          { blocked: true },
          { upsert: true, runValidators: true }
        )
        break
    }
  }

  res.json({ok: 1})
}

function receiveMessage(user, text) {
  console.log('LINE receiveMessage:' + text)
  linebot.post('/message/push', {
    to: user.lineId,
    messages: [{ type: 'text', text: `メッセージありがとうございます￼。申し訳ございませんが、このアカウントでは個別のご返信ができないのです￼。🙇

お問い合わせはこちらから。
https://help.smooosy.com`,
    }],
  })
}

function lineTrackUrl(uri, logId) {
  if (!uri) return uri
  const trackUri = `${webOrigin}/api/lines/track?path=${encodeURIComponent(uri)}&id=${logId}`
  return trackUri
}

/*
 * lineId: string
 * text: string
 * contents: string / array of object / null
 * additional: object
 *
 * contents could be:
 *   'https://smooosy.com/'
 *   [{type: 'uri', label: 'はい', uri: url}, {type: 'uri', label: 'まだです', uri: url}]
 *   null
 */
function pushMessage({lineId, text, contents, additional, template, userId}) {
  const params = { to: lineId, messages: [] }
  const logId = new ObjectID()

  // simple text message
  if (!contents) {
    params.messages.push({ type: 'text', text: text })

  // template message
  } else {
    if (typeof contents === 'string' && validator.isURL(contents)) {
      contents = [{
        type: 'button',
        style: 'primary',
        action: {
          type: 'uri',
          label: '確認する',
          uri: lineTrackUrl(contents, logId.toString()),
        },
      }]
    } else if (Array.isArray(contents)) {
      contents = contents.map(c => {
        if (c.uri) {
          c.uri = lineTrackUrl(c.uri, logId)
        }
        return {
          type: 'button',
          style: 'primary',
          action: c,
        }
      })
    }
    params.messages.push({
      type: 'flex',
      altText: text,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            wrap: true,
            text,
          }],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents,
        },
      },
    })
  }

  if (additional) {
    if (additional.unshift) {
      delete additional.unshift
      params.messages.unshift(additional)
    } else {
      if (additional.contents && additional.contents.contents) {
        additional.contents.contents = additional.contents.contents.map(content => {
          content.body.contents = content.body.contents.map(content => {
            if (content.action && content.action.uri) {
              content.action.uri = lineTrackUrl(content.action.uri, logId)
            }
            return content
          })
          return content
        })
      }
      params.messages.push(additional)
    }
  }

  linebot.post('/message/push', params)
    .then(async () => {
      if (template) {
        await LineLog.create({
          _id: logId,
          user: userId,
          lineId: lineId,
          template,
        })
      }
    })
    .catch(err => {
      // エラーレスポンスが400以外
      if (err.response) {
        if (err.response.status !== 400) {
          // redisに一時保存(1日)
          redis.set(`${linemsg}-${params.to}_${moment().unix()}`, JSON.stringify(params), 'EX', 86400)
          return
        }
        console.error(`LINE API エラー ${err.response.status} ${err.message} ${JSON.stringify(params)}`)
      // requestが到達しなかった
      } else if (err.request) {
        // redisに一時保存(1日)
        redis.set(`${linemsg}-${params.to}_${moment().unix()}`, JSON.stringify(params), 'EX', 86400)
      } else {
        console.error(`LINE API 不明なエラー ${err.message}`)
        console.error(err)
      }
    })
}

function suggestConnect(lineId) {
  pushMessage({
    lineId,
    text: `ご登録ありがとうございます！

次のリンクからSMOOOSYにログインしてLINE連携すれば、メールの代わりにLINEでお知らせを受け取ることができます。
${webOrigin}/lineConnect
`,
  } as any)
}

export async function track(req, res) {
  const id = req.query.id
  const path = req.query.path
  if (!path) return res.json()
  res.redirect(decodeURIComponent(path))

  if (id && ObjectID.isValid(id)) {
    await LineLog.findByIdAndUpdate(id,
      {
        $set: {
          click: true,
          clickedAt: new Date(),
        },
      })
  }

}
