export {}
const { Notice } = require('../models')
const moment = require('moment')
const { timeNumbers } = require('@smooosy/config')

module.exports = {
  index,
  read,
  readAll,
  addNotice,
}

const PER_PAGE = 100

async function index(req, res) {
  const page = parseInt(req.query.page || 1, 10)
  const offset = PER_PAGE * (page - 1)

  // 期限切れ依頼の通知は既読にする
  const expired = await Notice
    .find({
      user: req.user.id,
      checked: {$ne: true},
      type: 'newRequest',
      target: {$exists: true},
    })
    .populate({
      path: 'target.item',
      select: 'createdAt',
    })
    .lean()
  const expiredIds = expired
    .filter(e => e.target.item.createdAt < moment().subtract(timeNumbers.requestExpireHour, 'hour'))
    .map(e => e._id)
  await Notice.updateMany({_id: {$in: expiredIds}}, {checked: true})

  const unread = await Notice.count({user: req.user.id, checked: { $ne: true } })
  const notices = await Notice.find({user: req.user.id}).limit(PER_PAGE).skip(offset)
    .sort({createdAt: -1})

  res.json({ notices, unread, page })
}

async function read(req, res) {

  let notice = await Notice.findOne({_id: req.params.id})
  if (notice === null) res.json(null)
  notice = await Notice.findByIdAndUpdate(notice.id, {$set: {checked: true}})

  res.json(notice)
}

async function readAll(req, res) {
  const cond: any = {
    user: req.user.id,
    checked: { $ne: true },
  }
  if (req.body.type) cond.type = req.body.type
  if (req.body.model) cond['target.model'] = req.body.model
  if (/^[0-9a-fA-F]{24}$/.test(req.body.item)) cond['target.item'] = req.body.item

  await Notice.update(
    cond,
    { checked: true },
    { multi: true }
  )

  await index(req, res)
}

