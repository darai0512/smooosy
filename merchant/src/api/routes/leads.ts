export {}
const config = require('config')
const moment = require('moment')
const axios = require('axios')
const { timeNumbers, prefectures } = require('@smooosy/config')
const { Lead, User, Profile, Request, Scraping, Location, Townpage, Category } = require('../models')
const { emailNewRequestForLead, emailNewRequestForLeadText } = require('../lib/email')
const { fixEmail, regexpEscaper } = require('../lib/util')
const { itownActions } = require('../lib/scraping')
const { isEmail } = require('@smooosy/config')

module.exports = {
  info,
  index,
  show,
  create,
  update,
  remove,
  send,
  indexGarbledName,
  indexDuplicates,
  scrapingItownpage,
  scrapingStatus,
  indexScrapingLog,
  indexTownpageInfo,
  inquiry,
  formEmail,
  // functions
  saveLeadsEach,
}

async function info(req, res) {
  const [unchecked, bounce, normal] = await Promise.all([
    Lead.count({checked: {$ne: true}}),
    Lead.count({bounce: true}),
    Lead.count({bounce: false}),
  ])

  res.json({
    unchecked,
    bounce,
    normal,
  })
}

async function index(req, res) {
  const cond: any = {}
  if (req.query.cansend) {
    cond.email = {
      $exists: true,
    }
    cond.registered = {
      $ne: true,
    }
    cond.checked = true
    cond.bounce = false
  }
  if (req.query.date) {
    cond.date = {
      $gte: new Date(req.query.date),
    }
  }
  if (req.query.createdAt) {
    cond.createdAt = {
      $gte: new Date(req.query.createdAt),
    }
  }
  if (req.query.source) {
    cond.source = new RegExp(regexpEscaper(req.query.source))
  }
  if (req.query.address) {
    cond.address = new RegExp(req.query.address.filter(a => a).map(ad => regexpEscaper(ad)).join('|'))
  }
  if (req.query.industry) {
    cond.industry = {
      $in: req.query.industry.split(/\s*,\s*/).filter(e => e),
    }
  }
  if (req.query.services) {
    cond.services = {
      $in: req.query.services,
    }
  }
  if (req.query.email) {
    cond.email = new RegExp(regexpEscaper(req.query.email).split(/[\s\u3000]+/).filter(t => t).join('|'), 'i')
  }
  if (req.query.phone) {
    cond.phone = {
      $in: req.query.phone.split(/,\s*/).filter(e => e),
    }
  }
  if (req.query.name) {
    cond.name = new RegExp(regexpEscaper(req.query.name))
  }
  if (req.query.posted) cond.posted = true
  if (req.query.notPosted) cond.posted = false
  if (req.query.postFailed) cond.postFailed = req.query.postFailed
  if (req.query.formUrl) {
    cond.formUrl = {
      $exists: true,
      $nin: [null, ''],
    }
  }
  const leads = await Lead.find(cond).select('name email address industry phone fax date bounce registered formUrl posted category').lean()
  res.json(leads)
}

async function indexGarbledName(req, res) {
  const leads = await Lead.find({name: /[\xe0-\xef\x80-\x9f]/}).lean().limit(10000)
  res.json(leads)
}

