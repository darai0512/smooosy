export {}
const { User, Profile, Meet, Review, PointStatistic, PointTransaction, PointBalance, PointBought, ProService } = require('../models')
const config = require('config')
const Payjp = require('payjp')(config.get('payment.secret'))
const { emailPointGet, emailPointWillExpire, emailLowBudget, emailPointBack } = require('../lib/email')
const generateReceipt = require('../lib/receipt')
const epsilon = require('../lib/epsilon')
const { encrypt, decrypt } = require('../lib/encrypter')
const { slack, safeTraverse } = require('../lib/util')
const { addNotice } = require('./notices')
const { getRestPointInWeek } = require('./proServices')
const moment = require('moment')
const { payment, pointBackRate, webOrigin, rolloutDates, starterPack } = require('@smooosy/config')
const { onePointCampaign } = require('../campaigns/discountCampaign')
const { BigQueryInsert } = require('./bigquery')

const YEN_PER_POINT = payment.pricePerPoint.withTax
const PRO_SERVICE_DESCRIPTION_CAMPAIGN_LIMIT = 10
const STARTER_PACK_DISCOUNT = 0.8

module.exports = {
  charge,
  chargeNetbank,
  chargeConveni,
  webhookEpsilonConveni,
  webhookEpsilonPaid,
  redirectBack,
  redirectPaid,
  redirectError,
  addCard,
  removeCard,
  info,
  show,
  history,
  receipt,
  campaigns,
  applyCampaign,
  addForAdmin,
  showForAdmin,
  refundStarterPointForAdmin,
  getStarterPack,
  // function
  buyPoints,
  getPayjpUserWithCreditCard,
  addCreditCard,
  addLimitedPoint,
  addBoughtPoint,
  calcPoint,
  consumePoint,
  refundPoint,
  expirePoints,
  noticeExpire,
  discountPoint,
  checkPaymentData,
  getConsumed,
  earnPoint,
  // TODO: FEキャッシュの関係でアクセスされる可能性があるので一週間後消す(2019/8/23)
  creditCampaign,
}

// Figure out how much we want to charge the credit card for
// Get pro's credit card
// Charge the card for that amount
// Give the pro the needed amount of points
async function buyPoints({ user, points }) {
  const price = points * YEN_PER_POINT
  const payjpUser = await getPayjpUserWithCreditCard(user.id)

  try {
    await Payjp.charges.create({
      customer: payjpUser.id,
      amount: price,
      currency: 'jpy',
      description: `${user.lastname} ${user.firstname} ${points}pt チャージ`,
      metadata: {
        point: points,
      },
    })
  } catch (e) {
    throw new Error('Could not charge user with PayJP: ' + JSON.stringify(e.response.body, null, '\t'))
  }

  // ポイント付与
  await addBoughtPoint({
    user: user.id,
    point: points,
    price: price,
    auto: true,
    platform: 'payjp',
    method: 'creditcard',
  } as any)
}

async function charge(req, res) {
  // token: payjpのtoken
  // price: 購入金額
  // point: 購入ポイント数
  const { token, price, discountPrice, point } = req.body
  let user = req.user

  let priceInt, givenPoint
  try {
    const data = await checkPaymentData({price, discountPrice, point, user})
    priceInt = data.priceInt
    givenPoint = data.givenPoint
  } catch (e) {
    return res.status(400).json({message: e.message})
  }

  let customerId
  try {
    const result = await addCreditCard(req.user.id, token, req)
    user = result.user
    customerId = result.cus.id
  } catch (e) {
    return res.status(400).json({message: e.message})
  }

  // 支払い
  try {
    await Payjp.charges.create({
      customer: customerId,
      amount: priceInt,
      currency: 'jpy',
      description: `${user.lastname} ${user.firstname} ${givenPoint}pt 購入`,
      metadata: {
        point: givenPoint,
      },
    })
  } catch (e) {
    const errorType = safeTraverse(e, ['response', 'body', 'error', 'type'])
    if (!errorType) console.error(e.response.body)

    const message = {
      client_error: '決済リクエストが正しくありません。解決しない場合はinfo@smooosy.bizにご連絡ください。',
      card_error: 'カード情報の不備もしくは期限切れです。カード情報を更新するか別のカードをお試しください。',
      server_error: '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。',
    }[errorType] || '不明なエラーです。'
    return res.status(400).json({message})
  }

  // ポイント付与
  await addBoughtPoint({
    user: user.id,
    point: givenPoint,
    starterPoint: discountPrice ? givenPoint : null,
    price: priceInt,
    platform: 'payjp',
    method: 'creditcard',
  } as any)

  await show(req, res)

  emailPointGet({
    user,
    type: 'bought',
    point: givenPoint,
    price: priceInt,
    method: 'creditcard',
  })
}

async function chargeNetbank(req, res) {
  // price: 1セットの購入金額
  // netbank: 銀行種
  // path: 戻りURLのpath
  // point: 購入ポイント数
  const { price, netbank, path, point } = req.body
  const user = req.user

  let priceInt, givenPoint
  try {
    const data = await checkPaymentData({price, point})
    priceInt = data.priceInt
    givenPoint = data.givenPoint
  } catch (e) {
    return res.status(400).json({message: e.message})
  }

  if (!epsilon.validateNetbank(netbank)) {
    return res.status(400).json({message: '銀行種別が正しくありません'})
  }

  let response
  try {
    response = await epsilon.orderNetbank({user, givenPoint, priceInt, netbank, path})
  } catch (e) {
    console.error('Epsilon API went wrong')
    console.error(e)
    return res.status(400).json({message: '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。'})
  }

  if (response.result !== '1') {
    const message = `エラーが発生しました「${response.err_detail} (${response.err_code})」`
    console.error('Epsilon order API Error: ' + message)
    console.error(response)
    return res.status(400).json({message})
  }

  res.json(response)
}

