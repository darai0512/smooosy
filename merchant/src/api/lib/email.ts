export {}
const config = require('config')
const { avatarColors, webOrigin, idInvalidReason, pointBackRate } = require('@smooosy/config')

const mjml2html = require('mjml')
const handlebars = require('handlebars')
const fs = require('fs')

const { slack } = require('./util')
const moment = require('moment')
const { pushMessage } = require('../routes/lines')
const { addNotice } = require('../routes/notices')
const { getActiveExperimentsForUser } = require('../routes/experiments')
const { dummyUser } = require('../routes/bigquery')
const platform = require('platform')
const { MailLog } = require('../models')

const sendgrid = require('./sendgrid')

const bigquery = require('./bigquery')
import bigquery_maillog = require('../bigquery_maillog.json')
const uuid = require('uuid')

const sendGridUuid = config.get('sendgrid.templateIdToSendGridUuid')

moment.updateLocale('en', {weekdays: ['日', '月', '火', '水', '木', '金', '土']})

function dontSendEmail(user, key?) {
  return !user.email || user.deactivate || user.bounce || (user.notification && user.notification[key] && user.notification[key].email === false)
}

function dontSendLine(user, key?) {
  return user.deactivate || !user.lineId || (user.notification && user.notification[key] && user.notification[key].line === false)
}

module.exports = {
  getTemplate,
  templateReplacer,
  // プロ
  emailSignupAsPro,
  emailSignupAsProFollowup,
  emailPaymentFailed,
  emailNewRequest,
  emailNewContact,
  emailLowBudget,
  emailUpdateRequest,
  emailMeetRead,
  emailWorkStart,
  emailMeetRevert,
  emailReviewDone,
  emailReviewAppend,
  emailReplyReview,
  emailDailyRemind,
  emailBookingRequest,
  emailRemindMeetsPro,
  emailRemindProfile,
  emailDeleteRequestPro,
  emailReportInsights,
  // ポイント
  emailPointGet,
  emailPointWillExpire,
  emailPointBack,
  // ユーザー
  emailCreateRequest,
  emailManyPass,
  emailNoMeet,
  emailNewMeet,
  emailRemindMeets,
  emailConfirmHired,
  emailMeetEnd,
  emailDeleteRequest,
  // lead
  emailNewRequestForLead,
  emailNewRequestForLeadText,
  // 両方
  emailNewChat,
  emailBookingUpdate,
  emailBookingRemind,
  // adminから
  emailResetPassword,
  emailChangeEmail,
  emailReviewRequest,
  emailAdminEditProfile,
  emailAdminSuspendProfile,
  emailIdentificationValid,
  emailIdentificationInvalid,
  emailOnBoarding,
  send,
  // export for test
  dontSendEmail,
  dontSendLine,
}


const buildRequestHTML = (request, forLead = false) => `
<div>
<div style="font-size: 18px;"><strong>依頼内容</strong></div>
<br />
<div style="color: #999999;"><strong>サービス名</strong></div>
<div>${request.service.name}</div>
<br />
${request.description.filter(d => d.answers.filter(a => (a.text || '').trim() || a.image).length).slice(0, forLead ? 4 : undefined).map(desc => {
  const checked = desc.answers.filter(a => a.checked).length > 0
  return `
  <div style="color: #999999;"><strong>${desc.label}</strong></div>
  <div>
  ${desc.answers.map(answer => `
    <div>
    ${checked ? (answer.checked ? '<span style="color: #1180cc;">✓ </span>' : '<span style="color: #e0e0e0;">✕ </span>') : ''}
    <span>${answer.text || ''}</span>
    ${answer.image ? `<p style="margin-left: 16px"><img src="${answer.image}&w=120&h=80" width="60" height="40" /></p>`: ''}
    </div>
  `).join('')}
  </div>
  `
}).join('<br />')}
</div>
`

const buildRequestText = (request, forLead = false) => {
  const detail = request.description.filter(d => d.answers.filter(a => (a.text || '').trim() || a.image).length).slice(0, forLead ? 4 : undefined).map(desc => {
    const checked = desc.answers.filter(a => a.checked).length > 0
    /* eslint-disable */
    return `●${desc.label}\n` +
      desc.answers.map(a => `　${checked && a.checked ? '◎' : '　'}${a.text || 'なし'}\n`).join('')
    /* eslint-enable */
  }).join('\n')

  return [
    {label: `----サービス名${'-'.repeat(40)}`, description: request.service.name},
    {label: `----エリア${'-'.repeat(44)}`, description: request.address},
    {label: `----依頼詳細${'-'.repeat(42)}`, description: detail},
  ].map(el => `${el.label}\n${el.description}`).join('\n')
}

async function getTemplate(id) {
  const template = await sendgrid.get().getTemplate(id)
  if (template) {
    return template.versions.filter(v => v.active)[0]
  }
  return null
}

function templateReplacer(content, replacer) {
  replacer = {
    origin: webOrigin,
    ...replacer,
  }
  Object.keys(replacer).forEach(key => {
    content = content.replace(new RegExp(`#${key}#`, 'g'), replacer[key])
  })
  return content
}

const newRequestTemplate = handlebars.compile(fs.readFileSync(__dirname + '/email-templates/new-request.mjml', 'utf8'))
const newContactTemplate = handlebars.compile(fs.readFileSync(__dirname + '/email-templates/new-contact.mjml', 'utf8'))

/**************************************************************
 * メールテンプレート
 **************************************************************/


// プロ用一覧

function emailSignupAsPro({user, profileId}) {
  const url = `${webOrigin}/account/profiles/${profileId}`
  const title = 'ご登録ありがとうございます'
  send({
    address: user.email,
    title,
    html: '',
    trackPath: 'emailSignupAsPro',
    substitutions: {
      lastname: user.lastname,
      title,
      url,
    },
  })
}

async function emailSignupAsProFollowup({user}) {
  const title = 'SMOOOSYにご登録いただきありがとうございます/SMOOOSYビジネスチーム'
  send({
    address: user.email,
    title,
    html: '',
    trackPath: 'emailSignupAsProFollowup',
    substitutions: {
      lastname: user.lastname,
      title,
    },
  })
}

