const test = require('ava')
const sendgrid = require('../../../src/api/lib/sendgrid')
const { sendgridWebhook } = require('../../../src/api/routes/users')
const { send } = require('../../../src/api/lib/email')
const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')
const { SgMailStub, SgApiStub } = require('../helpers/sgmail-stub')
const { MailLog } = require('../../../src/api/models')


const templateMap = {
  'foo': 'bar',
  'bar': 'baz',
  'emailReviewRequest': 'emailReviewRequest',
}

const sgTemplateMap = {
  'bar': {
    subject: '#title#',
    html_content: 'Hello #name#',
  },
  emailReviewRequest: {
    subject: '#title#',
    html_content: 'Hello #profileName#',
    plain_content: 'Hello #profileName#',
  },
}

test('client send should fail whenout apiClient', t => {
  const client = new sendgrid.MailClient({
    mailClient: new SgMailStub(),
    apiKey: 'apiKey',
    templates: templateMap,
  })

  const err = t.throws(client.request)

  t.true(err.message.includes('apiClient'))
})

test('client send should fail when sending invalid template ID', async t => {
  const client = new sendgrid.MailClient({
    mailClient: new SgMailStub(),
    apiKey: 'apiKey',
    templates: templateMap,
  })

  await t.throwsAsync(async () => {
    await client.send({
      id: 'meh', // not in templateMap
      to: 'c@d.com',
    })
  }, {message: /meh/})
})

test('client send should fail when sendgrid fails', async t => {
  const client = new sendgrid.MailClient({
    mailClient: new SgMailStub(),
    apiClient: new SgApiStub(sgTemplateMap),
    apiKey: 'apiKey',
    templates: templateMap,
  })

  await t.throwsAsync(async () => {
    await client.send({
      id: 'bar', // in template map, but not in SgMailStub
      to: 'c@d.com',
      substitutions: {title: 'test mail', name: 'Wayne'},
    })
  }, {message: new RegExp(templateMap.foo)})
})

test.skip('client send should succeed when sendgrid client succeeds', async t => {
  const client = new sendgrid.MailClient({
    mailClient: new SgMailStub(), // pass in a template map so SgMailStub.send succeeds
    apiClient: new SgApiStub(sgTemplateMap),
    apiKey: 'apiKey',
    templates: templateMap,
  })

  const result = await client.send({
    id: 'foo', // in template map AND SgMailStub
    to: 'c@d.com',
    substitutions: { title: 'test email', name: 'Wayne' },
  })

  t.is(result.subject, 'test email')
  t.is(result.html, 'Hello Wayne')
})

test('メール送信後にMailLogが保存される', async t => {
  await generateServiceUserProfile(t)
  sendgrid.set(new sendgrid.MailClient({
    mailClient: new SgMailStub(), // pass in a template map so SgMailStub.send succeeds
    apiClient: new SgApiStub(sgTemplateMap),
    apiKey: 'apiKey',
    templates: templateMap,
  }))

  await send({
    address: 'test@test.com',
    title: '',
    trackPath: 'emailReviewRequest',
    substitutions: {
      profileName: null,
      profileShortId: null,
    },
  })

  const log = await MailLog.findOne({address: 'test@test.com'})

  t.is(!!log, true)
  await postProcess()
})

test('SendGridからのwebhookでMailLogが更新される', async t => {
  await generateServiceUserProfile(t)
  const log = await MailLog.create({address: 'test@test.mail.com'})

  // bounceでmaillog更新
  const req = {
    body: [{event: 'bounce', mailLogId: log.id, email: 'test@test.mail.com'}],
  }
  await sendgridWebhook(req, {json: () => {}})
  let newLog = await MailLog.findById(log.id)
  t.is(newLog.bounce, true)
  t.is(!!newLog.bouncedAt, true)

  // openでmaillog更新
  req.body[0].event = 'open'
  await sendgridWebhook(req, {json: () => {}})
  newLog = await MailLog.findById(log.id)
  t.is(newLog.open, true)
  t.is(!!newLog.openedAt, true)

  // clickでmaillog更新
  req.body[0].event = 'click'
  await sendgridWebhook(req, {json: () => {}})
  newLog = await MailLog.findById(log.id)
  t.is(newLog.click, true)
  t.is(!!newLog.clickedAt, true)

  await postProcess()
})