async function chargeConveni(req, res) {
  // price: 1セットの購入金額
  // conveni: コンビニ種
  // phone: 電話番号
  // point: 購入ポイント数
  const { price, conveni, phone, point } = req.body
  const user = req.user

  let priceInt, givenPoint
  try {
    const data = await checkPaymentData({price, point})
    priceInt = data.priceInt
    givenPoint = data.givenPoint
  } catch (e) {
    return res.status(400).json({message: e.message})
  }

  if (!epsilon.validateConveni(conveni)) {
    return res.status(400).json({message: 'コンビニ種別が正しくありません'})
  }
  if (!epsilon.validatePhone({conveni, phone})) {
    return res.status(400).json({message: '電話番号の形式が正しくありません'})
  }


  let response
  try {
    response = await epsilon.orderConveni({user, givenPoint, priceInt, conveni, phone})
  } catch (e) {
    console.error('Epsilon API went wrong')
    console.error(e)
    return res.status(400).json({message: '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。'})
  }

  if (response.result !== '1') {
    const message = `エラーが発生しました「${response.err_detail} (${response.err_code})」`
    console.error('Epsilon order API Error: ' + message)
    console.error(response)
    return res.status(400).json({message})
  }

  if (response.payment_code !== '3') {
    console.error('Epsilon order API Error')
    console.error(response)
    return res.status(400).json({message: '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。'})
  }

  await saveTransCode(user, response)

  res.json(epsilon.filterConveniResponse(response))
}

// epsilon コンビニ・ペイジー入金通知
async function webhookEpsilonConveni(req, res) {
  res.set('Content-Type', 'text/plain')
  try {
    const code = encrypt(req.body.trans_code)
    const orderNumber = req.body.order_number
    const givenPoint = parseInt(req.body.memo1, 10)
    const priceInt = parseInt(req.body.item_price, 10)
    const isPayeasy = req.body.conveni_code === payment.netbankTypes.payeasy.code

    let user = await User.findOne({_id: req.body.user_id, 'conveniCode.code': code})
    if (user === null) return res.send('0 001 USER_NOT_FOUND')

    const index = user.conveniCode.findIndex(c => c.code === code)
    if (index === -1) return res.send('0 001 USER_NOT_FOUND')

    user.conveniCode.splice(index, 1)
    user = await User.findByIdAndUpdate(user.id, {$set: {conveniCode: user.conveniCode}})

    // ポイント二重付与を避けるため先に成功レスポンスを返す
    res.send('1')

    // ポイント付与
    await addBoughtPoint({
      user: user.id,
      point: givenPoint,
      price: priceInt,
      platform: 'epsilon',
      method: isPayeasy ? 'netbank' : 'conveni',
      orderNumber,
    } as any)

    emailPointGet({
      user,
      type: 'bought',
      point: givenPoint,
      price: priceInt,
      method: isPayeasy ? 'netbank' : 'conveni',
    })
  } catch (e) {
    console.error('Webhook Epsilon Conveni Error')
    console.error(e)
    res.send('0 999 INTERNAL_SERVER_ERROR')
  }
}

// epsilon 全ての決済完了通知
async function webhookEpsilonPaid(req, res) {
  res.set('Content-Type', 'text/plain')
  try {
    const response = await epsilon.getOrderInfo({trans_code: req.body.trans_code})
    const user = await User.findById(response.user_id)
    const fullName = user ? `${user.lastname}${user.firstname ? ` ${user.firstname}` : ''}` : response.user_id
    const givenPoint = parseInt(response.memo1, 10)
    const priceInt = parseInt(response.item_price, 10)
    const paymentType = config.get('payment.epsilon.paymentTypes')[response.payment_code]

    slack({
      room: 'bot-payment',
      message: `\`¥${priceInt.toLocaleString()}\`の決済を完了しました。`,
      attachments: [
        {
          color: '#36a64f',
          fields: [
            { short: true, title: '支払い手段', value: paymentType },
            { short: true, title: '金額', value: `¥${priceInt.toLocaleString()}` },
            { short: true, title: 'メモ', value: `${fullName} ${givenPoint}pt 購入` },
            { short: true, title: '支払い確定', value: '確定済み' },
          ],
        },
      ],
    })
    res.send('1')
  } catch (e) {
    console.error('Webhook Epsilon Paid Error')
    console.error(e)
    res.send('0 999 INTERNAL_SERVER_ERROR')
  }
}

// ネット銀行の画面でキャンセルした時にリダイレクトされてくる
async function redirectBack(req, res) {
  /*
   * order_number: 注文番号
   */
  const { order_number } = req.query
  const orderInfo = await epsilon.getOrderInfo({order_number}).catch(err => {
    console.error('Redirect Epsilon Back Error')
    console.error(err.message)
    return {}
  })
  const path = orderInfo.memo2 || '/account/points'

  return res.redirect(`${path}?redirect=cancel`)
}

// ネット銀行決済完了後にリダイレクトされてくる
async function redirectPaid(req, res) {
  /*
   * trans_code: トランザクションコード
   * order_number: 注文番号
   * user_id: ユーザーID
   * state: 状態（1:支払いずみ, 0:決済未完了）
   * payment_code: 決済種類
   */
  const { trans_code, state } = req.query

  // 該当する注文情報取得
  // order_numberはキャンセル時にユーザーに露出するので使わない
  const orderInfo = await epsilon.getOrderInfo({trans_code}).catch(err => {
    console.error(`Redirect Epsilon Paid Error: can not get orderInfo "${trans_code}"`)
    console.error(err.message)
    return {}
  })
  const path = orderInfo.memo2 || '/account/points'

  const user = await User.findById(orderInfo.user_id)
  if (user === null) {
    console.error(`Redirect Epsilon Paid Error: user not found "${orderInfo.user_id}"`)
    return res.redirect(`${path}?redirect=error`)
  }

  // pay-easyはコンビニと同じ仕組み
  if (orderInfo.payment_code === '7') {
    try {
      await saveTransCode(user, orderInfo)
      return res.redirect(`${path}?redirect=payeasy`)
    } catch (e) {
      console.error('Redirect Epsilon Paid Error')
      console.error(e.message)
      return res.redirect(`${path}?redirect=error`)
    }
  }

  if (state !== '1' || !['4', '5'].includes(orderInfo.payment_code)) {
    return res.redirect(`${path}?redirect=error`)
  }

  const orderNumber = orderInfo.order_number
  const givenPoint = parseInt(orderInfo.memo1, 10)
  const priceInt = parseInt(orderInfo.item_price, 10)

  // 重複付与を防ぐ
  const exist = await PointTransaction.count({orderNumber})
  if (exist !== 0) {
    return res.redirect(`${path}?redirect=error`)
  }

  // ポイント付与
  await addBoughtPoint({
    user: user.id,
    point: givenPoint,
    price: priceInt,
    platform: 'epsilon',
    method: 'netbank',
    orderNumber,
  } as any)

  res.redirect(`${path}?redirect=paid`)

  emailPointGet({
    user,
    type: 'bought',
    point: givenPoint,
    price: priceInt,
    method: 'netbank',
  })
}