function emailPaymentFailed({ user, service, proService }) {
  const url = `${webOrigin}/account/services/${service._id.toString()}/budgets`
  const title = 'お支払いが失敗しました: SMOOOSYを利用するために支払い方法を更新しましょう'
  const trackPath = 'emailPaymentFailed'
  if (!dontSendLine(user, 'paymentFailed')) {
    pushMessage({
      lineId: user.lineId,
      text: title,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('paymentFailed', user, { service, proService })

  if (dontSendEmail(user, 'paymentFailed')) return

  send({
    address: user.email,
    title,
    html: '',
    trackPath,
    substitutions: {
      title,
      url,
    },
  })
}

function buildRequestData({ request, lastname, isExactMatch, service, heading, webOrigin }: any) {
  const dateQuestion = request.description.find(d => d.type === 'calendar')

  return {
    request_id: request._id,
    lastname,
    dates: dateQuestion && dateQuestion.answers,
    service: service.name,
    prefecture: request.prefecture,
    city: request.city,
    mapImage: request.location && `${webOrigin}/api/maps/${request.location._id}/600/150`,
    questions: request.description.map(d => ({
      label: d.label,
      answers: d.answers.filter(
        // for single choice question, only show the chosen answer
        a => d.type !== 'singular' || a.checked
        )
        .map(a => ({
          text: a.text,
          checked: ['price', 'multiple'].includes(d.type) && a.checked,
          unchecked: ['price', 'multiple'].includes(d.type) && !a.checked,
          image: a.image,
        })),
    })),
    isExactMatch,
    webOrigin,
    heading,
  }
}

async function contact({ id, notificationType, profile, subject, url, template, context, notificationContext, logContext, categories = [] }) {
  const html = mjml2html(template(context), { minify: true }).html

  const user = profile.pro
  const trackPath = id
  if (!dontSendLine(user, notificationType)) {
    pushMessage({
      lineId: user.lineId,
      text: subject,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice(notificationType, user.id, notificationContext)

  if (dontSendEmail(user, notificationType)) return

  send({
    address: user.email,
    subject,
    html,
    trackPath,
    substitutions: {},
    log: logContext,
    isPrerendered: true,
    categories,
  })
}

async function emailNewRequest({ profiles, lastname, request, service }) {
  if (profiles.length === 0) return

  const url = `${webOrigin}/pros/requests/${request.id}`

  for (const profile of profiles) {
    const title = `🆕 ${profile.isExactMatch ? '[仕事条件にマッチ]' : ''} ${lastname}様が${request.city ? `${request.city}で` : ''}${request.service.providerName}を探しています！`
    const heading = `${lastname}様が${request.service.providerName}を探しています！`

    contact({
      id: 'emailNewRequest',
      notificationType: 'newRequest',
      profile,
      subject: title,
      url,
      template: newRequestTemplate,
      context: buildRequestData({
        lastname,
        subject: title,
        heading,
        request,
        isExactMatch: profile.isExactMatch,
        service,
        webOrigin,
      }),
      notificationContext: {
        lastname,
        requestId: request.id,
        service: request.service,
      },
      logContext: { request: request.id },
      categories: ['new_request_email'],
    })
  }
}

// PPC
function emailNewContact({profile, lastname, request, meet}) {
  const autoAccept = meet.proResponseStatus === 'autoAccept'
  const path = `/pros/${autoAccept ? 'waiting' : 'contacts'}/${meet.id}`
  const url = webOrigin + path
  const title = `🆕【ご指名】${lastname}様から${request.service.name}の指名が来ています`

  const heading = `${lastname}様に指名されています！`

  contact({
    id: 'emailNewContact',
    notificationType: 'newContact',
    profile,
    subject: title,
    url,
    template: newContactTemplate,
    context: {
      ...buildRequestData({
        lastname,
        subject: title,
        heading,
        request,
        service: meet.service,
        webOrigin,
      }),
      meet_id: meet._id,
    },
    notificationContext: {
      lastname,
      meetId: meet.id,
      service: request.service,
      path,
    },
    logContext: { request: request.id, meet: meet._id },
    categories: ['new_contact_email'],
  })
}

function emailLowBudget({user, proService}) {

  const url = `${webOrigin}/account/services/${proService.service.id}/budgets`
  const title = `${proService.service.name}の予算が少なくなりました`
  const trackPath = 'emailLowBudget'
  if (!dontSendLine(user, 'lowBudget')) {
    pushMessage({
      lineId: user.lineId,
      text: title,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('lowBudget', user, {proService})

  if (dontSendEmail(user, 'lowBudget')) return

  send({
    address: user.email,
    title,
    html: '',
    trackPath,
    substitutions: {
      title,
      profileName: proService.profile.name,
      serviceName: proService.service.name,
      url,
    },
  })
}

function emailUpdateRequest({ users, lastname, request, meet }) {
  if (users.length === 0) return

  const toMeet = !!meet

  const url = toMeet ? `${webOrigin}/pros/talking/${meet.id}` : `${webOrigin}/pros/requests/${request.id}`
  const title = `${!toMeet && request.point === 0 ? '応募無料：' : ''}${lastname}様の依頼が更新されました`

  const requestInfoHTML = buildRequestHTML(request)
  const requestInfoText = buildRequestText(request)

  users.forEach(user => {
    const type = toMeet ? 'emailUpdateRequestForMeet' : 'emailUpdateRequest'
    const trackPath = type
    if (!dontSendLine(user, 'updateRequest')) {
      pushMessage({
        lineId: user.lineId,
        text: `${lastname}様の依頼が更新されました！`,
        contents: url,
        template: trackPath,
        userId: user._id.toString(),
      })
    }

    if (dontSendEmail(user, 'updateRequest')) return

    send({
      address: user.email,
      title,
      html: '',
      trackPath,
      substitutions: {
        title,
        lastname: user.lastname,
        customerName: lastname,
        requestInfoHTML,
        requestInfoText,
        url,
      },
      log: {
        request: request && request.id,
        meet: meet && meet.id,
      },
    })
  })
}

function emailMeetRead({ meet }) {
  const user = meet.pro
  const url = `${webOrigin}/pros/waiting/${meet.id}`
  const trackPath = 'emailMeetRead'
  if (!dontSendLine(user, 'meetRead')) {
    pushMessage({
      lineId: user.lineId,
      text: `${meet.customer.lastname}様があなたの応募を閲覧しています！チャットで話しかけてみませんか？`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user, 'meetRead')) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      customer: meet.customer.lastname,
      meetId: meet.id,
    },
    log: {
      meet: meet.id,
    },
  })
}

function emailWorkStart({ user, lastname, meetId }) {
  const url = `${webOrigin}/pros/hired/${meetId}`
  const trackPath = 'emailWorkStart'
  if (!dontSendLine(user, 'workStart')) {
    const additionalMessage = { type: 'sticker', packageId: '2', stickerId: '516', unshift: true }
    pushMessage({
      lineId: user.lineId,
      text: '案件が決定しました！おめでとうございます！',
      contents: url,
      additional: additionalMessage,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('workStart', user.id, {meetId, customerName: lastname})

  if (dontSendEmail(user, 'workStart')) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      customerName: lastname,
      url,
    },
    log: {
      meet: meetId,
    },
  })
}

function emailMeetRevert({ meet }) {
  const user = meet.pro
  const url = `${webOrigin}/pros/talking/${meet.id}`
  const trackPath = 'emailMeetRevert'
  if (!dontSendLine(user, 'meetRevert')) {
    pushMessage({
      lineId: user.lineId,
      text: `${meet.customer.lastname}様が、案件を「決定」から「交渉中」に戻しました。メッセージを送って状況を確認しましょう。`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user, 'meetRevert')) return
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      customerName: meet.customer.lastname,
      url,
    },
  })
}

function emailReviewDone({ user, lastname, meetId, profileId }) {
  const url = `${webOrigin}/account/reviews/${profileId}`
  const trackPath = 'emailReviewDone'
  if (!dontSendLine(user, 'reviewDone')) {
    pushMessage({
      lineId: user.lineId,
      text: `${lastname}様があなたのクチコミを投稿しました！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('reviewDone', user.id, {lastname, profileId, meetId})

  if (dontSendEmail(user, 'reviewDone')) return

  const title = 'クチコミが投稿されました'
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      title,
      lastname: user.lastname,
      customerName: lastname,
      url,
    },
    log: {
      meet: meetId,
    },
  })
}

function emailReviewAppend({ user, lastname, meetId, profileId }) {
  const url = `${webOrigin}/account/reviews/${profileId}`
  const trackPath = 'emailReviewAppend'

  // notification は reviewDone と共通
  if (!dontSendLine(user, 'reviewDone')) {
    pushMessage({
      lineId: user.lineId,
      text: `${lastname}様があなたのクチコミに追記しました！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('reviewAppend', user.id, {lastname, profileId, meetId})

  if (dontSendEmail(user, 'reviewDone')) return

  const title = 'クチコミが追記されました'
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      title,
      lastname: user.lastname,
      customerName: lastname,
      url,
    },
    log: {
      meet: meetId,
    },
  })
}

function emailReplyReview({ user, profile, meet }) {
  const path = meet ? `/requests/${meet.request}/responses/${meet.id}` :`/p/${profile.shortId}`
  const url = webOrigin + path
  const trackPath = 'emailReplyReview'
  if (!dontSendLine(user, 'reviewReply')) {
    pushMessage({
      lineId: user.lineId,
      text: 'あなたのクチコミにプロから返事が来ました！',
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }
  // meetはある時とない時がある
  addNotice('reviewReply', user.id, {path, meetId: meet && meet.id, profileId: profile.id, profileName: profile.name})

  if (dontSendEmail(user, 'reviewReply')) return

  const title = 'クチコミに返事がきました！'
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      title,
      lastname: user.lastname,
      url,
    },
    log: {
      meet: meet && meet.id,
    },
  })
}

async function emailDailyRemind({ user, requests, meets, hired, schedules }) {
  const url = `${webOrigin}/pros`
  const taskCount = requests.length + meets.length + hired.length + schedules.length
  const trackPath = 'emailDailyRemind'

  if (!dontSendLine(user, 'dailyRemind')) {
    // contents: not more than 10
    const contents = []
    if (requests.length > 0) {
      contents.push({
        type: 'bubble',
        body: {
          spacing: 'md',
          layout: 'vertical',
          type: 'box',
          contents: [{
            wrap: true,
            type: 'text',
            weight: 'bold',
            text: 'ご指名に返信する',
          }, {
            wrap: true,
            type: 'text',
            text: '未対応のご指名依頼があります！すぐに確認して返信しましょう。',
          }, {
            type: 'button',
            style: 'link',
            action: { type: 'uri', label: '確認する', uri: `${url}/requests` },
          }],
        },
      })
    }
    if (meets.length > 0 || hired.length > 0) {
      contents.push({
        type: 'bubble',
        body: {
          spacing: 'md',
          layout: 'vertical',
          type: 'box',
          contents: [{
            wrap: true,
            type: 'text',
            weight: 'bold',
            text: 'メッセージに返信する',
          }, {
            wrap: true,
            type: 'text',
            text: '未読のチャットメッセージがあります！すぐに確認して返信しましょう。',
          }, {
            type: 'button',
            style: 'link',
            action: { type: 'uri', label: '確認する', uri: meets.length > 0 ? `${url}/talking` : `${url}/hired`},
          }],
        },
      })
    }
    if (schedules.length > 0) {
      contents.push({
        type: 'bubble',
        body: {
          spacing: 'md',
          layout: 'vertical',
          type: 'box',
          contents: [{
            wrap: true,
            type: 'text',
            weight: 'bold',
            text: 'スケジュールを確認する',
          }, {
            wrap: true,
            type: 'text',
            text: '未返答のスケジュール予約依頼があります！内容を確認して、承諾か辞退を選びましょう。',
          }, {
            type: 'button',
            style: 'link',
            action: {type: 'uri', label: '確認する', uri: `${url}/schedules/booking`},
          }],
        },
      })
    }

    const options = {
      type: 'flex',
      altText: '本日のやることリストを消化しましょう！',
      contents: {
        type: 'carousel',
        contents,
      },
    }

    const text = `【本日のやることリスト】
${taskCount}人の依頼者が${user.lastname}様の返信を待っています`

    if (contents.length) {
      pushMessage({
        lineId: user.lineId,
        text,
        additional: options,
        template: trackPath,
        userId: user._id.toString(),
      })
    }
  }

  if (dontSendEmail(user, 'dailyRemind')) return

  const title = `【本日のやることリスト】${taskCount}人の依頼者が${user.lastname}様の返信を待っています`

  /* eslint-disable no-irregular-whitespace */
  const messageHTML = `<div><div>返信が必要なものが${taskCount}件あります。<div><br />${requests.length > 0 ? `<div>・<a href="${url}/requests">${requests.length}件の未返信のご指名</a></div><div>　すぐに確認して返信しましょう。</div></br>` : ''}${meets.length > 0 ? `<div>・<a href="${url}/talking">${meets.length}件の未読メッセージ</a></div><div>　すぐに確認して返信しましょう。</div></br>` : ''}${hired.length > 0 ? `<div>・<a href="${url}/hired">${hired.length}件の未読メッセージ（成約案件）</a></div><div>　すぐに確認して返信しましょう。</div><div>　仕事が完了したら「クチコミを依頼」ボタンを押しましょう。</div></br>` : ''}${schedules.length > 0 ? `<div>・<a href="${url}/schedules/booking">${schedules.length}件のスケジュール予約</a></div><div>　予約を確認して、承諾か辞退を選びましょう。</div>` : ''}</div>`

  const messageText = `
未返信のご指名: ${requests.length}件
未読メッセージ: ${meets.length + hired.length}件
スケジュール予約: ${schedules.length}件

ダッシュボードから確認しましょう ${url}`
  /* eslint-enable no-irregular-whitespace */

  send({
    address: user.email,
    title,
    html: '',
    trackPath,
    substitutions: {
      title,
      lastname: user.lastname,
      messageHTML,
      messageText,
    },
  })
}

function emailBookingRequest({user, meet, schedule}) {
  const url = `${webOrigin}/pros/schedules/${schedule.id}/edit`
  const trackPath = 'emailBookingRequest'

  const myInfo = schedule.info.owner.toString() === user.id

  const infomation = {
    phone: {
      type: '電話相談',
      infoType: myInfo ? '受ける電話番号' : '相手の電話番号',
      info: myInfo ? '指定してください' : schedule.info.phone,
    },
    consulting: {
      type: '対面相談',
      infoType: myInfo ? '来てもらう場所' : '相手の指定場所',
      info: myInfo ? '指定してください' : schedule.info.address,
    },
    job: {
      type: '仕事日程',
      infoType: myInfo ? '来てもらう場所' : '相手の指定場所',
      info: myInfo ? '指定してください' : schedule.info.address,
    },
  }[schedule.type]

  if (!dontSendLine(user, 'bookingRequest')) {
    pushMessage({
      lineId: user.lineId,
      text: `${infomation.type}の予約のリクエストが届いています！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('bookingRequest', user.id, {schedule, infomation})

  if (dontSendEmail(user, 'bookingRequest')) return

  const time = moment(schedule.startTime).format('M/D(dddd) H:mm')
  const title = `【SMOOOSY】${infomation.type}の予約：確認して返答しましょう`

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      title,
      message: `${infomation.type}の予約のリクエストがきています。確認して承諾または辞退しましょう。`,
      button: '予約に返答する',
      serviceName: meet.service.name,
      opponent: meet.customer.lastname,
      time: `${time} - ${moment(schedule.endTime).format('H:mm')}`,
      infoType: infomation.infoType,
      info: infomation.info,
      url,
    },
    log: {
      meet: meet.id,
    },
  })
}

function emailRemindMeetsPro({ user, request, notExcluded, meetId, meets}) {
  const url = `${webOrigin}/pros/talking/${meetId}`
  const trackPath = 'emailRemindMeetsPro'

  if (!dontSendLine(user, 'remindMeetsPro')) {
    pushMessage({
      lineId: user.lineId,
      text: `${request.customer.lastname}様は応募した${meets.length}人のプロから、候補を${notExcluded.length}人に絞っています。

再度メッセージを送って案件を獲得しましょう！`,
      contents: [{type: 'uri', label: 'チャットを開く', uri: url}],
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user, 'remindMeetsPro')) return

  const title = `${request.customer.lastname}様にもう一度メッセージを送りましょう`
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      title,
      lastname: user.lastname,
      customerName: request.customer.lastname,
      notExcludedCount: notExcluded.length,
      meetsCount: meets.length,
      url,
    },
    log: {
      meet: meetId,
      request: request.id,
    },
  })
}

function emailRemindProfile({ user }) {
  if (dontSendEmail(user)) return

  const url = `${webOrigin}/account/profiles/${user.profiles[0]._id}`
  const title = 'プロフィールが未完成です'

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailRemindProfile',
    substitutions: {
      title,
      lastname: user.lastname,
      url,
    },
  })
}

function emailDeleteRequestPro({user, customer, type}) {
  if (dontSendEmail(user)) return

  const message = type === 'patrol' ?
    `この度は${customer.lastname}様の案件にご応募いただき、誠にありがとうございます。
本案件は不適切な依頼である可能性が高いと判断されたため、弊社カスタマーサポート担当により削除されました。（${user.lastname}様が応募時にご利用になったポイントは、削除に伴い返還させていただきました）

この度は応募のお手間をおかけしてしまい大変申し訳ございませんでした。引き続きご愛顧のほどどうぞよろしくお願いいたします。

※削除の対象となる依頼には、事業者の方が間違えて出してしまった依頼、連絡先や名前などが真正でないと思われる依頼などがあります。

SMOOOSY運営事務局` :
    `この度は${customer.lastname}様の案件にご応募いただき、誠にありがとうございます。
本案件は、新しく重複する依頼が出されたために削除されました。
${user.lastname}様が応募時にご利用になったポイントは、削除に伴い返還させていただきました。

お手数をおかけし大変申し訳ございませんが、新しい依頼が届きましたら、そちらに再度ご応募いただければ幸いです。
※依頼条件の変更によっては届かないこともございますが、ご容赦くださいませ。

引き続きSMOOOSYのご愛顧のほどどうぞよろしくお願いいたします。

SMOOOSY運営事務局`

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailDeleteRequestPro',
    substitutions: {
      title: '【SMOOOSY】依頼削除のお知らせ',
      lastname: user.lastname,
      message,
    },
  })
}

function emailReportInsights({user, stat, hourToMeet, averageRating, reviewCount}) {
  const month = moment().subtract(1, 'month').format('M')
  const title = `${month}月のご利用状況をおしらせします`
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailReportInsights',
    substitutions: {
      title,
      lastname: user.lastname,
      month,
      hiredPrice: stat.hiredPriceLastMonth.toLocaleString(),
      rate: `約${Math.floor(1000/stat.returnOnInvestmentLastMonth) / 10}`,
      meetsCount: stat.meetsCountLastMonth.toLocaleString(),
      hourToMeet: Math.floor(hourToMeet * 10) / 10,
      averageRating: Math.floor(averageRating * 100) / 100,
      reviewCount,
      url: `${webOrigin}/pros/requests`,
    },
  })
}

// ポイント

function emailPointGet({user, price, point, type, method, service, customer}) {
  const typeStr = type === 'bought' ? '購入' :
                  type === 'autoCharge' ? 'オートチャージ' :
                  type === 'refund' ? '返還' :
                  type === 'refundStarterPoint' ? '返還' : '獲得'

  const methodStr = {
    creditcard: '（クレジットカード決済）',
    netbank: '（銀行決済）',
    conveni: '（コンビニ決済）',
  }[method] || ''

  const url = `${webOrigin}/account/points`
  const trackPath = 'emailPointGet'

  if (!dontSendLine(user, 'pointGet')) {
    const preStr = type === 'refund' ? `${customer.lastname}様の依頼に対する` :
                   type === 'refundStarterPoint' ? 'まずは10回キャンペーンの' : ''
    pushMessage({
      lineId: user.lineId,
      text: `${preStr}ポイントを${typeStr}しました${methodStr}`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user, 'pointGet')) return

  const title = `【SMOOOSY】ポイントの${typeStr}${methodStr}`

  const message = type === 'bought' ?
    `${price.toLocaleString()}円で${point}ptを購入しました${methodStr}。`
    : type === 'autoCharge' ?
    `${price.toLocaleString()}円で${point}ptをオートチャージしました${methodStr}。`
    : type === 'refund' ?
    `${customer.lastname}様の${service.name}の依頼に対する応募が閲覧されなかった、または依頼が削除されたため、${point}ptを返還しました。`
    : type === 'refundStarterPoint' ?
    `まずは10回キャンペーンのポイント${point}ptを返還しました。`
    :
    `${point}ptを獲得しました。`
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      title,
      message,
    },
  })
}

function emailPointWillExpire({user, expiredAt, point}) {
  const expire = moment(expiredAt)

  const url = `${webOrigin}/account/points`
  const title = `【SMOOOSY】${expire.format('M月末')}に失効するポイントがあります`
  const trackPath = 'emailPointWillExpire'

  if (user.lineId) {
    pushMessage({
      lineId: user.lineId,
      text: `${expire.format('M月末')}に失効するポイントがあります`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      title,
      message: `${expire.format('M月末')}に${point}ptが失効します。失効前にポイントを利用しましょう。`,
    },
  })
}

function emailPointBack({key, user, income, outgo, earned}) {
  const month = moment(key).format('YYYY年MM月')
  const trackPath = 'emailPointBackInsights'

  if (user.lineId) {
    pushMessage({
      lineId: user.lineId,
      text: `${month}の還元ポイントのお知らせ\n${income.bought}ptの購入ポイントご利用で、${earned}ptが還元されました`,
      contents: [{type: 'uri', label: '利用状況を確認する', uri: webOrigin + '/account/points/history'}],
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    subject: `【ポイント還元】${month}の還元ポイントのお知らせ`,
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      earned: '' + earned,
      month,
      rate: '' + (pointBackRate.calc(outgo.bought) * 100),
      outgo: '' + (outgo.limited + outgo.bought),
      outgoBought: '' + outgo.bought,
      outgoLimited: '' + outgo.limited,
      // more: '' + pointBackRate.toGetMore(outgo.bought),
      // income: '' + (income.bought + income.limited),
      // incomeBought: '' + income.bought,
      // incomeLimited: '' + income.limited,
    },
  })
}

// ユーザー用

function emailCreateRequest({user, request}) {
  const url = `${webOrigin}/requests/${request.id}`
  const trackPath = 'emailCreateRequest'

  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: 'ご依頼ありがとうございます。プロからの見積もりがメールやLINEに届きます。見逃さないようにしましょう！',
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      url,
    },
    log: {
      request: request.id,
    },
  })
}

const getSortedPassReason = (passed) => {
  const reasons = {}
  passed = passed.filter((p) => p.reason && !['場所が遠い', 'ポイントが高い'].includes(p.reason))
  for (const p of passed) {
    reasons[p.reason] = reasons[p.reason] ? reasons[p.reason] + 1 : 1
  }
  return Object.keys(reasons)
    .sort((a, b) => reasons[b] - reasons[a])
}

function emailManyPass({user, request}) {
  if (dontSendEmail(user)) return

  const reasons = getSortedPassReason(request.passed)

  // パス理由がない場合は送らない
  if (!reasons.length) return

  let message = ''
  message += '見積もりしない理由\n'
  message += reasons.map(r => `・${r}`).join('\n')

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailManyPass',
    substitutions: {
      lastname: user.lastname,
      serviceName: request.service.name,
      sentCount: request.sent.length + request.meets.length + 3,
      providerName: request.service.providerName,
      message,
    },
    log: {
      request: request.id,
    },
  })
}

function emailNoMeet({user, request}) {
  if (dontSendEmail(user)) return

  const reasons = getSortedPassReason(request.passed)
  let message = ''
  if (reasons.length) {
    message += '担当できなかった理由は以下の通りです。\n'
    message += reasons.map(r => `・${r}`).join('\n')
  }

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailNoMeet',
    substitutions: {
      lastname: user.lastname,
      serviceName: request.service.name,
      sentCount: request.sent.length,
      providerName: request.service.providerName,
      // empty message is shown as `undefined`
      message: message || ' ',
    },
    log: {
      request: request.id,
    },
  })
}

async function emailNewMeet({ user, proName, requestId, meetId }) {
  const url = `${webOrigin}/requests/${requestId}/responses/${meetId}`
  const trackPath = 'emailNewMeet'

  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: `${proName}様から見積もりが届いています！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  addNotice('newMeet', user.id, {proName, requestId, meetId})

  if (dontSendEmail(user)) return

  const titles = {
    control: `【SMOOOSY】${proName}様から見積りが届いています！`,
    prefix_new_request: `【新規見積り】${proName}様から見積りが届いています！`,
    prefix_to_be_confirmed: `【要確認】${proName}様から見積りが届いています！`,
  }
  const bucket = await getExperimentBucket('api_email_new_meet', user.id)
  const title = titles[bucket || 'control']

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      proName,
      url,
      title,
    },
    log: {
      request: requestId,
      meet: meetId,
    },
  })
}

function emailRemindMeets({ user, request, notExcluded, days }) {
  const url = `${webOrigin}/requests/${request.id}`
  const trackPath = 'emailRemindMeets'

  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: `「${request.service.name}」の依頼に${notExcluded.length}人の${request.service.providerName}が見積もりしています！`,
      contents: [
        {type: 'uri', label: '見積もりを確認する', uri: url},
        {type: 'uri', label: 'すでに雇っている', uri: url + '/edit'},
        {type: 'uri', label: '依頼を中止する', uri: url + '/edit'},
      ],
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  const picSize = notExcluded.length === 5 ? 50 : notExcluded.length === 4 ? 56 : 64
  const picMargin = notExcluded.length === 5 ? 4 : notExcluded.length === 4 ? 6 : 8

  const proImages = notExcluded.map(meet => {
    const src = `${meet.pro.image}&w=${picSize}&h=${picSize}`
    const color = avatarColors[parseInt(meet.pro.id, 16) % avatarColors.length]
    const padding = meet.pro.imageUpdatedAt ? '' : 'padding:2px;'
    const style = `width:${picSize}px;height:${picSize};margin:${picMargin}px;${padding}border-radius:50%;background-color:${color};`
    return `<img src="${src}" style="${style}" />`
  }).join('')
  addNotice('remindMeets', user.id, {request, days})

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailRemindMeets',
    substitutions: {
      lastname: user.lastname,
      proCount: notExcluded.length,
      serviceName: request.service.name,
      providerName: request.service.providerName,
      proImages,
      url,
      editUrl: url + '/edit',
    },
    log: {
      request: request.id,
    },
  })
}


function emailConfirmHired({ meet }) {
  const user = meet.customer

  const url = `${webOrigin}/requests/${meet.request.id}/responses/${meet.id}`
  const trackPath = 'emailConfirmHired'

  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: `${meet.profile.name}様が、あなたの依頼を担当すると設定しました。このプロを雇いましたか？`,
      contents: [
        {type: 'uri', label: 'はい', uri: url},
        {type: 'uri', label: 'まだです', uri: url + '?status=waiting'},
      ],
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      proName: meet.profile.name,
      url,
    },
    log: {
      request: meet.request.id,
      meet: meet.id,
    },
  })
}

