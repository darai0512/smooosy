export {}
const { User, LineProfile, Request, Meet, PointTransaction, MailLog, ProStat, ProService, LineLog } = require('../models')
const { emailResetPassword, emailChangeEmail, emailIdentificationValid, emailIdentificationInvalid } = require('../lib/email')
const { S3 } = require('../lib/aws')
const { shortIdToMongoId } = require('../lib/mongoid')
const { slack, regexpEscaper } = require('../lib/util')
const FB = require('fb')
const axios = require('axios')
const qs = require('qs')
const jwt = require('jsonwebtoken')
const config = require('config')
const moment = require('moment')
const { googleAuth, webOrigin, line } = require('@smooosy/config')
const { ObjectID } = require('mongodb')
const { deactivateUser } = require('../lib/deactivate')
const { BigQueryInsert } = require('./bigquery')
const { pushMessage } = require('./lines')
const { addNotice } = require('./notices')
const { handleCSTaskIdentification, handleCSTaskDeactivate } = require('./cstasks')
const userVirtuals = require('../lib/virtuals/user')

module.exports = {
  signup,
  login,
  fblogin,
  googlelogin,
  linecallback,
  linelogin,
  reset,
  show,
  isDeactivatable,
  update,
  refers,
  removeIdImage,
  deactivate,
  signedUrl,
  checkEmail,
  // admin
  createForAdmin,
  indexForAdmin,
  showForAdmin,
  searchForAdmin,
  updateForAdmin,
  signedUrlForAdmin,
  statsForAdmin,
  deactivateForAdmin,
  pushMessageForAdmin,
  // function
  getLineState,
  removeLine,
  sendgridWebhook,
  findExistingUserByEmail,
  getUserByEmail,
}

async function signup(req, res) {
  const { password, lastname, firstname, phone, refer, corporation } = req.body
  let { email } = req.body
  email = email.toLowerCase()
  const errors: any = {}
  if (!email) errors.email = '必須項目です'
  if (!lastname) errors.lastname = '必須項目です'
  if (Object.keys(errors).length) return res.status(400).json({message: 'invalid parameter', errors})

  let user = await getUserByEmail(email)
  if (user) {
    if (user.deactivate) {
      return res.status(410).json({message: 'deactivate'})
    } else if (!user.password) {
      return res.status(409).json({code: 901, message: 'already exist'})
    }

    return res.status(409).json({message: 'already exist'})
  }

  user = new User({
    email,
    token: User.generateToken(),
    lastname,
    firstname,
    phone: phone ? phone.replace(/\-/g, '') : undefined,
    pro: false,
    corporation,
  })

  if (password) {
    user.password = User.cipher(password, user.id)
    user.isIdBase = true
  }

  // 知り合いからの紹介
  if (refer) {
    const id = shortIdToMongoId(refer)
    const ref = await User.findOne({_id: id})
    if (ref) user.refer = {user: ref.id, sendMeet: false}
  }

  await user.save()

  res.json(user)
}