async function redirectError(req, res) {
  return res.redirect('/account/points?redirect=error')
}

// コンビニ・Pay-easyでtrans_codeを保存する処理
async function saveTransCode(user, orderInfo) {
  // 30日以上期限切れのものは削除する
  // その他はSMOOOSY内でキャンセル扱いにする
  // epsilonにはキャンセル処理がないので入金されるとポイント付与
  user.conveniCode = user.conveniCode
    .filter(c => moment().diff(c.expiredAt, 'day') < 30)
    .map(c => ({ code: c.code, expiredAt: c.expiredAt, status: 'cancel' }))

  // 新しいtrans_codeをhashに変換して保存
  user.conveniCode.unshift({
    code: encrypt(orderInfo.trans_code),
    expiredAt: new Date(orderInfo.conveni_limit),
    status: 'waiting',
  })
  await User.findByIdAndUpdate(user.id, {$set: {conveniCode: user.conveniCode}})
}


async function addCard(req, res) {
  // token: payjpのtoken
  const { token } = req.body

  let user
  try {
    const result = await addCreditCard(req.user.id, token, req)
    user = result.user
  } catch (e) {
    return res.status(400).json({message: e.message})
  }

  const payjpCustomer = await Payjp.customers.retrieve(user.payjpId)
    .catch(err => {
      console.error('PAYJP retrieve user API error')
      console.error(err.message)
    })

  res.json({payjpCustomer})
}

async function removeCard(req, res) {
  const user = req.user
  try {
    // 顧客情報からクレジットカードを消す
    // 顧客情報データ自体は残る
    await Payjp.customers.cards.delete(user.payjpId, req.body.card)
    const cus = await Payjp.customers.retrieve(user.payjpId)
    if (cus.metadata.userId !== user.id) throw new Error()

    await User.findByIdAndUpdate(user.id, {
      $set: {
        hasActiveCard: false,
      },
    })

    // クレカ削除した
    BigQueryInsert(req, {
      event_type: 'delete_card',
      event: JSON.stringify({
        user_id: user._id.toString(),
        payjp_id: cus.id,
      }),
    })

    res.json(cus)
  } catch (e) {
    return res.status(400).json({message: 'Wrong Card Id'})
  }
}

// payjpのcustomerデータとepsilonのコンビニ支払いデータの取得
async function info(req, res) {
  const user = req.user

  const fetchPayjpCustomer = !user.payjpId ? Promise.resolve() :
    Payjp.customers.retrieve(user.payjpId)
    .catch(err => {
      console.error('PAYJP retrieve user API error')
      console.error(err.message)
    })

  const waiting = user.conveniCode.find(c => c.status === 'waiting')
  const fetchConveniInfo = !waiting ? Promise.resolve() :
    epsilon.getOrderInfo({trans_code: decrypt(waiting.code)})
    .then(epsilon.filterConveniResponse)
    .catch(err => {
      console.error('Epsilon getsales2 API error')
      console.error(err.message)
    })

  let [ payjpCustomer, conveniInfo ] = await Promise.all([
    fetchPayjpCustomer,
    fetchConveniInfo,
  ])

  if (payjpCustomer && payjpCustomer.metadata.userId !== user.id) {
    console.error('Wrong payjp user')
    payjpCustomer = undefined
  }

  res.json({payjpCustomer, conveniInfo})
}

async function show(req, res) {
  const user = req.pointUser || req.user.id
  const { pointTotals, pointBalances, pointBought } = await calcPoint(user)
  const transactions = await PointTransaction
    .find({user})
    .populate({
      path: 'meet',
      select: 'customer',
      populate: {
        path: 'customer',
        select: 'lastname',
      },
    })
    .sort({createdAt: -1})
    .limit(10)

  res.json({
    sum: pointTotals,
    transactions,
    pointBalances,
    pointBought,
  })
}

async function history(req, res) {
  const transactions = await PointTransaction
    .find({user: req.user.id})
    .populate({
      path: 'meet',
      select: 'customer',
      populate: {
        path: 'customer',
        select: 'lastname',
      },
    })
    .sort({createdAt: -1})

  res.json(transactions)
}

async function receipt(req, res) {
  const start = moment([parseInt(req.params.year), parseInt(req.params.month) - 1, 1])
  const transactions = await PointTransaction.find({
    user: req.user.id,
    type: {
      $in: [ 'bought', 'autoCharge' ],
    },
    createdAt: {
      $gt: start.toDate(),
      $lt: start.endOf('month'),
    },
  }).lean()

  const option = {
    name: req.query.name,
    transactions,
  }
  const pdf = generateReceipt(option)
  pdf.pipe(res)
}

