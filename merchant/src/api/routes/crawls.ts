export {}
const axios = require('axios')
const url = require('url')
const config = require('config')

const { Crawl } = require('../models')
const { saveLeadsEach } = require('./leads')
const { splitSteps } = require('../lib/util')

module.exports = {
  index,
  create,
  show,
  update,
  updateMany,
  remove,
  saveAsLead,
  execute,
  pause,
  restart,
  status,
  reset,
  // misc
  inject,
}

const PER_PAGE = 50
async function index(req, res) {
  const page = parseInt(req.query.page || 1, 10) || 1
  const offset = PER_PAGE * (page - 1)

  const total = await Crawl.countDocuments()
  const crawls = await Crawl.find().sort('-createdAt').select('name status').limit(PER_PAGE).skip(offset)
  res.json({total, crawls})
}

async function create(req, res) {
  if (!req.body.inputUrls || req.body.inputUrls.length !== 1) {
    await Crawl.create({
      ...req.body,
      status: 'draft',
    })
    return res.send()
  }
  const pagingRegExp = /{{(\d+):(\d+):(\d+)}}/
  const m = req.body.inputUrls[0].match(pagingRegExp)
  if (!m) {
    await Crawl.create({
      ...req.body,
      status: 'draft',
    })
    return res.send()
  }

  const start = parseInt(m[1], 10)
  const end = parseInt(m[2], 10)
  const step = parseInt(m[3], 10)

  const steps = splitSteps({start, end, step})

  const crawlBase = {
    ...req.body,
    status: 'draft',
  }

  const crawls = steps.map(({start, end, step}) => {
    const newCrawl = new Crawl(crawlBase)
    newCrawl.inputUrls = req.body.inputUrls.map(url => url.replace(pagingRegExp, `{{${start}:${end}:${step}}}`))
    newCrawl.name = req.body.name + `（${start}〜${end}）`
    return newCrawl
  })

  for (const crawl of crawls) {
    await crawl.save()
  }

  res.send(crawls)
}

async function show(req, res) {
  const crawl = await Crawl.findOne({_id: req.params.id})
    .populate({
      path: 'services',
      select: 'id',
    })
  if (crawl === null) return res.status(404).json({message: 'not found'})

  res.json(crawl)
}

async function update(req, res) {
  let crawl = await Crawl.findOne({_id: req.params.id})
  if (crawl === null) return res.status(404).json({message: 'not found'})

  crawl = await Crawl.findByIdAndUpdate(crawl.id, {$set: req.body})
  res.json(crawl)
}

async function updateMany(req, res) {
  await Crawl.updateMany({_id: req.body.ids}, req.body.cond)
  res.send()
}

async function remove(req, res) {
  await Crawl.findByIdAndRemove({_id: req.params.id})
  index(req, res)
}

async function saveAsLead(req, res) {
  const crawls = await Crawl.find({_id: req.body.ids, status: 'done'})
  if (!crawls.length) return res.status(404).json({message: 'not found'})

  for (const crawl of crawls) {
    const data = crawl.result.map(r => {
      r.services = r.services || []
      r.services.push(...crawl.services)
      return r
    })
    const counters = await saveLeadsEach({data, date: new Date(crawl.executedAt)})
    crawl.counters = counters
    crawl.status = 'inserted'
    await crawl.save()
  }
  res.send()
}

async function execute(req, res) {
  const { baseUrl, actions } = req.body

  const response = await axios.post(`${config.get('scrapingOrigin')}/execute`, {
    actions: [
      { type: 'goto', url: baseUrl },
      ...actions,
    ],
  })
  .then(res => res.data)
  res.json(response)
}

async function pause(req, res) {
  await axios.put(`${config.get('scrapingOrigin')}/pause`)
  await status(req, res)
}

async function restart(req, res) {
  await axios.put(`${config.get('scrapingOrigin')}/restart`)
  await status(req, res)
}

async function status(req, res) {
  const status = await axios.get(`${config.get('scrapingOrigin')}/status`).then(res => res.data)
  res.json({pause: status.pause, running: status.running})
}

async function reset(req, res) {
  await axios.put(`${config.get('scrapingOrigin')}/pause`)
  await Crawl.update({status: 'progress'}, {$set: {status: 'error'}})
  await axios.put(`${config.get('scrapingOrigin')}/reset`)
  await status(req, res)
}

async function inject(req, res) {
  if (!/tools/.test(req.get('Referrer'))) {
    return res.status(404).json({message: 'not found'})
  }
  const u = url.parse(req.query.url)
  const origin = u.protocol + '//' + u.host

  let html
  try {
    html = await axios.get(req.query.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36' },
    }).then(res => res.data)
  } catch (e) {
    return res.send(e.response.data)
  }

  const injectHTML = `
<style>
.smooosy-hover {
  outline: 3px solid #1180cc;
  position: absolute;
  z-index: 99999;
  pointer-events: none;
  cursor: pointer;
}
.smooosy-hover-green {
  outline-color: #8fc320;
}
.smooosy-hover-dashed {
  z-index: 99998;
  outline: 2px dashed #666;
}
.smooosy-fix {
  background: rgba(17, 128, 204, .2);
}
.smooosy-foreach {
  background: rgba(17, 128, 204, .1);
  outline: 1px solid #1180cc;
}
</style>
<script src='/inject.js'></script>
  `
  html = html
    .replace(/<script[^>]+?\/>|<script(.|\s)*?\/script>/gi, '')
    .replace(/(src|href)=(['"])\/([^\/])/g, (_, m1, m2, m3) => `${m1}=${m2}${origin}/${m3}`)
    .replace('</body>', `${injectHTML}</body>`)

  res.send(html)
}
