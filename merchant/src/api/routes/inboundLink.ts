export {}
const { User } = require('../models')
const { BigQueryInsert, dummyUser } = require('./bigquery')

module.exports = {
  show,
  click,
}

const emptyGif = Buffer.from('R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64')

function sendEmptyGif(res) {
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': emptyGif.length,
    'Cache-Control': 'public, max-age=0',
  })

  return res.end(emptyGif)
}

// 被リンク表示
async function show(req, res) {
  if (!req.query || !req.query.profileId) return sendEmptyGif(res)

  const profileId = req.query.profileId

  // 被リンクキャンペーンの無料ポイント利用可能
  await User.findOneAndUpdate({profiles: profileId}, {$set: {inboundLink: true}})

  sendEmptyGif(res)

  // 外部サイトからのアクセスの想定のため基本的にuserDataは入っていない
  if (!req.userData) {
    req.userData = dummyUser()
  }

  BigQueryInsert(req, {
    event_type: 'inbound_link',
    event: JSON.stringify({
      action: 'show',
      profileId: profileId,
    }),
  })
}

// TODO: 旧仕様のバッジリンクがなくなるまで消さない
// 被リンク計測クリック数計測
async function click(req, res) {

  if (!req.query || !req.query.redirectUrl || !req.query.profileId) {
    return res.end()
  }

  const redirectUrl = req.query.redirectUrl
  const profileId = req.query.profileId

  // 外部サイトからのアクセスの想定のため基本的にuserDataは入っていない
  if (!req.userData) {
    req.userData = dummyUser()
  }

  BigQueryInsert(req, {
    event_type: 'inbound_link',
    event: JSON.stringify({
      action: 'click',
      profileId: profileId,
    }),
  })

  res.redirect(redirectUrl)
}
