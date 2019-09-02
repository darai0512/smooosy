const sm = require('sitemap')
const fs = require('fs')
const moment = require('moment')
const config = require('config')
const axios = require('axios')
const { webOrigin, wpOrigin } = require('@meetsmore/config')

const { Category, Service, LocationService, Profile, FormattedRequest } = require('../models')

async function main() {
  console.log('Start...')

  const sitemaps = ['main']
  let urls = [
    '/',
    '/pro',
    '/pro-media',
    '/sections/event',
    '/sections/lesson',
    '/sections/business',
    '/sections/lifestyle',
    '/signup',
    '/login',
    '/company',
    '/policies/terms',
    '/policies/privacy',
  ]
  generate({
    type: 'main',
    urls,
  })

  let [categories, services, locationServices, profiles, formattedRequests] = await Promise.all([
    Category.find().select('key name wpId'),
    Service.find({
      enabled: true,
      deleted: {$ne: true},
    })
    .select('key tags wpId category')
    .populate({
      path: 'category',
      select: 'key',
    }),
    LocationService.find({count: {$gt: 0}}).populate('service'),
    Profile.find({
      suspend: {$exists: false},
      deactivate: {$ne: true},
      hideProfile: {$ne: true},
      createdAt: {$gt: moment().subtract({month: 1}).toDate()},
      description: /^[\s\S]{1,}$/, // description.length > 0
    }).populate({
      path: 'pro',
    }),
    FormattedRequest.find({public: true}).populate('service'),
  ])
  // 主要カテゴリ以外でプロ数が少ないページはnoindexにするのでsitemapから除外する
  const showLPCategory = await Category.find({key: {$in: config.showLocationLPs}}).select('name')
  const showLPCategoryTags = showLPCategory.map(slc => slc.name)
  locationServices = locationServices.filter(ls => ls.service.enabled && (ls.count > 1 || showLPCategoryTags.includes(ls.service.tags[0])))

  // プロカテページ
  urls = categories.map(cat => `${webOrigin}/pro/${cat.key}`)
  generate({
    type: 'pro',
    urls,
    changefreq: 'monthly',
    priority: 0.7,
  })
  sitemaps.push('pro')

  // サービスページ
  urls = [
    ...services.map(s => `${webOrigin}/services/${s.key}`),
    ...locationServices.map(l => `${webOrigin}/services/${l.service.key}/${l.keyPath.split(',').join('/')}`),
  ]
  const PER_PAGE = 50000 // 50000以上は読み込まないので分割
  const page = Math.ceil(urls.length / PER_PAGE)
  for (let i = 1; i <= page; i++) {
    generate({
      type: `service-${i}`,
      urls: urls.slice(PER_PAGE * (i - 1), PER_PAGE * i - 1),
      changefreq: 'daily',
      priority: 0.9,
    })
    sitemaps.push(`service-${i}`)
  }

  // 最近登録したプロフィールページ
  urls = profiles.filter(p => p.pro.imageUpdatedAt).map(p => `${webOrigin}/p/${p.shortId}`)
  generate({
    type: 'profile',
    urls,
    changefreq: 'weekly',
    priority: 0.7,
  })
  sitemaps.push('profile')

  // 依頼例ページ
  urls = formattedRequests.map(r => `${webOrigin}/services/${r.service.key}/requests/${r.id}`)
  generate({
    type: 'request',
    urls,
    changefreq: 'monthly',
    priority: 0.4,
  })
  sitemaps.push('request')

  // カテゴリページ
  urls = []
  for (let cat of categories) {
    const ids = services.filter(s => s.tags.indexOf(cat.name) !== -1).map(s => s.id)
    if (ids.length === 0) continue

    const proCount = await Profile.count({
      services: {$in: ids},
      description: {$exists: true},
      deactivate: {$exists: false},
      hideProfile: {$ne: true},
      suspend: {$exists: false},
    })
    if (proCount === 1) continue

    urls.push(`${webOrigin}/t/${cat.key}`)

    const locationList = []
    for (const ls of locationServices) {
      if (ls.service.tags[0] !== cat.name) continue

      const uniqueKey = `${cat.key}_${ls.keyPath}`
      if (locationList.includes(uniqueKey)) continue

      urls.push(`${webOrigin}/t/${cat.key}/${ls.keyPath.split(',').join('/')}`)
      locationList.push(uniqueKey)
    }
  }
  generate({
    type: 'category',
    urls,
    changefreq: 'daily',
    priority: 0.8,
  })
  sitemaps.push('category')

  let wpPosts = []
  let posts = []
  let pageIdx = 0
  do {
    try {
      posts = await axios.get(`${wpOrigin}/wp-json/custom/v1/post_urls?per_page=500&page=${pageIdx}`).then(res => res.data)
      wpPosts = wpPosts.concat(posts)
    } catch (e) {
      console.log(e)
      break
    }
    pageIdx++
  } while (posts.length > 0)

  let urlSets = new Set()
  let catUrlSets = new Set()
  // サービスメディアページ
  const mediaServices = services.filter(s => s.wpId)
  for (let mediaService of mediaServices) {
    const posts = wpPosts.filter(wp => wp.category === mediaService.wpId)
    if (posts.length) {
      if (mediaService.category && mediaService.category.key) {
        catUrlSets.add(`${webOrigin}/t/${mediaService.category.key}/media`)
      }
      urlSets.add(`${webOrigin}/services/${mediaService.key}/media`)
    }
    for (let post of posts) {
      const articleType = post.marusen ? 'pickups' : 'media'
      urlSets.add(`${webOrigin}/services/${mediaService.key}/${articleType}/${post.id}`)
    }
  }
  urls = Array.from(urlSets)
  generate({
    type: 'service-media',
    urls,
    changefreq: 'weekly',
    priority: 0.9,
  })
  sitemaps.push('service-media')

  // カテゴリメディアページ
  const mediaCategories = categories.filter(c => c.wpId)
  for (let mediaCategory of mediaCategories) {
    const posts = wpPosts.filter(wp => wp.category === mediaCategory.wpId)
    if (posts.length) {
      catUrlSets.add(`${webOrigin}/t/${mediaCategory.key}/media`)
    }
    for (let post of posts) {
      const articleType = post.marusen ? 'pickups' : 'media'
      catUrlSets.add(`${webOrigin}/t/${mediaCategory.key}/${articleType}/${post.id}`)
    }
  }
  urls = Array.from(catUrlSets)
  generate({
    type: 'category-media',
    urls,
    changefreq: 'weekly',
    priority: 0.9,
  })
  sitemaps.push('category-media')

  generateIndex(sitemaps)
}

function generate({type, urls, changefreq, priority}) {
  const sitemap = sm.createSitemap({
    hostname: webOrigin,
    urls: urls.map(url => ({
      url,
      changefreq,
      priority,
    })),
  })
  fs.writeFileSync(`${config.get('sitemap.path')}/sitemap-${type}.xml`, sitemap.toString())
}

function generateIndex(types) {
  const index = sm.buildSitemapIndex({
    urls: types.map(type => `${webOrigin}/sitemap-${type}.xml`),
    xmlNs: 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  })
  fs.writeFileSync(`${config.get('sitemap.path')}/sitemap.xml`, index)
}

import mongoosePromise from '../lib/mongo'
mongoosePromise.then(mongoose => {
  main()
    .then(() => mongoose.disconnect())
    .catch(e => {
      console.error(e)
      mongoose.disconnect()
    })
})
