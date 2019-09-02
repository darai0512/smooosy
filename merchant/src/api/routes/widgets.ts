export {}
const { Profile, User } = require('../models')
const { shortIdToMongoId } = require('../lib/mongoid')
const { webOrigin } = require('@smooosy/config')
const { BigQueryInsert, dummyUser } = require('./bigquery')

module.exports = {
  script,
  index,
  media,
}

const { renderWidget, renderMediaWidget } = require('../ssr/renderParts')

async function index(req, res) {
  if (!req.query.id) return res.status(404).json({message: 'not found'})
  if (req.query.id.length == 16) {
    req.query.id = shortIdToMongoId(req.query.id)
  } else if (!req.query.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).json({message: 'not found'})
  }

  const profile = await Profile.findById(req.query.id).select('name averageRating reviews')
  if (!profile) return res.status(404).json({message: 'not found'})
  const initialData = {
    name: profile.name,
    rating: profile.averageRating,
    number: profile.reviews.length,
    id: profile.id,
    shortId: profile.shortId,
  }
  res.send(renderWidget(initialData))
}

async function script(req, res) {
  if (!req.query.id) return res.status(404).json({message: 'not found'})
  if (req.query.id.length == 16) {
    req.query.id = shortIdToMongoId(req.query.id)
  } else if (!req.query.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).json({message: 'not found'})
  }
  const script = `
const req = new XMLHttpRequest()
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      const doc = req.response
      document.getElementById("smooosy-widget").innerHTML = doc.getElementById('smooosy-widget').innerHTML
    }
  }
req.open("GET","${webOrigin}/widgets?id=${req.query.id}")
req.setRequestHeader("Content-type", "text/javascript")
req.responseType = "document"
req.send()
`
  inbound(req)
  res.send(script)
}

async function media(req, res) {
  const isAMP = req.query.amp === 'true'
  if (req.query.id.length == 16) {
    req.query.id = shortIdToMongoId(req.query.id)
  } else if (!req.query.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).json({message: 'not found'})
  }
  const profile = await Profile
    .findById(req.query.id)
    .select('name address description')
    .populate({
      path: 'pro',
      select: 'imageUpdatedAt',
    })
  if (!profile) return res.status(404).json({message: 'not found'})
  profile.description = req.query.description || profile.description

  res.send(renderMediaWidget({profile, isAMP}))
}

// 被リンク表示
async function inbound(req) {
  if (!req.query || !req.query.id) return

  const profileId = req.query.id

  // 外部サイトからのアクセスの想定のため基本的にuserDataは入っていない
  if (!req.userData) {
    req.userData = dummyUser()
  }

  BigQueryInsert(req, {
    event_type: 'inbound_link_review',
    event: JSON.stringify({
      action: 'show',
      projectId: profileId,
    }),
  })

  if (!profileId) return

  const profile = await Profile.findById(profileId)
  if (profile === null) return

  // 被リンクキャンペーンの無料ポイント利用可能
  await User.findByIdAndUpdate(profile.pro, {$set: {inboundLink: true}})
}