async function campaigns(req, res) {
  const [
    transactions,
    profiles,
    proServices,
    meets,
    referrerCount,
    reviewedServices,
  ] = await Promise.all([
    PointTransaction.find({
      user: req.user._id,
      campaign: { $exists: true },
    }).select('campaign').lean(),

    Profile.find({
      pro: req.user._id,
    })
    .select('description accomplishment advantage media')
    .lean(),

    ProService.find({
      user: req.user._id,
      disabled: { $ne: true },
    })
    .select('description service')
    .populate({
      path: 'service',
      select: 'name',
    })
    .lean(),

    Meet.find({pro: req.user._id}).select('hiredAt').lean(),

    User.countDocuments({
      _id: { $ne: req.user._id },
      'refer.user': req.user._id,
      'refer.sendMeet': true,
    }),

    Review.find({
      profile: { $in: req.user.profiles },
      service: { $exists: true },
    })
    .select('service')
    .sort('-createdAt')
    .distinct('service'),
  ])

  const usedList = transactions.map(t => t.campaign)

  const campaigns = config.get('campaigns')

  // TODO: after end of campaign, remove from config and remove this filter
  const list = Object.keys(campaigns).map(key => {
    // サービスごとに付与されるキーだけ処理が別
    let clear = 0
    if (key === 'reviews') {
      // 自分の登録サービス一覧
      const myServices = proServices.map(p => p.service)
      const services = []
      for (const id of reviewedServices) {
        const index = myServices.map(s => s._id).indexOf(id)
        if (index !== -1) {
          const s = myServices[index]
          myServices.splice(index, 1)
          services.push(s)
          clear++
        }
        if (clear === 5) break
      }

      for (const s of myServices) {
        if (services.length === 5) break
        services.push(s)
      }

      campaigns[key].level = services.map(s => `${s.name}のクチコミ`)
    } else if (key === 'proServiceDescription') {
      const services = []
      const nonClearServices = []
      for (const ps of proServices) {
        if (ps.description) {
          services.push(ps.service)
          clear++
        } else {
          nonClearServices.push(ps.service)
        }
        if (clear >= PRO_SERVICE_DESCRIPTION_CAMPAIGN_LIMIT) break
      }

      for (const s of nonClearServices) {
        if (services.length >= PRO_SERVICE_DESCRIPTION_CAMPAIGN_LIMIT) break
        services.push(s)
      }

      campaigns[key].level = services.map(s => `${s.name}サービスの自己紹介設定`)
    } else {
      clear = canApply(key, req.user, profiles, meets, referrerCount)
    }

    let applied = 0
    let status = 'open'

    if (campaigns[key].level) {
      applied = usedList.filter(k => k === key).length
      if (campaigns[key].level.length <= applied) {
        status = 'done'
      } else if (applied < clear) {
        status = 'clear'
      } else if (clear === 0) {
        status = 'open'
      }
    } else if (usedList.indexOf(key) !== -1) {
      status = 'done'
    } else if (clear) {
      status = 'clear'
    }

    return { ...campaigns[key], key, status, applied, clear }
  })
  res.json(list)
}

async function applyCampaign(req, res) {
  const user = req.user
  const key = req.params.key
  // キャンペーン取得
  const campaign = config.get('campaigns')[key]
  if (!campaign) return res.status(400).json({message: 'Wrong Campaign Name'})

  // 二重付与防止
  const transactions = await PointTransaction.find({
    user: user.id,
    campaign: key,
  })

  const profiles = await Profile.find({_id: {$in: user.profiles}})
  const proServices = await ProService.find({user: user._id, disabled: { $ne: true }})

  // サービスごとに付与されるキーだけ処理が別
  if (key === 'reviews') {
    let clear = 0
    // レビュー受けたサービス一覧を取得
    let reviewedServices = await Review.aggregate([
      {$match: {profile: {$in: req.user.profiles}, service: {$exists: true}}},
      {$sort: {createdAt: -1}},
      {$group: {_id: '$service'}},
    ])
    reviewedServices = reviewedServices.map(r => r._id.toString())

    // 自分の登録サービス一覧
    const myServices = [].concat(...profiles.map(p => p.services.map(s => s.toString())))

    for (const id of reviewedServices) {
      const index = myServices.indexOf(id)
      if (index !== -1) {
        clear++
      }
      if (clear === 5) break
    }

    if (transactions.length >= clear) {
      return res.status(400).json({message: 'Can not Apply'})
    }
  } else if (key === 'proServiceDescription') {
    let clear = 0
    for (const ps of proServices) {
      if (ps.description) {
        clear++
      }
      if (clear >= PRO_SERVICE_DESCRIPTION_CAMPAIGN_LIMIT) break
    }

    if (transactions.length >= clear) {
      return res.status(400).json({message: 'Can not Apply'})
    }
  } else {
    const remain = (campaign.level ? campaign.level.length : 1) - transactions.length
    if (remain <= 0) return res.status(400).json({message: 'Already Applied'})

    const meets = await Meet.find({pro: user._id}).select('hiredAt').lean()
    const referrerCount = await User.countDocuments({
      _id: { $ne: user._id },
      'refer.user': user._id,
      'refer.sendMeet': true,
    })
    if (transactions.length >= canApply(key, user, profiles, meets, referrerCount)) {
      return res.status(400).json({message: 'Can not Apply'})
    }
  }

  // ポイント付与
  await addLimitedPoint({
    user: user.id,
    operator: user.id,
    point: campaign.point,
    expiredAt: moment().add(campaign.duration, 'months').endOf('month').toDate(),
    type: 'limited',
    campaign: key,
  })

  await campaigns(req, res)

  emailPointGet({
    user,
    type: 'limited',
    point: campaign.point,
  })
}

async function addForAdmin(req, res) {
  req.body.user = req.params.id
  req.body.operator = req.user.id
  if (!req.body.point || req.body.point <= 0) {
    return res.status(400).json({message: 'ポイントが間違っています'})
  }
  if (req.body.type === 'limited' && !req.body.expiredAt) {
    return res.status(400).json({message: '期限を指定してください'})
  }
  const user = await User.findById(req.body.user).select('lastname profiles')
  if (!user) return res.status(404).json({message: 'not found'})

  let slackMessage = '[ポイント操作] '
  try {
    switch (req.body.type) {
      case 'consume':
        await consumePoint(req.body)
        slackMessage += `${user.lastname}さんから${req.body.point}ptを削減`
        break
      case 'bought':
        req.body.auto = false
        req.body.platform = 'manual'
        req.body.method = 'banktransfer'
        req.body.price = req.body.point * YEN_PER_POINT
        await addBoughtPoint(req.body)
        slackMessage += `${user.lastname}さんに購入ポイント${req.body.point}ptを付与`
        break
      case 'limited':
        await addLimitedPoint(req.body)
        slackMessage += `${user.lastname}さんに期限ポイント${req.body.point}ptを付与`
        break
    }
  } catch (e) {
    return res.status(400).json({message: e.message})
  }
  if (user.profiles[0]) {
    slackMessage += `\n${webOrigin}/tools/#/stats/pros/${user.profiles[0]}`
  }

  await showForAdmin(req, res)
  await slack({room: 'cs', message: slackMessage})
}