async function login(req, res) {
  const {email, password, token, googleToken, facebookToken} = req.body

  let user
  if (token) {
    user = await User.findOne({token})
    if (user === null) return res.status(404).json({message: 'not found'})

    if (user.deactivate) {
      return res.status(410).json({message: 'deactivate'})
    }
    return res.json(user)
  }

  if (!email || !password) return res.status(400).json({})

  user = await getUserByEmail(email)
  if (user === null) return res.status(404).json({message: 'not found'})

  if (user.deactivate) {
    return res.status(410).json({message: 'deactivate'})
  } else if (!user.password) {
    return res.status(400).json({code: 901, message: 'unauthorized'})
  } else if (!user.verify(password)) {
    return res.status(400).json({message: 'unauthorized'})
  }

  if (googleToken) {
    const verify = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleToken}`).catch(e => ({error: e}))
    // smooosy.com以外で発行されたoauth認証は無効
    if (verify.error || verify.data.aud !== `${googleAuth.clientId}.apps.googleusercontent.com`) {
      return res.status(400).json({message: 'invalid request'})
    }
    const googleId = verify.data.sub
    delete req.body.googleToken
    if (googleId) {
      await user.update({$set: {googleId}})
    }
  }

  // FB_TOKENからIDを取得するよ
  if (facebookToken) {
    const data = await FB.api('me', { fields: ['id'], access_token: facebookToken })
    const facebookId = data.id
    delete req.body.facebookToken
    if (facebookId) {
      await user.update({$set: {facebookId}})
    }
  }

  // emailベースのpasswordであればidベースに置き換え
  if (User.cipher(password, user.email) === user.password) {
    const newPassword = User.cipher(password, user.id)
    await user.update({$set: {password: newPassword, isIdBase: true}})
  }

  return res.json(user)
}

async function fblogin(req, res) {
  const { facebookToken, doNotSignup } = req.body

  if (!facebookToken) {
    return res.status(400).json({message: 'invalid request'})
  }

  const data = await FB.api('me', {
    fields: [ 'id', 'last_name', 'first_name', 'email', 'picture.width(320).height(320)' ],
    access_token: facebookToken,
  }).catch(e => ({error: e}))

  if (data.error) {
    return res.status(400).json({message: 'invalid request'})
  }

  const facebookId = data.id
  const email = data.email.toLowerCase()
  const firstname = data.first_name
  const lastname = data.last_name

  // emailで検索しないのは、既存の別のユーザのemailアドレスとしてFacebookで登録してしまえば、
  // その既存ユーザとしてログイン出来てしまう（乗っ取りができてしまう）
  let user = await User.findOne({facebookId})
  if (user) {
    if (user.deactivate) {
      return res.status(410).json({message: 'deactivate'})
    }
    return res.json(user)
  } else if (doNotSignup) {
    return res.status(400).json({message: 'invalid request'})
  }

  const exist = await findExistingUserByEmail(email)
  if (exist) {
    return res.status(409).json({code: 902, message: 'already exist', email: exist.password ? email : null})
  }

  user = await User.create({
    facebookId,
    email,
    token: User.generateToken(),
    lastname,
    firstname,
    needSocialRename: true,
  })

  const u = user.toObject()
  u.create = 'true'
  res.json(u)
}

async function googlelogin(req, res) {
  const { googleToken, doNotSignup } = req.body
  if (!googleToken) {
    return res.status(400).json({message: 'invalid request'})
  }

  const verify = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleToken}`).catch(e => ({error: e}))
  // smooosy.com以外で発行されたoauth認証は無効
  if (verify.error || verify.data.aud !== `${googleAuth.clientId}.apps.googleusercontent.com`) {
    return res.status(400).json({message: 'invalid request'})
  }
  const googleId = verify.data.sub
  const email = verify.data.email.toLowerCase()
  const firstname = verify.data.given_name
  const lastname = verify.data.family_name || verify.data.name

  // emailで検索しないのは、既存の別のユーザのemailアドレスとしてGoogleで登録してしまえば、
  // その既存ユーザとしてログイン出来てしまう（乗っ取りができてしまう）
  let user = await User.findOne({googleId})
  if (user) {
    if (user.deactivate) {
      return res.status(410).json({message: 'deactivate'})
    }
    return res.json(user)
  } else if (doNotSignup) {
    return res.status(400).json({message: 'invalid request'})
  }

  const exist = await findExistingUserByEmail(email)
  if (exist) {
    return res.status(409).json({code: 902, message: 'already exist', email: exist.password ? email : null})
  }

  user = await User.create({
    googleId,
    email,
    token: User.generateToken(),
    lastname,
    firstname,
    needSocialRename: true,
  })

  const u = user.toObject()
  u.create = 'true'
  res.json(u)
}

async function linelogin(req, res) {
  const { lineCode, page, doNotSignup } = req.body
  if (!lineCode) {
    return res.status(400).json({message: 'invalid request'})
  }

  const lineInfo = await fetchLineInfo({lineCode, page})
  if (!lineInfo) return res.status(400).json({message: 'invalid request'})

  const { lineId, lastname } = lineInfo
  let email = lineInfo.email
  if (email) email = email.toLowerCase()

  // すでに同じlineIdのユーザーがいる場合
  let user = await User.findOne({lineId})
  if (user) {
    if (user.deactivate) {
      return res.status(410).json({message: 'deactivate'})
    }
    return res.json(user)
  } else if (doNotSignup) {
    return res.status(409).json({code: 903, message: 'do not signup'})
  }

  // すでに同じemailのユーザーがいる場合
  const exist = await findExistingUserByEmail(email)
  if (exist) {
    return res.status(409).json({code: 902, message: 'already exist', email: exist.password ? email : null})
  }

  user = await User.create({
    lineId,
    email,
    token: User.generateToken(),
    lastname,
  })

  const u = user.toObject()
  u.create = 'true'
  res.json(u)

  if (!u.email) addNotice('addEmail', u.id)
}