/**
 * @function emailMeetEnd
 * @param {Object} user user model of customer
 * @param {string} proName profile name
 * @param {Object} request request model
 * @param {Object} meet meet model
 */
function emailMeetEnd({ user, proName, request, meet }) {
  const { renderReviewRequest } = require('../ssr/renderParts')
  const url = `${webOrigin}/requests/${request.id}/responses/${meet.id}`
  const trackPath = 'emailMeetEnd'
  const html = renderReviewRequest({profile: meet.profile, pro: meet.pro, text: '', url})

  addNotice('meetEnd', user.id, {proName, requestId: request.id, meetId: meet.id})

  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: `${proName}様の満足度はいかがでしたか？`,
      contents: [
        {type: 'uri', label: 'クチコミを書く', uri: url},
      ],
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      proName,
      url,
      html,
    },
    log: {
      request: request.id,
      meet: meet.id,
    },
  })
}

function emailDeleteRequest({user, serviceName}) {
  const url = `${webOrigin}/requests`
  const trackPath = 'emailDeleteRequest'

  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: '依頼を削除しました',
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      title: '【SMOOOSY】依頼を削除いたしました',
      lastname: user.lastname,
      message: `この度は${serviceName}のご依頼をいただき、誠にありがとうございます。
せっかくいただきましたご依頼ですが、運営側の判断により削除をさせていただきました。
お手数をおかけいたしますが、どうぞよろしくお願いいたします。

※削除の対象となる依頼には、似た内容で複数回出されている依頼、事業者の方が間違えて出してしまった依頼、連絡先や名前などが真正でないと思われる依頼などがあります。

SMOOOSY運営事務局`,
    },
  })
}