async function showForAdmin(req, res) {
  req.pointUser = req.params.id
  await show(req, res)
}

async function refundStarterPointForAdmin(req, res) {
  const user = await User.findById(req.params.id).select('lastname profiles email deactivate bounce lineId notification')
  if (!user) return res.status(404).json({message: 'user not found'})

  // 複数プロフィールの場合、0番目のプロフィールを使う
  const profile = await Profile.findById(user.profiles[0]).select('signupCategory').populate('signupCategory')
  if (!profile) return res.status(404).json({message: 'profile not found'})

  const pointBought = await PointBought.findOne({user, deleted: { $ne: true }})
  if (!pointBought) return res.status(404).json({message: 'point not bought'})
  if (!pointBought.starterPointRunOutAt) return res.status(400).json({message: 'not run out'})
  if (pointBought.starterPointRefunded) return res.status(400).json({message: 'already refounded'})

  const point = starterPack.totalPoints[profile.signupCategory.key] || starterPack.totalPoints.default
  const pointBackDays = starterPack.pointBackDays[profile.signupCategory.key] || starterPack.pointBackDays.default

  if (moment().isBefore(moment(pointBought.starterPointRunOutAt).add(pointBackDays, 'day'))) {
    return res.status(400).json({message: 'before point back days'})
  }

  await PointTransaction.create({
    user,
    point,
    type: 'refundStarterPoint',
  })
  await PointBought.findByIdAndUpdate(pointBought._id, {
    $inc: { point },
    $set: {
      lastUpdatedAt: new Date(),
      starterPointRefunded: true,
    },
  })

  emailPointGet({
    user,
    type: 'refundStarterPoint',
    point,
  })
  await addNotice('refundStarterPoint', user, {user, point})

  await showForAdmin(req, res)

  let slackMessage = `[ポイント操作] ${user.lastname}さんに期限ポイント${point}ptを付与`
  slackMessage += `\n${webOrigin}/tools/#/stats/pros/${profile._id}`
  await slack({room: 'cs', message: slackMessage})
}

async function getStarterPack(req, res) {
  // プロフィールのメインカテゴリよりポイント割引情報を取得する
  const user = req.user
  const profiles = await Profile.find({pro: user._id.toString()})
    .select('reviewCount signupCategory')
    .populate({
      path: 'signupCategory',
      select: 'key name',
    })
  if (profiles.length === 0) return res.status(404).json('not found')
  // 複数プロフィールの場合、0番目のプロフィールを使う
  const profile = profiles[0]
  if (!profile.signupCategory) return res.status(404).json('not found')
  const point = starterPack.totalPoints[profile.signupCategory.key] || starterPack.totalPoints.default
  const pointBackDays = starterPack.pointBackDays[profile.signupCategory.key] || starterPack.pointBackDays.default

  // まずは10回キャンペーンのdiscountは一律２割引
  const price = point * YEN_PER_POINT
  const discountPrice = price * STARTER_PACK_DISCOUNT

  const reviewCount = profiles.reduce((sum, current) => sum + current.reviewCount, 0)
  const meets = await Meet.find({profile: {$in: profiles.map(p => p._id.toString())}}).select('status')
  const meetCount = meets.length
  const hiredCount = meets.filter(m => ['progress', 'done'].includes(m.status)).length
  const pointBought = await PointBought.findOne({user}).select('starterPoint')
  // まずは10回キャンペーン未購入 && 応募回数１回以下
  const isTarget = meetCount <= 1 && (!pointBought || !pointBought.starterPoint)

  const result = {
    price,
    discountPrice,
    point,
    signupCategory: profile.signupCategory,
    reviewCount,
    meetCount,
    hiredCount,
    isTarget,
    pointBackDays,
  }

  res.json(result)
}

// 購入ポイントチェック
async function checkPaymentData({ price, discountPrice = null, point, user = null }) {
  // price: 購入金額
  // point: ポイント数 (整合性チェックのため)

  let priceInt = parseInt(price, 10)

  // 購入金額は162円以上
  if (priceInt < YEN_PER_POINT) throw new Error('購入価格が不適切です')

  let givenPoint
  // 1ポイント162円で計算してポイント付与
  if (priceInt % YEN_PER_POINT === 0) {
    givenPoint = priceInt / YEN_PER_POINT
  }
  // 162円の倍数じゃない場合エラー。pointと一致しなければエラー。
  if (!givenPoint || givenPoint !== point) throw new Error('購入価格が不適切です')

  // 割引価格（現在まずは10回キャンペーンの２割引のみ）
  if (discountPrice && user) {
    // 一度でもポイント購入したらstarterPointはundefinedでない
    if (await PointBought.countDocuments({user, starterPoint: {$exists: true}})) throw new Error('購入価格が不適切です')
    // ２割引と値段が一致しない
    if (price * STARTER_PACK_DISCOUNT !== discountPrice) throw new Error('購入価格が不適切です')
    priceInt = parseInt(discountPrice, 10)
  }

  return { priceInt, givenPoint }
}

async function getPayjpUserWithCreditCard(userId) {
  const user = await User.findOne({_id: userId}).lean()

  if (!user) {
    throw new Error('no such user id')
  }

  if (!user.payjpId) {
    throw new Error('user does not have PayJP ID')
  }

  let payjpUser

  try {
    payjpUser = await Payjp.customers.retrieve(user.payjpId)
  } catch (e) {
    throw new Error('error fetching customer from PayJP: ' + e)
  }

  if (payjpUser.metadata.userId !== userId) {
    throw new Error(`PayJP user ID (${payjpUser.metadata.userId}) does not match smooosy user ID (${userId})`)
  }

  if (!payjpUser.default_card) {
    throw new Error('PayJP user does not have a default credit card')
  }

  return payjpUser
}

