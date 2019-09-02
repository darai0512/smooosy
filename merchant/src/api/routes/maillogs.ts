export {}
const moment = require('moment')
const config = require('config')
const { Lead, MailLog } = require('../models')
const bigquery = require('../lib/bigquery')

module.exports = {
  indexForAdmin,
  indexByRequestForAdmin,
  indexByProForAdmin,
  showMailLogForAdmin,
}

async function indexForAdmin(req, res) {
  if (!req.query.ago || !req.query.templateName) return res.json([])
  const mailLogs = await MailLog.find({
    template: new RegExp(req.query.templateName),
    createdAt: {$gt: moment().subtract(Number(req.query.ago), 'day').toDate()},
  })
  .select('address')
  res.json(mailLogs)
}

async function indexByRequestForAdmin(req, res) {
  const mailLogs = await MailLog.find({
    template: /^emailNewRequestForLead/,
    request: req.params.id,
  })
  .select('address subject open click html createdAt')
  .then(logs =>
    Promise.all(logs.map(log => {
      return Lead.findOne({email: log.address})
        .select('name phone')
        .then(lead => ({...log.toObject(), name: lead && lead.name, phone: lead && lead.phone, leadId: lead && lead._id}))
    }))
  )
  res.json(mailLogs)
}

async function indexByProForAdmin(req, res) {
  const mailLogs = await MailLog.find({
    address: req.params.address,
  })
  .select('address subject open click html createdAt')
  .sort({ createdAt: -1 })
  .limit(40)
  res.json(mailLogs)
}

async function showMailLogForAdmin(req, res) {
  const htmls = await bigquery.query(
    `SELECT * FROM ${config.get('bigquery.dataset')}.${config.get('bigquery.table_maillog')} WHERE id=@id`,
    {id: req.params.id})

  res.json(htmls)
}