// lead
function emailNewRequestForLead({ users, request, categoryKey }) {
  if (users.length === 0) return

  // fix
  const requestInfoHTML = buildRequestHTML(request, true)
  const requestInfoText = buildRequestText(request, true)

  users.forEach(user => {
    const obj = {requestId: request.id, email: user.email, name: user.name}
    const hash = Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
    const url = `${webOrigin}/new-requests/${hash}`

    send({
      address: user.email,
      title: '',
      html: '',
      trackPath: 'emailNewRequestForLead',
      substitutions: {
        name: user.name,
        address: request.address,
        serviceName: request.service.name,
        requestInfoHTML,
        requestInfoText,
        request: request.id,
        url,
      },
      log: {
        request: request.id,
      },
      utm_term: [moment().format('YYYYMMDD'), categoryKey].join('_'),
    })
  })
}

function emailNewRequestForLeadText({ users, request, categoryKey }) {
  if (users.length === 0) return

  const requestInfo = buildRequestText(request)

  users.forEach(user => {
    const obj = {requestId: request.id, email: user.email, name: user.name}
    const hash = Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
    const url = `${webOrigin}/new-requests/${hash}`
    send({
      address: user.email,
      title: '',
      html: '',
      trackPath: 'emailNewRequestForLeadText',
      substitutions: {
        name: user.name,
        address: request.address,
        serviceName: request.service.name,
        requestInfo,
        request: request.id,
        url,
      },
      log: {
        request: request.id,
      },
      utm_term: [moment().format('YYYYMMDD'), categoryKey].join('_'),
    })
  })
}