// クレジットカード登録(token: payjpのtoken)
async function addCreditCard(userId, token, req) {

  let user = await User.findOne({_id: userId})
  // 顧客IDを取得、なければ作成
  let customerId = user.payjpId
  let cus
  if (customerId) {
    // payjpの顧客情報取得
    try {
      cus = await Payjp.customers.retrieve(user.payjpId)
    } catch (e) {
      // 顧客情報がない場合、顧客作成に進むように空にする
      customerId = ''
    }
  }
  if (!customerId) {
    // トークンがないと顧客情報は作成できない
    if (!token) throw new Error('決済トークンが取得できませんでした')

    // payjpに顧客情報作成
    try {
      cus = await Payjp.customers.create({
        card: token,
        description: `${user.lastname} ${user.firstname}`,
        metadata: {
          userId: user.id,
        },
      })
    } catch (e) {
      throw new Error('クレジットカードの登録に失敗しました。時間をおいて再度お試しください。')
    }
    customerId = cus.id
    user = await User.findByIdAndUpdate(user.id, {
      payjpId: customerId,
      hasActiveCard: true,
    })
    // クレカ新規登録した
    BigQueryInsert(req, {
      event_type: 'add_first_card',
      event: JSON.stringify({
        user_id: user._id.toString(),
        payjp_id: cus.id,
      }),
    })
    // クレカ登録した
    BigQueryInsert(req, {
      event_type: 'add_card',
      event: JSON.stringify({
        user_id: user._id.toString(),
        payjp_id: cus.id,
      }),
    })
  }

  // payjpのユーザーID確認
  if (cus.metadata.userId !== user.id) {
    throw new Error('ユーザー情報が一致しませんでした')
  }

  // デフォルトクレジットカードの設定がない場合登録
  if (!cus.default_card) {
    try {
      await Payjp.customers.cards.create(cus.id, { card: token })
    } catch (e) {
      throw new Error('デフォルトクレジットカードの登録に失敗しました。時間をおいて再度お試しください。')
    }

    // Currently, adding new payment method clears a user's arrears status
    // because we assume that the payment method is valid and they'll be able
    // to auto-pay for MatchMore requests with it.
    // TODO: don't do this here - put them in arrears and clear this when
    // they make payment.
    await User.findByIdAndUpdate(user.id, {
      $set: {
        isInArrears: false,
        hasActiveCard: true,
      },
    })

    // クレカ登録した
    BigQueryInsert(req, {
      event_type: 'add_card',
      event: JSON.stringify({
        user_id: user._id.toString(),
        payjp_id: cus.id,
      }),
    })
  }


  return {user, cus}
}

// 以下ポイント操作関数

async function addLimitedPoint({user, operator, point, expiredAt, type, campaign}) {
  if (new Date() > new Date(expiredAt)) {
    throw new Error('Wrong ExpiredAt')
  }
  if (point <= 0) {
    throw new Error('Wrong Point')
  }

  // ポイント追加ログ
  const transaction = await PointTransaction.create({ user, operator, point, expiredAt, type, campaign })

  // 期限が同じ期限ポイントをupsertする
  await PointBalance.update(
    {
      user,
      expiredAt,
      deleted: { $ne: true },
    },
    {
      $inc: { point },
    },
    {upsert: true},
  )

  return transaction._id
}

async function addBoughtPoint({user, operator, point, starterPoint, price, auto, platform, method, orderNumber}) {
  // ポイント追加ログ
  const type = auto ? 'autoCharge' : 'bought'
  operator = operator || user
  const transaction = await PointTransaction.create({ user, operator, point, type, price, platform, method, orderNumber})

  const $inc = {point} as any
  if (starterPoint) $inc.starterPoint = starterPoint

  // 購入ポイントをupsertする
  await PointBought.update(
    {
      user,
      deleted: { $ne: true },
    },
    {
      $inc,
      $set: { lastUpdatedAt: new Date() },
    },
    {upsert: true},
  )

  return transaction._id
}

async function consumePoint({ user, operator, point, meet, request, service}) {
  if (point < 0) return
  const { pointTotals, pointBalances, pointBought } = await calcPoint(user)

  if (pointTotals.total < point) {
    throw new Error('Too much point to consume')
  }

  // ポイント消費ログ
  const transaction = await PointTransaction.create({ user, operator, point: -point, type: 'consume', meet, request })
  const breakdown = []

  // まずは期限ポイントから消費する
  for (const balance of pointBalances) {
    if (point === 0) {
      break
    } else if (balance.point > point) {
      breakdown.push({point: point, expiredAt: balance.expiredAt})
      await PointBalance.findByIdAndUpdate(balance.id, { $inc: { point: -point } })
      point = 0
      break
    } else {
      breakdown.push({point: balance.point, expiredAt: balance.expiredAt})
      await PointBalance.findByIdAndRemove(balance.id)
      point = point - balance.point
    }
  }

  // 消費しきれない場合、購入ポイントを消費する
  // 購入ポイントを使わない場合も最終ポイント利用日を更新する必要がある
  if (pointBought) {
    if (point > 0) {
      breakdown.push({point: point})
    }
    const $inc = { point: -point } as any
    const $set = { lastUpdatedAt: new Date() } as any
    if (pointBought.starterPoint > 0) {
      const diff = pointBought.starterPoint - point
      // 残高が尽きたら0にする
      const isRunOut = diff <= 0
      $inc.starterPoint = isRunOut ? -pointBought.starterPoint : -point
      if (isRunOut) $set.starterPointRunOutAt = new Date()
    }
    await PointBought.findByIdAndUpdate(pointBought.id, {
      $inc, $set,
    })
  }

  await PointTransaction.findByIdAndUpdate(transaction.id, {$set: {breakdown}})

  if (!meet) return transaction._id

  const proService = await ProService.findOne({user, service})
    .populate({path: 'user', select: 'email deactivate bounce lineId notification'})
    .populate({path: 'service', select: 'id name averagePoint'})
    .populate({path: 'profile', select: 'name'})

  // ポイントの残りが少ないか判定して、メール通知を送る
  if (proService && proService.budget && point > 0) {
    const rest = await getRestPointInWeek({userId: user, serviceId: service, budget: proService.budget})
    if (rest - point < proService.service.averagePoint && rest >= proService.service.averagePoint) {
      emailLowBudget({ user: proService.user, proService })
    }
  }

  return transaction._id
}

