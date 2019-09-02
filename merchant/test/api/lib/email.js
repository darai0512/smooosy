const test = require('ava')
const sinon = require('sinon')
const { dontSendEmail, dontSendLine, emailNewRequest } = require('../../../src/api/lib/email')
const { generateCandidateLocations, postProcess } = require('../helpers/testutil')
const { User } = require('../../../src/api/models')
const sendgrid = require('../../../src/api/lib/sendgrid')
const { SgMailStub } = require('../helpers/sgmail-stub')
const mongoose = require('mongoose')

const { notificationTypes } = require('@smooosy/config')

const notifications = Object.keys(notificationTypes)

test('send email to default user', t => {
  const user = new User({
    email: 'test1@smooosy.com',
  })

  t.falsy(dontSendEmail(user))
  for (let type of notifications) {
    t.falsy(dontSendEmail(user, type))
  }
})

test('dont send line to default user', t => {
  const user = new User()

  t.truthy(dontSendLine(user))
  for (let type of notifications) {
    t.truthy(dontSendLine(user, type))
  }
})

test('send line to user who has lineId', t => {
  const user = new User({
    lineId: 'lineId',
  })

  t.falsy(dontSendLine(user))
  for (let type of notifications) {
    t.falsy(dontSendLine(user, type))
  }

})

test('dont send to deactivated user', t => {
  const user = new User({
    lineId: 'lineId',
    deactivate: true,
  })

  t.truthy(dontSendEmail(user))
  t.truthy(dontSendLine(user))
})

test('dont send to bounced user', t => {
  const user = new User({
    lineId: 'lineId',
    bounce: true,
  })

  t.truthy(dontSendEmail(user))
  for (let type of notifications) {
    t.truthy(dontSendEmail(user, type))
  }
})

test('dont send to opt-out user', t => {
  const notification = {}
  for (let type of notifications) {
    notification[type] = { email: false, line: false }
  }
  const user = new User({
    lineId: 'lineId',
    notification,
  })

  for (let type of notifications) {
    t.truthy(dontSendEmail(user, type))
    t.truthy(dontSendLine(user, type))
  }
})

test('sendPrerendered', async t => {
  await generateCandidateLocations(t)

  const mailClient = new sendgrid.MailClient({
    mailClient: new SgMailStub(),
    apiKey: 'apiKey',
    templates: {},
    clientIsStubbed: true,
  })

  const unset = sendgrid.set(mailClient)

  const users = [new User({
    email: 'eugene.yaroslavtsev@smooosy.com',
  }), new User({
    email: 'wayne@smooosy.com',
  }),
  ]

  let called = 0

  sinon.stub(mailClient, 'sendPrerendered').callsFake(async ({id, to, html}) => {
    ++called
    t.is(id, 'emailNewRequest')
    t.assert(to === users[0].email || to === users[1].email)

    // city included
    t.true(html.includes('港区'))

    // question answers included
    t.true(html.includes('chosen option'))
    t.true(html.includes('not chosen option'))

    return Promise.resolve({
      personalizations: [],
      html,
    })
  })

  await emailNewRequest({
    profiles: users.map(user => ({
      pro: user,
    })),
    lastname: '山田',
    request: {
      id: mongoose.Types.ObjectId(),
      city: '港区',
      point: 5,
      loc: t.context.targetLocations.tokyo.loc,
      service: { name: 'photographer', useNewRequestEmail: true },
      description: [{
        label: 'foo',
        type: 'multiple',
        answers: [{
          text: 'chosen option',
          checked: true,
        }, {
          text: 'not chosen option',
          checked: false,
        }],
      }],
    },
    service: {
      name: 'photographer',
      providerName: 'photographer',
    },
  })

  t.is(called, 2, 'sendPrerendered should have been called twice')

  unset()
  await postProcess()
})