// LINEログイン画面からのリダイレクト
// 元のページにリダイレクトさせる
async function linecallback(req, res) {
  const { error_description, code, state, page } = req.query

  const query = qs.stringify({
    login: 'line',
    code,
    state,
    error_description,
  })
  res.redirect(`${page}?${query}`)
}

async function reset(req, res) {
  const {email} = req.body
  if (!email) return res.status(400).json({})

  const user = await getUserByEmail(email)
  if (user === null) return res.status(404).json({message: 'not found'})

  res.json({message: 'OK'})
  emailResetPassword(user)
}

async function checkEmail(req, res) {
  const { email } = req.query
  const user = await getUserByEmail(email)
  let status = user ? 'yes' : 'no'
  if (user) {
    if (!user.password) status = 'nopass'
    if (user.deactivate) status = 'deactivate'
  }
  res.json({status})
}

// with authentication

async function show(req, res) {
  const user = req.user
  res.json(user)
}

async function isDeactivatable(req, res) {
  const deactivatable = await req.user.isDeactivatable()
  res.json(deactivatable)
}

async function setEmailPassword(req, res) {
  const email = req.body.email.toLowerCase()
  const count = await User.countDocuments({email: {$regex: `^${regexpEscaper(email)}$`, $options: 'i'}})
  if (count) {
    return res.status(409).json({code: 901, message: 'already exist'})
  }

  let user = req.user
  const password = User.cipher(req.body.newpassword, user.id)
  const token = User.generateToken()

  const set: any = {email, password, token, isIdBase: true}
  if (req.body.bounce !== undefined) set.bounce = req.body.bounce
  user = await User.findByIdAndUpdate(user.id, set, {new: true, runValidators: true})
  res.json(user)

  emailChangeEmail({email, lastname: user.lastname})

  const requests = await Request.find({customer: user.id})
  await Promise.all(requests.map(request => {
    return Request.findByIdAndUpdate(request.id, {$pull: {interview: 'bounce'}})
  }))

  if (user.lineId) {
    pushMessage({
      lineId: user.lineId,
      text: 'メールアドレスとパスワードが変更されました',
      contents: [{ type: 'uri', label: 'ログインして確認する', uri: `${webOrigin}/login/${user.token}`}],
    })
  }
}

async function setPassword(req, res) {
  let user = req.user
  const password = User.cipher(req.body.newpassword, user.id)
  const token = User.generateToken()

  user = await User.findByIdAndUpdate(user.id, {password, token, isIdBase: true}, {new: true, runValidators: true})
  res.json(user)

  if (user.lineId) {
    pushMessage({
      lineId: user.lineId,
      text: 'パスワードが変更されました',
      contents: [{ type: 'uri', label: 'ログインして確認する', uri: `${webOrigin}/login/${user.token}`}],
    })
  }
}