async function refundPoint(meetId) {
  let meet = await Meet.findOne({_id: meetId})
  if (!meet || meet.refund) return

  meet = await Meet.findByIdAndUpdate(meet.id, {$set: {refund: true}})
    .populate('pro')
    .populate({path: 'customer', select: 'lastname'})
    .populate({path: 'service', select: 'name'})

  const transaction = await PointTransaction.findOne({
    meet: meet.id,
    type: 'consume',
    refund: {$ne: true},
  })
  if (!transaction) return

  await PointTransaction.create({
    user: transaction.user,
    point: -transaction.point,
    type: 'refund',
    meet: transaction.meet,
  })
  for (const unit of transaction.breakdown) {
    if (!unit.expiredAt) {
      // 購入ポイントをupsertする
      await PointBought.update(
        {
          user: transaction.user,
          deleted: { $ne: true },
        },
        {
          $inc: { point: unit.point },
          $set: { lastUpdatedAt: new Date() },
        },
        {upsert: true},
      )
    } else if (new Date(unit.expiredAt) > new Date()) {
      // 期限が同じ期限ポイントをupsertする
      await PointBalance.update(
        {
          user: transaction.user,
          expiredAt: unit.expiredAt,
          deleted: { $ne: true },
        },
        {
          $inc: { point: unit.point },
        },
        {upsert: true},
      )
    } else {
      // 返還ポイントが期限切れの場合、ポイントを戻さず期限切れのログを作る
      await PointTransaction.create({
        user: transaction.user,
        point: -unit.point,
        expiredAt: unit.expiredAt,
        type: 'expire',
      })
    }
  }

  await PointTransaction.findByIdAndUpdate(transaction.id, {$set: {refund: true}})

  emailPointGet({
    user: meet.pro,
    type: 'refund',
    point: -transaction.point,
    service: meet.service,
    customer: meet.customer,
  })
  addNotice('refund', meet.pro, {meet})
}

async function calcPoint(user) {
  const [ pointBalances, pointBought ] = await Promise.all([
    PointBalance.find({
      user,
      deleted: { $ne: true },
    }).sort({expiredAt: 1}),
    PointBought.findOne({
      user,
      deleted: { $ne: true },
    }),
  ])
  const limited = pointBalances.reduce((sum, b) => sum + b.point, 0)
  return {
    pointTotals: {
      limited,
      bought: pointBought ? pointBought.point : 0,
      total: limited + (pointBought ? pointBought.point : 0),
    },
    pointBalances,
    pointBought,
  }
}

// 返り値はapplyできる回数
function canApply(campaignKey, user, profiles, meets, referrerCount) {
  switch (campaignKey) {
    case 'signup':
      return user.pro && user.profiles.length > 0 ? 1 : 0
    case 'avatar':
      return user.imageUpdatedAt ? 1 : 0
    case 'description':
      return profiles.filter(p => ((p.description ? p.description.length : 0) + (p.accomplishment ? p.accomplishment.length : 0) + (p.advantage ? p.advantage.length : 0)) >= 300).length > 0 ? 1 : 0
    case 'photo':
      return profiles.filter(p => p.media.length >= 16).length > 0 ? 4 :
             profiles.filter(p => p.media.length >= 8).length > 0 ? 3 :
             profiles.filter(p => p.media.length >= 4).length > 0 ? 2 :
             profiles.filter(p => p.media.length >= 1).length > 0 ? 1 : 0
    case 'referral':
      return Math.min(5, referrerCount)
    case 'inboundLink':
      return user.inboundLink ? 1 : 0
    case 'meet':
      return meets.length > 0 ? 1 : 0
    case 'identification':
      return !!user.identification && user.identification.status === 'valid' ? 1 : 0
    case 'tenMeets':
      return meets.filter(m => m.hiredAt).length >= 1 ? 1 : 0
    case 'line':
      return user.lineId ? 1 : 0
    case 'schedule':
      return user.schedule ? 1 : 0
    case 'twentyMeets':
      return meets.filter(m => m.hiredAt).length >= 2 ? 1 : 0
    default:
      return 0
  }
}

// 毎月1日0:00に前月末までのポイントを失効する
async function expirePoints() {
  const balances = await PointBalance.find({
    expiredAt: {$lt: new Date()},
    deleted: {$ne: true},
  })
  for (const balance of balances) {
    await PointTransaction.create({
      type: 'expire',
      user: balance.user,
      point: -balance.point,
      expiredAt: balance.expiredAt,
    })
    await PointBalance.findByIdAndUpdate(balance.id, {$set: {deleted: true}})
  }

  const boughts = await PointBought.find({
    lastUpdatedAt: {$lt: moment().subtract(2, 'years').toDate()},
    deleted: {$ne: true},
  })
  for (const bought of boughts) {
    await PointTransaction.create({
      type: 'delete',
      user: bought.user,
      point: -bought.point,
    })
    await PointBought.findByIdAndUpdate(bought.id, {$set: {deleted: true}})
  }
}

// 毎月1日朝9:00に月末の失効を予告する
async function noticeExpire() {
  const willExpire = await PointBalance
    .find({
      expiredAt: {$lt: moment().add(1, 'months').startOf('month').toDate()},
      deleted: {$ne: true},
    })
    .populate('user')

  for (const balance of willExpire) {
    if (!balance.user) continue
    emailPointWillExpire({
      user: balance.user,
      point: balance.point,
      expiredAt: balance.expiredAt,
    })
  }

  const willDelete = await PointBought
    .find({
      lastUpdatedAt: {$lt: moment().subtract(23, 'months').startOf('month').toDate()},
      deleted: {$ne: true},
    })
    .populate('user')

  for (const bought of willDelete) {
    if (!bought.user) continue
    emailPointWillExpire({
      user: bought.user,
      point: bought.point,
      expiredAt: moment().endOf('month').toDate(),
    })
  }
}