async function indexDuplicates(req, res) {
  const type = req.params.type
  let duplicates
  if (type === 'name') {
    duplicates = await Lead.aggregate()
      .match({
        name: { $exists: true },
        notDuplicate: { $ne: true },
      })
      .project({
        name: { $concat: [ '$name', { $substrCP: ['$address', 0, 3] }] },
        address: true,
        email: true,
      })
      .group({
        _id: '$name',
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      })
      .match({
        count: { $gt: 1 },
      })
      .limit(100)
  } else if (type === 'domain') {
    duplicates = await Lead.aggregate()
      .match({
        email: { $exists: true },
        notDuplicate: { $ne: true },
      })
      .project({
        domain: { $arrayElemAt: [{ $split: [ '$email', '@' ] }, 1] },
      })
      .group({
        _id: '$domain',
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      })
      .match({
        count: { $gt: 1, $lt: 5 },
      })
      .limit(100)
  } else if (type === 'local') {
    duplicates = await Lead.aggregate()
      .match({
        email: { $exists: true },
        notDuplicate: { $ne: true },
      })
      .project({
        local: { $arrayElemAt: [{ $split: [ '$email', '@' ] }, 0] },
      })
      .group({
        _id: '$local',
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      })
      .match({
        count: { $gt: 1, $lt: 5 },
      })
      .limit(100)
  }

  const duplicatedLeads = await Promise.all(duplicates.map(async dup => {
    const leads = await Lead.find({_id: {$in: dup.ids}}).lean()
    dup.leads = leads
    dup.key = dup._id,
    delete dup.ids
    return dup
  }))

  res.json(duplicatedLeads)
}

async function show(req, res) {
  const lead = await Lead.findById(req.params.id).lean()
  if (!lead) return res.status(404).json({message: 'not found'})
  res.json(lead)
}

async function create(req, res) {
  const data = req.body.data
  if (data.phone) {
    data.phone = data.phone.replace(/\-/g, '')
  }

  const insertCount = await saveLeadsEach({data})

  res.json({insertCount})
}

async function update(req, res) {
  if (Array.isArray(req.body)) {
    const newLeads = req.body
    for (const newLead of newLeads) {
      if (newLead.phone) {
        newLead.phone = newLead.phone.replace(/\-/g, '')
      }
      await Lead.findByIdAndUpdate(newLead._id, {$set: newLead})
    }
  } else {
    if (req.body.phone) {
      req.body.phone = req.body.phone.replace(/\-/g, '')
    }
    await Lead.findByIdAndUpdate(req.body._id, {$set: req.body})
  }
  res.json()
}

async function remove(req, res) {
  const lead = await Lead.findByIdAndRemove(req.params.id)
  if (lead === null) return res.status(404).json({message: 'not found'})

  res.json()
}

async function send(req, res) {
  const request = await Request.findOne({
    _id: req.params.id,
    status: 'open',
    createdAt: {$gt: moment().subtract(timeNumbers.requestExpireHour, 'hours').toDate() },
  }).populate('service')
  if (request === null) return res.status(404).json({message: 'not found'})

  const leads = await Lead.find({_id: {$in: req.body.leads}})

  let categoryKey = ''
  if (request.service.tags && request.service.tags[0]) {
    const sub = await Category.findOne({name: request.service.tags[0]})
    if (sub) {
      categoryKey = sub.key
    }
  }


  if (req.body.mailType === 'text') {
    emailNewRequestForLeadText({
      users: leads,
      request,
      categoryKey,
    })
  } else {
    emailNewRequestForLead({
      users: leads,
      request,
      categoryKey,
    })
  }
  res.json({})
}

async function scrapingItownpage(req, res) {
  const base = 'https://itp.ne.jp'
  const tail = '?num=50'
  const requests = []

  // actionCreator内の関数をtoString()
  const actionCreator = itownActions
  const keys = Object.keys(actionCreator)
  for (const key of keys) {
    actionCreator[key] = actionCreator[key].toString()
  }

  // requestsは { data{ urls: 'スクレイピングするurlの配列', ...others }, target: 'スクレイピング対象' } の配列
  for (const b of req.body) {
    const { category, subCategory, prefecture } = b
    const urls = []
    const pref = prefectures[prefecture]
    const cities = await Location.find({ parentName: prefecture }).select('code')
    const townpage = await Townpage.findOne({ category, subCategory })

    for (const city of cities) {
      const url = `${base}/${pref}/${city.code}${townpage.path}/${tail}`
      urls.push(url)
    }
    requests.push({ data: { category, subCategory, prefecture, urls, actionCreator }, target: 'townpage' })
  }

  const response = await axios.post(config.get('scrapingOrigin'), requests)
  res.json(response.data)
}