async function update(req, res) {
  if (req.body.email && req.body.newpassword) {
    return setEmailPassword(req, res)
  }
  if (req.body.newpassword) {
    return setPassword(req, res)
  }

  // ユーザーから渡されたIDは信用しないよ
  if (req.body.lineId) {
    delete req.body.lineId
  }
  if (req.body.googleId) {
    delete req.body.googleId
  }
  if (req.body.facebookId) {
    delete req.body.facebookId
  }

  if (req.body.googleToken) {
    const verify = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${req.body.googleToken}`).catch(e => ({error: e}))
    // smooosy.com以外で発行されたoauth認証は無効
    if (verify.error || verify.data.aud !== `${googleAuth.clientId}.apps.googleusercontent.com`) {
      return res.status(400).json({message: 'invalid request'})
    }
    req.body.googleId = verify.data.sub
    delete req.body.googleToken
  }

  if (req.body.googleId) {
    const user = await User.findOne({googleId: req.body.googleId})
    if (user && user.id !== req.user.id) {
      return res.status(409).json({code: 902, message: 'already exist'})
    }
  }

  // FB_TOKENからIDを取得するよ
  if (req.body.facebookToken) {
    const data = await FB.api('me', { fields: ['id'], access_token: req.body.facebookToken })
    req.body.facebookId = data.id
    delete req.body.facebookToken
  }

  if (req.body.facebookId) {
    const user = await User.findOne({facebookId: req.body.facebookId})
    if (user && user.id !== req.user.id) {
      return res.status(409).json({code: 902, message: 'already exist'})
    }
  }

  // lineCodeからlineId取得
  if (req.body.lineCode) {
    const lineInfo = await fetchLineInfo(req.body)
    if (!lineInfo) return res.status(400).json({message: 'invalid request'})

    req.body.lineId = lineInfo.lineId
    delete req.body.lineCode
    delete req.body.page
  }

  if (req.body.lineId) {
    const user = await User.findOne({lineId: req.body.lineId})
    if (user && user.id !== req.user.id) {
      return res.status(409).json({code: 902, message: 'already exist'})
    }
    pushMessage({
      lineId: req.body.lineId,
      text: `${req.user.lastname}様のアカウントとLINE連携が完了しました`,
    })
  }

  let user = req.user

  // パスワードバリデーション
  const password = req.body.password
  if (password && !user.verify(password)) {
    return res.status(400).json({message: 'unauthorized'})
  }

  // メールアドレスの変更
  if (req.body.email && user.email !== req.body.email) {
    const count = await User.countDocuments({email: {$regex: `^${regexpEscaper(req.body.email)}$`, $options: 'i'}})
    if (count) {
      return res.status(409).json({code: 901, message: 'already exist'})
    }
    emailChangeEmail({email: req.body.email, lastname: user.lastname})

    if (user.bounce) {
      const requests = await Request.find({customer: user.id})
      await Promise.all(requests.map(request => {
        return Request.findByIdAndUpdate(request.id, {$pull: {interview: 'bounce'}})
      }))
    }
  }

  // 本人確認書類
  if (req.body.identification) {
    req.body.identification.uploadedAt = new Date()
    req.body.identification.image = (req.body.identification.image || []).filter(i => i)
  }

  if (req.body.phone) {
    req.body.phone = req.body.phone.replace(/\-/g, '')
  }

  if (req.body.isMatchMore) {
    req.body.isMatchMore = true
  }

  delete req.body.admin
  delete req.body.password
  delete req.body.payjpId
  delete req.body.deactivate
  delete req.body.refer

  const $set: any = {}
  Object.keys(req.body).forEach(prop => ($set[prop] = req.body[prop]))
  if (password) {
    $set.token = User.generateToken()
  }

  const update: any = {$set}
  if (req.body.corporation) {
    update.$unset = {firstname: true}
  }

  user = await User.findByIdAndUpdate(user.id, update)
  await handleCSTaskIdentification({user})
  await handleCSTaskDeactivate({user})
  res.json(user)


  const setIsMatchMore = (req.user.isMatchMore === undefined && !!user.isMatchMore) // isMatchMoreがONになった
  const prevSchedule = userVirtuals.setupBusinessHour(req.user) // 元々スケジュールが設定されていた
  const postSchedule = userVirtuals.setupBusinessHour(user) // スケジュールが設定されている
  if (setIsMatchMore) {
    const proServices = await ProService.find({user: user.id}).select('id')
    BigQueryInsert(req, {
      event_type: 'enable_matchmore',
      event: JSON.stringify({ user_id: user.id, profiles: user.profiles.map(p => p._id.toString()), proServices: proServices.map(ps => ps.id)}),
    })
    // isMatchMore ONのときにすでに営業時間が設定されていたら営業時間イベントも送る
    if (postSchedule) {
      BigQueryInsert(req, {
        event_type: 'setup_schedule_matchmore',
        event: JSON.stringify({ user_id: user.id, profiles: user.profiles.map(p => p._id.toString()), proServices: proServices.map(ps => ps.id)}),
      })
    }
  // isMatchMore設定済みで営業時間が設定されたとき一度のみ
  } else if (!prevSchedule && postSchedule && user.isMatchMore) {
    const proServices = await ProService.find({user: user.id}).select('id')
    BigQueryInsert(req, {
      event_type: 'setup_schedule_matchmore',
      event: JSON.stringify({ user_id: user.id, profiles: user.profiles.map(p => p._id.toString()), proServices: proServices.map(ps => ps.id)}),
    })
  }

}


async function refers(req, res) {
  const refers = await User.find({
    _id: { $ne: req.user.id },
    'refer.user': req.user.id,
  }).select('lastname refer imageUpdatedAt deactivated')

  res.json(refers)
}

async function removeIdImage(req, res) {
  const key = req.body.key
  await S3.deleteObject({key}).catch((e) => console.error(e))
  res.json({})
}

async function deactivate(req, res) {
  const user = req.user
  await deactivateUser(user)
  res.json(user)
}

async function signedUrl(req, res) {
  if (req.query.type === 'id') {
    const id = new ObjectID()
    const key = `id/${id}.${req.query.ext}`
    const signedUrl = await S3.getSignedUrl({key, contentType: req.query.mime})
    const imageUrl = await S3.getSignedUrl({key, contentType: req.query.mime, method: 'getObject'})
    res.json({signedUrl, key, imageUrl})
  } else {
    const key = `users/${req.user.id}.jpg`
    const signedUrl = await S3.getSignedUrl({key})
    res.json({signedUrl})
  }

}

async function createForAdmin(req, res) {
  let { email } = req.body
  email = email.toLowerCase()
  const errors: any = {}
  if (!email) errors.email = '必須項目です'
  if (!req.body.lastname) errors.lastname = '必須項目です'
  if (Object.keys(errors).length) return res.status(400).json({message: 'invalid parameter', errors})

  let user = await getUserByEmail(email)
  if (user) {
    return res.status(409).json({code: 901, message: 'already exist'})
  }

  user = await User.create({
    email,
    token: User.generateToken(),
    lastname: req.body.lastname,
    firstname: req.body.firstname,
    phone: req.body.phone ? req.body.phone.replace(/\-/g, '') : undefined,
    admin: Math.min(Math.max(0, req.body.admin), 10),
  })

  res.json(user)
}

async function indexForAdmin(req, res) {
  const users  = await User
    .find({admin: {$gt: 0}})
    .sort({createdAt: 1})
    .select('lastname firstname email admin tools imageUpdatedAt')
    .lean({virtuals: ['id', 'image']})

  res.json(users)
}

async function showForAdmin(req, res) {
  let user = await User
    .findOne({_id: req.params.id})
    .populate({
      path: 'profiles',
      select: 'name',
    })
  if (user === null) return res.json(null)

  user = user.toObject()
  user.requests = await Request
    .find({customer: user.id})
    .select('address service createdAt')
    .populate({
      path: 'service',
      select: 'name',
    })

  if (user.pro) {
    user.stat = await ProStat.findOne({pro: user.id})
  }

  res.json(user)
}

async function searchForAdmin(req, res) {
  const cond: any = {}
  if (req.query.phone) {
    cond.phone = req.query.phone
  }
  if (req.query.email) {
    cond.email = req.query.email
  }

  let user = await User.findOne(cond)
    .populate({
      path: 'profiles',
      select: 'name',
    })
  if (user === null) return res.json(null)

  user = user.toObject()
  user.requests = await Request.find({ customer: user.id }).sort('-createdAt').limit(5)
  res.json(user)
}

async function updateForAdmin(req, res) {
  let user = await User.findOne({_id: req.params.id})
  if (user === null) return res.status(404).json({message: 'not found'})

  if (req.body.updatedAt && !moment(req.body.updatedAt).isSame(user.updatedAt)) {
    return res.status(409).json({message: 'updatedAt mismatch'})
  }

  if (!req.user.admin || req.user.admin < 10) {
    delete req.body.admin
  }

  if (req.body.identification) {
    if (user.identification.status === 'pending' && req.body.identification.status === 'valid' && user.pro) {
      // 本人確認完了のメールを送信
      req.body.identification.invalidReason = ''
      emailIdentificationValid({user})
    } else if (user.identification.status === 'pending' && req.body.identification.status === 'invalid' && req.body.identification_invalid !== 'other' && user.pro) {
      // 本人確認NG理由のメールを送信
      const reason = req.body.identification_invalid
      req.body.identification.invalidReason = reason
      emailIdentificationInvalid({user, reason})
    }
    for (const key of user.identification.image) {
      S3.deleteObject({key})
    }
  }

  if (req.body.phone) {
    req.body.phone = req.body.phone.replace(/\-/g, '')
  }

  const $unset: any = {}
  if (req.body.deactivateReason === null) {
    $unset.deactivateReason = true
    delete req.body.deactivateReason
  }
  if (req.body.requestDeactivate === null) {
    $unset.requestDeactivate = true
    delete req.body.requestDeactivate
  }

  delete req.body.identification_invalid
  delete req.body.password
  delete req.body.payjpId
  delete req.body.deactivate
  delete req.body.refer
  delete req.body.lineId
  delete req.body.profiles
  const updateBody: any = {$set: req.body}
  if (Object.values($unset).length) updateBody.$unset = $unset
  user = await User.findByIdAndUpdate(user.id, updateBody)

  res.json(user)
  await handleCSTaskIdentification({user})
  await handleCSTaskDeactivate({user})
}

async function signedUrlForAdmin(req, res) {
  const key = `users/${req.params.id}.jpg`
  const signedUrl = await S3.getSignedUrl({key})
  res.json({signedUrl})
}

async function statsForAdmin(req, res) {
  const data = []
  const users = await User.find({_id: {$in: req.body.users}}).select('profiles')
  for (const user of users) {
    const spent = await PointTransaction
      .find({
        user: user.id,
        type: 'consume',
        meet: {$exists: true},
        refund: {$ne: true},
      })
      .select('point meet')
      .populate({
        path: 'meet',
        select: 'price priceType hiredAt',
      })

    const initial = {price: 0, point: 0, hired: 0, total: 0}

    const stats = spent.reduce((data, t) => {
      if (t.meet.priceType === 'fixed') {
        if (t.meet.hiredAt) {
          data.price += t.meet.price
          data.hired++
        }
        data.point -= t.point
        data.total++
      } else if (t.meet.priceType === 'hourly') {
        if (t.meet.hiredAt) {
          data.price += t.meet.price * 5
          data.hired++
        }
        data.point -= t.point
        data.total++
      }
      return data
    }, initial) || initial

    const counts = await Promise.all([
      Meet.countDocuments({
        pro: user.id,
        createdAt: {
          $gt: moment().subtract(2, 'months').startOf('month').toDate(),
          $lt: moment().subtract(2, 'months').endOf('month').toDate(),
        },
      }),
      Request.countDocuments({
        sent: { $in: user.profiles },
        createdAt: {
          $gt: moment().subtract(2, 'months').startOf('month').toDate(),
          $lt: moment().subtract(2, 'months').endOf('month').toDate(),
        },
      }),
      Meet.countDocuments({
        pro: user.id,
        createdAt: {
          $gt: moment().subtract(1, 'months').startOf('month').toDate(),
          $lt: moment().subtract(1, 'months').endOf('month').toDate(),
        },
      }),
      Request.countDocuments({
        sent: { $in: user.profiles },
        createdAt: {
          $gt: moment().subtract(1, 'months').startOf('month').toDate(),
          $lt: moment().subtract(1, 'months').endOf('month').toDate(),
        },
      }),
      Meet.countDocuments({
        pro: user.id,
        createdAt: {
          $gt: moment().startOf('month').toDate(),
          $lt: moment().endOf('month').toDate(),
        },
      }),
      Request.countDocuments({
        sent: { $in: user.profiles },
        createdAt: {
          $gt: moment().startOf('month').toDate(),
          $lt: moment().endOf('month').toDate(),
        },
      }),
    ])
    stats.sent = [
      [ counts[0], counts[1] ],
      [ counts[2], counts[3] ],
      [ counts[4], counts[5] ],
    ]

    const [ lastMeet, bought, limited ] = await Promise.all([
      Meet.findOne({pro: user.id}).select('createdAt').sort('-createdAt'),
      PointTransaction.find({user: user.id, type: { $in: ['bought', 'autoCharge']}}).select('price'),
      PointTransaction.find({user: user.id, type: 'limited'}).select('point'),
    ])
    stats.lastMeetAt = lastMeet ? lastMeet.createdAt : null
    stats.bought = bought.reduce((sum, b) => sum + b.price, 0)
    stats.limited = limited.reduce((sum, b) => sum + b.point, 0)
    data.push(stats)
  }

  res.json(data)
}

async function deactivateForAdmin(req, res) {
  const user = await User.findOne({_id: req.params.id})
  if (user === null) return res.status(404).json({message: 'not found'})
  await deactivateUser(user, req.user.lastname)
  res.json(user)
}

async function getLineState(req, res) {
  res.json({connected: !!req.user.lineId})
}

async function pushMessageForAdmin(req, res) {
  const user = await User.findOne({_id: req.params.id})
  if (user === null) return res.status(404).json({message: 'not found'})
  if (!user.lineId) return res.status(404).json({message: 'no LINE ID'})

  const { text } = req.body
  if (!req.body.text) return res.status(400).json({message: 'no message'})

  pushMessage({lineId: user.lineId, text})
  res.json({})

  await LineLog.create({
    user: user,
    lineId: user.lineId,
    text,
  })
}

async function removeLine(req, res) {
  let user = req.user
  user = await User.findByIdAndUpdate(user.id, {$unset: {lineId: 1, lineCode: 1}})
  res.json(user)
}

async function sendgridWebhook(req, res) {
  const eventList = ['bounce', 'click', 'open']
  const events = req.body || []
  for (const e of events) {
    if (!eventList.includes(e.event)) continue

    const log = await MailLog.findById(e.mailLogId)
    if (log) {
      const $set: any = {}
      if (e.event === 'bounce') {
        $set.bounce = true
        $set.bouncedAt = new Date()
      } else if (e.event === 'click') {
        $set.click = true
        $set.clickedAt = new Date()
      } else if (e.event === 'open') {
        $set.open = true
        $set.openedAt = new Date()
      }
      await MailLog.findByIdAndUpdate(log.id, {$set})
    }

    if (e.event === 'bounce' && e.type === 'bounce') {
      let user = await getUserByEmail(e.email)
      if (!user) continue

      user = await User.findByIdAndUpdate(user.id, {$set: {bounce: true}})

      const requests = await Request.find({customer: user.id}).select('interview')
      for (const request of requests) {
        await Request.findByIdAndUpdate(request.id, {$addToSet: {interview: 'bounce'}})
      }
      const message = `SendGridバウンス: ${user.email} ${user.lastname} ${user.firstname}\n${e.category && e.category[1] ? `テンプレート: ${e.category[1]}\n` : ''}理由: ${e.reason}\n${JSON.stringify(e)}`
      slack({message, room: 'ops', channel: '#bot_bounce'})
    }
  }
  res.json({})
}

async function fetchLineInfo({lineCode, page}) {
  try {
    // access token 取得
    const data = await axios.post('https://api.line.me/oauth2/v2.1/token', qs.stringify({
      grant_type: 'authorization_code',
      code: lineCode,
      redirect_uri: `${webOrigin}/api/linecallback?page=${page}`,
      client_id: line.clientId,
      client_secret: config.get('linebot.clientSecret'),
    })).then(res => res.data)
    const accessToken = data.access_token
    const { friendFlag } = await axios.get('https://api.line.me/friendship/v1/status', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(res => res.data)

    const decoded = jwt.verify(data.id_token, config.get('linebot.clientSecret'))
    const lineId = decoded.sub
    const lastname = decoded.name
    const image = decoded.picture
    const email = decoded.email
    await LineProfile.findOneAndUpdate(
      { userId: lineId },
      { userId: lineId, displayName: lastname, pictureUrl: image, blocked: !friendFlag },
      { upsert: true, new: true, runValidators: true }
    )
    return { lineId, lastname, image, email }
  } catch (e) {
    console.error(e.stack)
    return
  }
}

async function findExistingUserByEmail(email) {
  if (!email) return false

  if (email.includes('@gmail.com')) {
    // gmailのユーザーを全部取得
    const allEmails = await User.find({email: /@gmail\.com/}).distinct('email')
    // 前半部分をdot無しにする関数
    const getUniquePart = address => address.split('@')[0].replace(/\./g, '')
    // 全て小文字にして比較
    const uniquePart = getUniquePart(email.toLowerCase())
    const foundEmail = allEmails.find(e => getUniquePart(e.toLowerCase()) === uniquePart)
    const user = await User.findOne({email: {$regex: `^${regexpEscaper(foundEmail)}$`, $options: 'i'}})
    return user
  }

  const user = await User.findOne({email: {$regex: `^${regexpEscaper(email)}$`, $options: 'i'}})
  return user
}

async function getUserByEmail(email) {
  const user = await User.findOne({email: {$regex: `^${regexpEscaper(email)}$`, $options: 'i'}})
  return user
}