// 両方

function emailNewChat({ user, fromUser, toPro, meet, chat }) {
  const opponent = toPro ? fromUser.lastname : meet.profile.name

  const url = toPro
    ? `${webOrigin}/pros/${meet.status === 'waiting' ? 'talking' : 'hired'}/${meet.id}`
    : `${webOrigin}/requests/${meet.request}/responses/${meet.id}`
  const trackPath = meet.status === 'waiting' ? 'emailNewChatForWaiting' : 'emailNewChat'

  if (!dontSendLine(user, 'newChat')) {
    pushMessage({
      lineId: user.lineId,
      text: `${opponent}様からメッセージが届いています！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  // チャットが送られたユーザに通知する
  addNotice('newChat', user.id, { toPro, opponent, meet })

  if (dontSendEmail(user, 'newChat')) return

  const editUrl = toPro
    ? `${webOrigin}/pros/talking/${meet.id}?modal=status`
    : `${webOrigin}/requests/${meet.request}/edit`
  const editMessage = toPro ? `${opponent}様と成約しましたか？` : '既に成約済みですか？'

  const readImg = `<img src="${webOrigin}/api/chats/${chat.id}/read.gif" />`

  if (meet.status === 'waiting') {
    send({
      address: user.email,
      title: '',
      html: '',
      trackPath,
      substitutions: {
        opponent,
        url,
        chat: `${chat.text}${readImg}`,
        editMessage,
        editUrl,
      },
      log: {
        meet: meet.id,
      },
    })
  } else {
    send({
      address: user.email,
      title: '',
      html: '',
      trackPath,
      substitutions: {
        opponent,
        url,
        chat: `${chat.text}${readImg}`,
      },
      log: {
        meet: meet.id,
      },
    })
  }
}

function emailBookingUpdate({user, meet, schedule}) {
  const url = user.id === meet.pro.id
    ? `${webOrigin}/pros/schedules/${schedule.id}/edit`
    : `${webOrigin}/requests/${meet.request}/responses/${meet.id}`
  const trackPath = 'emailBookingUpdate'

  const status = {
    accept: '承諾',
    decline: '辞退',
    cancel: 'キャンセル',
  }[schedule.status]

  const myInfo = schedule.info.owner.toString() === user.id

  const infomation = {
    phone: {
      type: '電話相談',
      infoType: myInfo ? '受ける電話番号' : '相手の電話番号',
      info: schedule.info.phone || '-',
    },
    consulting: {
      type: '対面相談',
      infoType: myInfo ? '来てもらう場所' : '相手の指定場所',
      info: schedule.info.address || '-',
    },
    job: {
      type: '仕事日程',
      infoType: myInfo ? '来てもらう場所' : '相手の指定場所',
      info: schedule.info.address || '-',
    },
  }[schedule.type]

  const start = moment(schedule.startTime).format('M/D(dddd) H:mm')
  const title = `【SMOOOSY】${status}：${start} の${infomation.type}`

  if (!dontSendLine(user, 'bookingUpdate')) {
    pushMessage({
      lineId: user.lineId,
      text: `${infomation.type}の予約が${status}されました！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user, 'bookingUpdate')) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      title,
      message: `${infomation.type}の予約が${status}されました。`,
      button: '相手と連絡を取る',
      serviceName: meet.service.name,
      opponent: user.id === meet.pro.id ? meet.customer.lastname : meet.profile.name,
      time: `${start} - ${moment(schedule.endTime).format('H:mm')}`,
      infoType: infomation.infoType,
      info: infomation.info,
      url,
    },
    log: {
      meet: meet.id,
    },
  })
}