async function scrapingStatus(req, res) {
  const count = await axios.get(`${config.get('scrapingOrigin')}/status`).then(res => res.data.count)
  res.json(count)
}

async function indexScrapingLog(req, res) {
  const logs = await Scraping.find()
  res.json(logs)
}

async function indexTownpageInfo(req, res) {
  const townpage = await Townpage.find()
  res.json(townpage)
}

async function inquiry(req, res) {
  const responses = []
  for (const b of req.body) {
    const response = await axios.post(`${config.get('scrapingOrigin')}/inquiry`, {data: b.inquiryData, url: b.url})
      .then(res => res.data)
      .catch(() => ({success: false}))
    await Lead.findOneAndUpdate(
      { _id: b.id },
      { posted: true, postFailed: !response.success },
      { runValidators: true }
    )
    responses.push(response)
  }
  res.json(responses)
}

async function formEmail(req, res) {
  const lead = await Lead.findById(req.params.id).select('url services formUrl email bounce').lean()
  if (!lead) return res.status(404).json({message: 'not found'})
  if (lead.url) {
    const result = await axios.post(`${config.get('scrapingOrigin')}/formEmail`, lead).then(res => res.data)
    Object.keys(result).forEach(k => lead[k] = result[k])
    await saveLeadsEach({data: [lead]})
  }
  res.send('finish')
}

async function saveLeadsEach({data = [], date = new Date()}) {
  const emails = await User.distinct('email')

  const counters = {
    insertCount: 0,
    phone: 0,
    email: 0,
    formUrl: 0,
    url: 0,
  }
  for (const row of data) {
    if (row.email) {
      row.email = fixEmail(row.email)
      if (!isEmail(row.email)) delete row.email
    }
    if (!row.phone && !row.email && !row.url && !row.formUrl) continue
    if (row.phone) row.phone = row.phone.replace(/\-/g, '')
    if (emails.includes(row.email)) continue

    const m = (row.address || '').match(/^.{2,3}?[都道府県]/)
    const prefecture = m ? m[0] : ''
    const pro = await Profile.countDocuments({name: row.name, prefecture})
    if (pro) continue

    if (!row.date) {
      row.date = date
    }
    row.createdAt = row.updatedAt = new Date()
    if (Array.isArray(row.industry)) {
      row.industry = row.industry.filter(e => e)
    } else {
      row.industry = (row.industry || '').split(/[,、，]\s*/).filter(e => e)
    }

    if (Array.isArray(row.services)) {
      row.services = row.services.filter(e => e)
    } else {
      row.services = (row.services || '').split(/[,、，]\s*/).filter(e => e)
    }

    const cond: any = {}
    if (row._id) {
      cond._id = row._id
    } else if (row.email) {
      cond.email = row.email
    } else if (row.phone) {
      cond.phone = row.phone
    } else if (row.url) {
      cond.url = row.url
    } else if (row.formUrl) {
      cond.formUrl = row.formUrl
    }

    const lead = await Lead.findOne(cond) || new Lead()

    let willSave = false
    for (const key in row) {
      if (Array.isArray(lead[key])) {
        willSave = true
        lead[key] = [...lead[key].filter(v => v).map(s => s.toString()), ...row[key].map(s => s.toString())]
        lead[key] = Array.from(new Set(lead[key]))
      } else if (!lead[key] && row[key]) {
        willSave = true
        lead[key] = row[key]
        if (key === 'email') {
          counters.email++
        } else if (key === 'phone') {
          counters.phone++
        } else if (key === 'formUrl') {
          counters.formUrl++
        } else if (key === 'url') {
          counters.url++
        }
      }
    }
    if (willSave) {
      await lead.save()
      counters.insertCount++
    }
  }

  return counters
}
