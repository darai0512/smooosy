export {}
const test = require('ava')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const { Chat, Meet, Request } = require('../../../src/api/models')
const { generateServiceUserProfile, generateRequest, generateMeet, postProcess } = require('../helpers/testutil')
const { MeetStatusType } = require('@smooosy/config')


test.beforeEach(generateServiceUserProfile)
test.after.always(async () => {
  await postProcess()
})

test('チャット・依頼の更新でmeetが更新される', async t => {
  // 依頼作成・強制マッチ・応募作成
  const { pro, profile, service, user } = t.context
  let req: any = {
    customer: user.id,
    service: service.id,
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': '依頼その1',
        },
      ],
    }],
    interview: [],
  }
  await generateRequest(t, req)
  let r = t.context.request
  req = {
    params: {
      requestId: r.id,
    },
    body: {
      profile: profile.id,
      price: 10000,
      priceType: 'fixed',
      chat: 'よろしくお願いします！',
      files: [],
    },
    user: pro,
  }
  await generateMeet(t, req)


  let { meet } = t.context
  meet = await Meet.findById(meet.id).populate('request')
  t.is(MeetStatusType.getMeetStatus(meet), MeetStatusType.UNREAD)

  // 最初のチャットを既読にする
  const chat = await Chat.findById(meet.chats[0])
  chat.read = true
  await chat.save()

  // 依頼をsuspend
  r = await Request.findById(r.id)

  await supertest(server)
    .put(`/api/requests/${r.id}`)
    .set('Authorization', `Bearer ${t.context.user.token}`)
    .send({status: 'suspend'})
    .expect(200)

  meet = await Meet.findById(meet.id).populate('request')
  t.is(MeetStatusType.getMeetStatus(meet), 'canceled')

  // 運営削除
  await supertest(server)
    .put(`/api/admin/requests/${r.id}`)
    .set('Authorization', `Bearer ${t.context.adminUser.token}`)
    .send({deleted: true})
    .expect(200)
  meet = await Meet.findById(meet.id).populate('request')
  t.is(MeetStatusType.getMeetStatus(meet), 'deleted')
})