function emailBookingRemind({user, meet, schedule}) {
  const url = user.id === meet.pro.id
    ? `${webOrigin}/pros/schedules/${schedule.id}/edit`
    : `${webOrigin}/requests/${meet.request}/responses/${meet.id}`
  const trackPath = 'emailBookingRemind'

  const myInfo = schedule.info.owner.toString() === user.id

  const infomation = {
    phone: {
      type: '電話相談',
      infoType: myInfo ? '受ける電話番号' : '相手の電話番号',
      info: schedule.info.phone,
    },
    consulting: {
      type: '対面相談',
      infoType: myInfo ? '来てもらう場所' : '相手の指定場所',
      info: schedule.info.address,
    },
    job: {
      type: '仕事日程',
      infoType: myInfo ? '来てもらう場所' : '相手の指定場所',
      info: schedule.info.address,
    },
  }[schedule.type]

  const start = moment(schedule.startTime).format('M/D(dddd) H:mm')
  const title = `【SMOOOSY】リマインド：${start} の${infomation.type}`

  if (!dontSendLine(user, 'bookingRemind')) {
    pushMessage({
      lineId: user.lineId,
      text: `【リマインド】明日は${infomation.type}の予約があります！`,
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  if (dontSendEmail(user, 'bookingRemind')) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      lastname: user.lastname,
      title,
      message: `明日は${infomation.type}の予約が入っていますのでリマインドいたします。`,
      button: '予約を確認する',
      serviceName: meet.service.name,
      opponent: user.id === meet.pro.id ? meet.customer.lastname : meet.profile.name,
      time: `${start} - ${moment(schedule.endTime).format('H:mm')}`,
      infoType: infomation.infoType,
      info: infomation.info,
      url,
    },
    log: {
      meet: meet.id,
    },
  })
}