async function addNotice(type, user, data) {

  let notice = null
  switch (type) {
    // 依頼があったとき
    case 'newRequest':
      notice = {
        target: {
          model: 'Request',
          item: data.requestId,
        },
        link: `/pros/requests/${data.requestId}`,
        title: '新しい依頼があります',
        description: `${data.lastname}様からの${data.service.name}の依頼があります。`,
      }
      break
    // ご指名があったとき
    case 'newContact':
      notice = {
        target: {
          model: 'Meet',
          item: data.meetId,
        },
        link: data.path,
        title: '新しい指名依頼があります',
        description: `${data.lastname}様からの${data.service.name}の指名があります。`,
      }
      break
    // チャットがあったとき
    case 'newChat':
      notice = {
        target: {
          model: 'Meet',
          item: data.meet.id,
        },
        link: data.toPro ? `/pros/${data.meet.status === 'waiting' ? 'talking' : 'hired'}/${data.meet.id}` :  `/requests/${data.meet.request}/responses/${data.meet.id}`,
        title: '新しいメッセージがあります',
        description: `${data.opponent}様からのメッセージがあります。確認しましょう。`,
      }
      break
    // 成約したとき
    case 'workStart':
      notice = {
        target: {
          model: 'Meet',
          item: data.meetId,
        },
        link: `/pros/hired/${data.meetId}`,
        title: '案件が決定しました！おめでとうございます！',
        description: `${data.customerName}様の案件が決定しました。`,
      }
      break
    // 依頼完了しクチコミを依頼
    case 'meetEnd':
      notice = {
        target: {
          model: 'Meet',
          item: data.meetId,
        },
        link: `/requests/${data.requestId}/responses/${data.meetId}`,
        title: 'クチコミを書きましょう',
        description: `依頼が完了しました。${data.proName}様のクチコミを書きましょう。`,
      }
      break
    // クチコミされたとき
    case 'reviewDone':
      notice = {
        target: {
          model: 'Meet',
          item: data.meetId,
        },
        link: `/account/reviews/${data.profileId}`,
        title: 'クチコミが投稿されました',
        description: `${data.lastname}様がクチコミを投稿しました。確認して返事を書きましょう。`,
      }
      break
    // クチコミが追記されたとき
    case 'reviewAppend':
      notice = {
        target: {
          model: 'Meet',
          item: data.meetId,
        },
        link: `/account/reviews/${data.profileId}`,
        title: 'クチコミが追記されました',
        description: `${data.lastname}様がクチコミに追記しました。確認して返事を書きましょう。`,
      }
      break
    // クチコミに返信があった時
    case 'reviewReply':
      notice = {
        target: {
          model: data.meetId ? 'Meet' : 'Profile',
          item: data.meetId && data.profileId,
        },
        link: data.path,
        title: 'クチコミに返事が来ました',
        description: `${data.profileName}様がクチコミに返事をしました。`,
      }
      break
    // 本人確認完了した時
    case 'identificationValid':
      notice = {
        target: {
          model: 'User',
          item: user,
        },
        link: '/account/profiles',
        title: '本人確認が完了しました',
        description: 'プロフィールページや依頼者に本人確認済みバッジが表示されます。',
      }
      break
    // 本人確認できなかった時
    case 'identificationInvalid':
      notice = {
        target: {
          model: 'User',
          item: user,
        },
        link: '/account/profiles',
        title: '本人確認ができませんでした',
        description: '本人確認ができませんでした。再度ご登録をお願いします。',
      }
      break
    // 見積もりが届いた時
    case 'newMeet':
      notice = {
        target: {
          model: 'Meet',
          item: data.meetId,
        },
        link: `/requests/${data.requestId}/responses/${data.meetId}`,
        title: '新しい見積もりがあります',
        description: `${data.proName}様からの見積もりがあります。確認しましょう。`,
      }
      break
    case 'paymentFailed':
      notice = {
        target: {
          model: 'ProService',
          item: data.proService,
        },
        link: `/account/services/${data.service._id.toString()}/budgets`,
        title: 'お支払いが失敗しました',
        description: '支払い情報を修正してください。',
      }
      break
    // スケジュール予約があるとき
    case 'bookingRequest':
      notice = {
        target: {
          model: 'Schedule',
          item: data.schedule.id,
        },
        link: `/pros/schedules/${data.schedule.id}/edit`,
        title: `${data.infomation.type}の予約のリクエストが届いています`,
        description: `${data.infomation.type}の予約のリクエストがきています。確認して承諾または辞退しましょう。`,
      }
      break
    // 未決定の依頼があるとき
    case 'remindMeets':
      notice = {
        target: {
          model: 'Request',
          item: data.request.id,
        },
        link: `/requests/${data.request.id}/overview`,
        title: 'プロが待っています',
        description: `${data.days}日前の${data.request.service.name}の依頼が未決定です。プロを決定しましょう。`,
      }
      break
    // ありがとう
    case 'thanks':
      notice = {
        target: {
          model: 'User',
          item: user,
        },
        link: '/account/thanks',
        title: 'ありがとうが届きました',
        description: `${data.lastname}様があなたにありがとうを送りました！ありがとうを返しましょう。`,
      }
      break
    // lineログイン後、メアド登録を促す
    case 'addEmail':
      notice = {
        target: {
          model: 'User',
          item: user,
        },
        link: '/account/info',
        title: 'メールアドレスが設定されていません',
        description: 'メールアドレスとパスワードを設定すると別の端末やPCからもログインできます。',
      }
      break
    // ご指名方式のポイントが少なくなった
    case 'lowBudget':
      notice = {
        target: {
          model: 'ProService',
          item: data.proService,
        },
        link: `/account/services/${data.proService.service.id}/budgets`,
        title: `${data.proService.service.name}の予算が少なくなりました`,
        description: `${data.proService.service.name}の予算が少なくなり、検索結果に表示されなくなりました。再度表示するには予算を追加してください。`,
      }
      break
    // ポイントの返還
    case 'refund':
      notice = {
        target: {
          model: 'Meet',
          item: data.meet.id,
        },
        link: '/account/points/history',
        title: 'ポイントが返還されました。',
        description: `${data.meet.customer.lastname}様の依頼に対するポイントが返還されました`,
      }
      break
    // まずは10回キャンペーン用
    case 'refundStarterPoint':
      notice = {
        target: {
          model: 'User',
          item: data.user._id,
        },
        link: '/account/points/history',
        title: 'ポイントが返還されました。',
        description: `まずは10回キャンペーンのポイント${data.point}ptが返還されました`,
      }
      break
    case 'pointBack':
      notice = {
        target: {
          model: 'User',
          item: data.user._id,
        },
        link: '/account/points/history',
        title: `${data.month}分の還元ポイントのお知らせ`,
        description: `${data.outgo.bought}ptの購入ポイントご利用で、${data.earned}ptが還元されました！`,
      }
  }

  if (notice) {
    return await Notice.create({ user, type, ...notice})
  }

}