async function discountPoint({meetsCount, hiredCount, point, autoAccepted, proId, serviceId, requestCreatedAt}) {

  const pro = await User.findById(proId).select('hasActiveCard')
  const hasActiveCard = pro && pro.hasActiveCard
  const discounts = []
  let value = point

  if (point === 0) {
    return {
      point: 0,
      discounts,
    }
  }

  // 初回＋クレカ登録
  if (hasActiveCard && meetsCount === 0) {
    discounts.push({reason: 'firstCredit', point: -value})
    return {
      point: 0,
      discounts,
    }
  }

  if (await onePointCampaign(proId, serviceId)) {
    // 車キャンペーン
    // 1ptのみ残す
    const discount = value - 1
    if (discount > 0) {
      discounts.push({reason: 'onepointCampaign', point: -discount})
    }
    return {
      point: 1,
      discounts,
    }
  }

  // まずは10回キャンペーンの都合上、指定日以降を無効化する
  // 成約数割引
  if (moment(requestCreatedAt).isBefore(rolloutDates.disableLessHiredDiscount)) {
    if (hiredCount === 0) {
      const discount = Math.floor(0.3 * value)
      if (discount > 0) {
        discounts.push({reason: 'notHired', point: -discount})
        value -= discount
      }
    } else if (hiredCount === 1) {
      const discount = Math.floor(0.15 * value)
      if (discount > 0) {
        discounts.push({reason: 'hiredOnce', point: -discount})
        value -= discount
      }
    }
  }

  // ご指名ラクラク割引
  if (autoAccepted) {
    const discount = Math.floor(0.2 * value)
    if (discount > 0) {
      discounts.push({reason: 'promoOn', point: -discount})
      value -= discount
    }
  }

  return {
    point: value,
    discounts,
  }
}

async function giveMonthlyPoint({consumeLastMonth, key}) {
  for (const c of consumeLastMonth) {
    const earned = Math.floor(c.bought * pointBackRate.calc(c.bought))
    const exist = await PointStatistic.countDocuments({key, user: c.user})
    c.earned = earned
    c.exist = exist
    // create a pointtransaction if earned point > 0
    if (earned && !exist) {
      const transactionId = await addLimitedPoint({
        user: c.user,
        operator: c.user,
        point: earned,
        expiredAt: moment().add(12, 'months').endOf('month').toDate(),
        type: 'limited',
      } as any)
      c.transactionId = transactionId
    }
  }
}

// TODO: FEキャッシュの関係でアクセスされる可能性があるので一週間後消す(2019/8/23)
async function creditCampaign(req, res) {
  const user = req.user
  res.json({isTarget: false, meetCount: 0, isNewbie: false, campaignStartForThisUser: null, hasActiveCard: user.hasActiveCard})
}


async function monthlyStatic({start, end, consumeLastMonth, key}) {
  // this section is separated from creating PointTransactions
  // because adding points shoule be done as fast as possible
  for (const c of consumeLastMonth) {
    const exist = await PointStatistic.countDocuments({key, user: c.user})
    if (exist) continue
    const boughtIncome = await PointTransaction.find({
      user: c.user,
      operator: c.user,
      type: 'bought',
      createdAt: {
        $gte: start,
        $lt: end,
      },
    }).select('point').lean()
    const limitedIncome = await PointTransaction.find({
      user: c.user,
      operator: c.user,
      type: 'limited',
      createdAt: {
        $gte: start,
        $lt: end,
      },
    }).select('point').lean()

    await PointStatistic.create({
      user: c.user,
      key,
      income: {
        bought: boughtIncome.reduce((p, c) => p + c.point, 0),
        limited: limitedIncome.reduce((p, c) => p + c.point, 0),
      },
      outgo: {
        bought: c.bought,
        limited: c.limited,
      },
      earned: c.earned,
      transaction: c.transactionId,
    })
  }
}

async function getConsumed({start, end}) {
  // aggregate consumed points in last month (data structure: [{user, bought, limited, total}])
  const consumed = await PointTransaction.aggregate([{
    $match: {
      type: { $eq: 'consume' },
      point: { $lt: 0 },
      refund: { $ne: true },
      createdAt: {
        $gte: start,
        $lt: end,
      },
    },
  }, {
    $project: {
      byUser: {$eq: ['$user', '$operator']},
      user: true,
      breakdown: true,
      expiredAt: true,
      point: true,
    },
  }, {
    $match: {
      byUser: {$eq: true},
    },
  }, {
    $group: {
      _id: '$user',
      bought: {
        $sum: {
          $reduce: {
            input: '$breakdown',
            initialValue: 0,
            in: { $add: [{$cond: [{$eq: [{$toBool: '$$this.expiredAt'}, true]}, 0, '$$this.point']}, '$$value'] },
          },
        },
      },
      total: {
        $sum: {$abs: '$point'},
      },
    },
  }, {
    $project: {
      _id: false,
      user: '$_id',
      bought: true,
      limited: {$subtract: ['$total', '$bought']},
      total: true,
    },
  }])
  return consumed
}

async function pointBackNotice(key) {
  const statistics = await PointStatistic.aggregate([{
    $match: {
      key: { $eq: key },
      earned: {$gt: 0},
    },
  }, {
    $lookup: {
      from: 'users',
      foreignField: '_id',
      localField: 'user',
      as: 'user',
    },
  }, {
    $unwind: '$user',
  }, {
    $project: {
      key: true,
      'user._id': true,
      'user.email': true,
      'user.lastname': true,
      'user.notification': true,
      'user.bounce': true,
      'user.lineId': true,
      income: true,
      outgo: true,
      earned: true,
    },
  }])

  const month = moment(key).format('YYYY年MM月')
  for (const s of statistics) {
    s.month = month
    await addNotice('pointBack', s.user._id, s)
    emailPointBack(s)
  }
}

async function earnPoint({start, end}) {
  const consumeLastMonth = await getConsumed({start, end})
  const key = moment().format('YYYY-MM')
  await giveMonthlyPoint({consumeLastMonth, key})

  await monthlyStatic({start, end, consumeLastMonth, key})
  await pointBackNotice(key)
}