// adminからのメール

function emailResetPassword(user) {
  if (dontSendEmail(user)) return
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailResetPassword',
    substitutions: {
      lastname: user.lastname,
      token: user.token,
    },
  })
}

function emailChangeEmail(user) {
  const url = `${webOrigin}/account/info`
  const trackPath = 'emailChangeEmail'
  if (!dontSendLine(user)) {
    pushMessage({
      lineId: user.lineId,
      text: '新しいメールアドレスが設定されました',
      contents: url,
      template: trackPath,
      userId: user._id.toString(),
    })
  }

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath,
    substitutions: {
      title: '【SMOOOSY】新しいメールアドレスが設定されました',
      lastname: user.lastname,
      message: `いつもSMOOOSYをご利用いただき、ありがとうございます。
この度、お客様のアカウントのメールアドレスが変更されました。
次回以降、このメールアドレスにメールが送信されます。`,
    },
  })
}

function emailReviewRequest(emails, profile, html) {

  for (const email of emails) {
    send({
      address: email,
      title: '',
      html,
      trackPath: 'emailReviewRequest',
      substitutions: {
        profileName: profile.name,
        profileShortId: profile.shortId,
      },
    })
  }
}

function emailOnBoarding(from, email, profile, admin, subject, html, baseTemplate) {
  send({
    from,
    address: email,
    subject,
    html,
    trackPath: baseTemplate,
    substitutions: {
      profileName: profile.name,
      profileShortId: profile.shortId,
      userFirstName: profile.pro.firstname,
      userLastName: profile.pro.lastname,
      adminLastName: admin.lastname,
    },
  })
}

function emailAdminEditProfile({user, profile, reason}) {
  if (dontSendEmail(user)) return

  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailAdminEditProfile',
    substitutions: {
      lastname: user.lastname,
      profileName: profile.name,
      editReason: reason.map(r => `・${r}`).join('\n'),
    },
  })
}

function emailAdminSuspendProfile({user, profile, suspend}) {
  if (dontSendEmail(user)) return
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailAdminSuspendProfile',
    substitutions: {
      lastname: user.lastname,
      profileName: profile.name,
      suspendReason: suspend.map(r => `・${r}`).join('\n'),
    },
  })
}

function emailIdentificationValid({user}) {
  if (dontSendEmail(user)) return

  addNotice('identificationValid', user.id, {})
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailIdentificationValid',
    substitutions: {
      lastname: user.lastname,
    },
  })
}

function emailIdentificationInvalid({user, reason}) {
  if (dontSendEmail(user)) return

  const reasonString = idInvalidReason[reason] || reason
  if (!reasonString) return

  addNotice('identificationInvalid', user.id, {})
  send({
    address: user.email,
    title: '',
    html: '',
    trackPath: 'emailIdentificationInvalid',
    substitutions: {
      lastname: user.lastname,
      reason: reasonString,
    },
  })
}


/**************************************************************
 * メール送信
 **************************************************************/

function send({from, address, title, subject, html, trackPath, substitutions, utm_term, log = {}, isPrerendered, categories = []}: any) {
  const tracking_settings = {
    ganalytics: {
      enable: true,
      utm_source: 'email',
      utm_medium: trackPath,
      utm_term: utm_term || '',
    },
  }

  const params: any = {
    id: trackPath,
    to: address,
    title,
    subject,
    html,
    substitutions: {
      ...substitutions,
      origin: webOrigin,
    },
    tracking_settings,
    categories,
  }
  if (from) {
    params.from = from
  }

  let sendPromise

  if (isPrerendered) {
    sendPromise = sendgrid.get().sendPrerendered(params)
  } else if (trackPath in sendGridUuid) {
    sendPromise = sendgrid.get().send(params)
  } else {
    return
  }

  return sendPromise.then(ps => {
    const targets = ps.personalizations.map(p => ({to: p.to, _id: p.custom_args.mailLogId}))
    delete substitutions.requestInfo
    const htmlId = uuid.v4()
    const data = { id: htmlId, html: ps.html, timestamp: new Date() }
    if (bigquery.validate(data, bigquery_maillog)) {
      bigquery
            .insert(config.get('bigquery.dataset'), config.get('bigquery.table_maillog'), [data])
            .catch((e) => {
              console.log(e)
            })
    }

    return MailLog.insertMany(targets.map(t => ({ ...log, _id: t._id, template: params.id, address: t.to, subject: ps.subject, html: htmlId })))
  }).catch((err) => {
    const to = Array.isArray(params.to) ? `${params.to.length}人の送信先` : params.to
    console.log(`SendGridエラー ${params.id} ${to}`, err)
    slack({
      message: `SendGridエラー ${params.id} ${to} ${err.message}`,
      room: 'ops',
    })
  })
}

/*
 * 手っ取り早くABテストを行うためにgetActiveExperimentsForUserをちょっと無理やり使ってます。
 * 今後やる場合は設計し直してください。。。
 */
async function getExperimentBucket(name, userId) {
  const req = {
    userData: {
      ...dummyUser(),
      instance_id: userId,
      platform: platform.parse('api_node'),
    },
    get: () => '',
  }
  let experiments
  const res = {json: (exp) => experiments = exp}
  await getActiveExperimentsForUser(req, res)
  return (experiments.find(e => e.name === name) || {}).bucket
}
