export {}
const axios = require('axios')
const cheerio = require('cheerio')
const uuidv4 = require('uuid')
const qs = require('qs')
const validator = require('validator')
const config = require('config')
const { wpOrigin, prefectures } = require('@smooosy/config')
const { Category, Service, ProfileIntroduction, LocationService } = require('../models')
import { BASE_FIELDS } from './services'
const { shortIdToMongoId } = require('../lib/mongoid')
const { CloudFront } = require('../lib/aws')
const { getPriceEstimate } = require('../lib/pricing/estimates/queries')
const { safeTraverse } = require('../lib/util')

module.exports = {
  articleTop,
  proArticleTop,
  articleAuthorPage,
  serviceArticleList,
  categoryArticleList,
  serviceArticlePage,
  categoryArticlePage,
  proArticlePage,
  previewArticlePage,
  clearArticleCache,
  fetchArticleData,
  fetchRecommendArticleList,
  // export for tests
  replaceHtmlToModule,
  isWPLoggedIn,
}

async function articleTop(req, res) {
  const { page, per_page } = req.query

  let [categories, wpCategories, populars, { articles, total }] = await Promise.all([
    Service.find({enabled: true, deleted: {$ne: true}}).select('tags')
      .then(async services => {
        const categories = await Category.find({name: {$in: services.map(s => s.tags[0])}})
          .select('key name priority')
          .sort('-priority')
        return categories
      }),
    fetchCategoryList(),
    fetchPopularArticleList(),
    fetchPostList({type: 'customer', page, per_page}),
  ])

  articles = articles.map(a => ({...a, url: '/' + a.url.split(/^https:\/\/(.*?)\//)[2]}))

  res.json({
    categories,
    wpCategories,
    populars,
    articles,
    total,
  })
}

async function proArticleTop(req, res) {
  const { page, per_page } = req.query
  let [{ articles, total }] = await Promise.all([
    fetchPostList({type: 'pro', page, per_page}),
  ])

  articles = articles.map(a => ({...a, url: '/' + a.url.split(/^https:\/\/(.*?)\//)[2]}))

  res.json({
    articles,
    total,
  })
}

async function articleAuthorPage(req, res) {
  const { id } = req.params
  const { page, per_page } = req.query

  let [wpCategories, author, { articles, total } ] = await Promise.all([
    fetchCategoryList(),
    axios.get(`${wpOrigin}/wp-json/custom/v1/authors/${id}`).then(res => res.data),
    fetchPostList({type: 'customer', author: id, page, per_page}),
  ])
  if (articles.length === 0) return res.status(404).send({message: 'not found'})

  articles = articles.map(a => ({...a, url: '/' + a.url.split(/^https:\/\/(.*?)\//)[2]}))

  res.json({
    wpCategories,
    author,
    articles,
    total,
  })
}

async function serviceArticleList(req, res) {
  const { key } = req.params
  const { page, per_page } = req.query

  const [ categories, wpCategories, populars, service ] = await Promise.all([
    Service.find({enabled: true, deleted: {$ne: true}}).select('tags')
      .then(async services => {
        const categories = await Category.find({name: {$in: services.map(s => s.tags[0])}})
          .select('key name priority')
          .sort('-priority')
        return categories
      }),
    fetchCategoryList(),
    fetchPopularArticleList(),
    Service.findOne({key})
      .select('key name tags wpId providerName category mediaListPageDescription imageUpdatedAt')
      .populate({
        path: 'category',
        select: 'key name',
      }),
  ])
  if (!service) return res.status(404).send({message: 'not found'})

  const relatedServices = await Service.find({tags: {$in: service.tags[0]}, enabled: true }).select('key name')

  let { articles, total } = await axios
    .get(`${wpOrigin}/wp-json/custom/v1/posts?type=customer&category=${service.wpId}&page=${page}&per_page=${per_page}`)
    .then(res => ({articles: res.data, total: parseInt(res.headers['x-wp-total'], 10)}))

  articles = articles.map(a => ({...a, url: '/' + a.url.split(/^https:\/\/(.*?)\//)[2]}))

  res.json({
    categories,
    service,
    wpCategories,
    populars,
    articles,
    total,
    relatedServices,
  })
}

async function categoryArticleList(req, res) {
  const { key } = req.params
  const { type, page, per_page } = req.query

  let [ categories, wpCategories, populars, category ] = await Promise.all([
    Service.find({enabled: true, deleted: {$ne: true}}).select('tags')
      .then(async services => {
        const categories = await Category.find({name: {$in: services.map(s => s.tags[0])}})
          .select('key name')
        return categories
      }),
    fetchCategoryList(),
    fetchPopularArticleList(),
    Category.findOne({key})
      .select('key name wpId providerName category mediaListPageDescription imageUpdatedAt'),
  ])
  if (!category) return res.status(404).send({message: 'not found'})

  const relatedServices = await Service.find({tags: {$in: category.name}, enabled: true}).select('key name')

  let { articles, total } = await fetchPostList({type, category: category.wpId, page, per_page})

  const services = wpCategories.find(c => c._id.equals(category._id)).services
  category = category.toObject()
  category.image = (services[0] || {}).image
  articles = articles.map(a => ({...a, url: '/' + a.url.split(/^https:\/\/(.*?)\//)[2]}))


  res.json({
    categories,
    category,
    wpCategories,
    populars,
    articles,
    total,
    relatedServices,
  })
}

async function serviceArticlePage(req, res) {
  const articleId = req.params.id
  if (!articleId) return res.status(404).send({message: 'not found'})

  // サービス取得
  const service = await Service.findOne({key: req.params.key})
    .select([...BASE_FIELDS, 'wpId', 'matchMoreEnabled'].join(' '))
    .populate({
      path: 'similarServices',
      select: 'key name matchMoreEnabled',
      match: { enabled: true },
    })
    .populate({
      path: 'recommendServices',
      select: 'key name matchMoreEnabled',
      match: { enabled: true },
    })
  if (!service) return res.status(404).send({message: 'not found'})

  // カテゴリ取得
  const category = await Category.findOne({name: service.tags[0]}).select('key name')
  if (!category) return res.status(404).send({message: 'not found'})

  const relatedServices = await Service.find({tags: {$in: category.name}, enabled: true}).select('key name')

  const isAMP = req.url.includes('/amp/')

  // 記事を取得
  const [ wpCategories, populars, wpInfo ] = await Promise.all([
    fetchCategoryList(),
    fetchPopularArticleList(),
    fetchArticleData({id: articleId, target: service.id, reference: 'Service', isAMP}),
  ])
  if (!wpInfo) return res.status(404).send({message: 'not found'})
  if (validator.isURL(wpInfo.redirect || '')) {
    return res.status(404).send({message: 'redirect', redirect: wpInfo.redirect})
  }

  // プロむけはリダイレクト
  if (wpInfo.forPro) {
    return res.status(404).send({message: 'redirect', redirect: `/pro/${category.key}/media/${articleId}`})
  }
  // 記事のカテゴリとのマッチを確認
  const isPickup = req.url.includes('/pickups/')
  if ((service.wpId && service.wpId !== wpInfo.catId) || (isPickup !== !!wpInfo.marusen)) {
    const redirect = await findCorrectArticleURL(wpInfo.catId, articleId, false, !!wpInfo.marusen)
    if (redirect) return res.status(404).send({message: 'redirect', redirect})
    return res.status(404).send({message: 'not found'})
  }

  let prefLocationServices = []
  if (wpInfo.profiles && wpInfo.profiles.length > 0) {

    // 同一サービスの都道府県リスト
    prefLocationServices = await LocationService.find({
      service: {$in: Array.from(new Set(wpInfo.profiles.reduce((sum, p) => sum.concat(p.services.map(s => s.id)), [])))},
      keyPath: {$in: Object.values(prefectures)},
    })
    .select('name service')
  }

  res.send({
    ...wpInfo,
    wpCategories,
    populars,
    category,
    service,
    relatedServices,
    prefLocationServices,
  })
}

async function categoryArticlePage(req, res) {
  const articleId = req.params.id
  if (!articleId) return res.status(404).send({message: 'not found'})

  // カテゴリ取得
  const category = await Category.findOne({key: req.params.key}).select('key name wpId providerName')
  if (!category) return res.status(404).send({message: 'not found'})

  const relatedServices = await Service.find({tags: {$in: category.name}, enabled: true}).select('key name')

  const isAMP = req.url.includes('/amp/')

  const [ wpCategories, populars, wpInfo, services ] = await Promise.all([
    fetchCategoryList(),
    fetchPopularArticleList(),
    fetchArticleData({id: articleId, target: category.id, reference: 'Category', isAMP}), // 記事を取得
    Service.find({
      tags: category.name,
      enabled: true,
    })
    .select('key name imageUpdatedAt matchMoreEnabled')
    .sort({priority: -1}),
  ])
  if (!wpInfo) return res.status(404).send({message: 'not found'})
  if (validator.isURL(wpInfo.redirect || '')) {
    return res.status(404).send({message: 'redirect', redirect: wpInfo.redirect})
  }
  if (services.length === 0) return res.status(404).json({message: 'not found'})

  // プロむけはリダイレクト
  if (wpInfo.forPro) {
    return res.status(404).send({message: 'redirect', redirect: `/pro/${category.key}/media/${articleId}`})
  }
  // 記事のカテゴリとのマッチを確認
  const isPickup = req.url.includes('/pickups/')
  if ((category.wpId && category.wpId !== wpInfo.catId) || (isPickup !== !!wpInfo.marusen)) {
    const redirect = await findCorrectArticleURL(wpInfo.catId, articleId, false, !!wpInfo.marusen)
    if (redirect) return res.status(404).send({message: 'redirect', redirect})
    return res.status(404).send({message: 'not found'})
  }

  // 同一サービスの都道府県リスト
  let prefLocationServices = []
  if (wpInfo.profiles && wpInfo.profiles.length > 0) {
    // 同一サービスの都道府県リスト
    prefLocationServices = await LocationService.find({
      service: {$in: Array.from(new Set(wpInfo.profiles.reduce((sum, p) => sum.concat(p.services.map(s => s.id)), [])))},
      keyPath: {$in: Object.values(prefectures)},
    })
    .select('name service')
  }

  res.send({
    ...wpInfo,
    wpCategories,
    populars,
    category,
    services,
    relatedServices,
    prefLocationServices,
  })
}


async function proArticlePage(req, res) {
  const articleId = req.params.id
  if (!articleId) return res.status(404).send({message: 'not found'})

  // カテゴリ取得
  const category = await Category.findOne({key: req.params.key}).select('key name wpId')
  if (!category) return res.status(404).send({message: 'not found'})

  const [ wpInfo, services, {articles} ] = await Promise.all([
    fetchArticleData({id: articleId, target: category.id, type: 'pro', reference: 'Category'}), // 記事を取得
    Service.find({
      tags: category.name,
      enabled: true,
    })
    .select('key name imageUpdatedAt')
    .sort({priority: -1}),
    fetchPostList({type: 'pro', category: category.wpId, per_page: 5}),
  ])
  if (!wpInfo) return res.status(404).send({message: 'not found'})
  if (validator.isURL(wpInfo.redirect || '')) {
    return res.status(404).send({message: 'redirect', redirect: wpInfo.redirect})
  }
  if (services.length === 0) return res.status(404).send({message: 'not found'})

  // ユーザーむけはリダイレクト
  if (!wpInfo.forPro) {
    return res.status(404).send({message: 'redirect', redirect: `/t/${category.key}/media/${articleId}`})
  }
  // 記事のカテゴリとのマッチを確認
  if (category.wpId && category.wpId !== wpInfo.catId) {
    const redirect = await findCorrectArticleURL(wpInfo.catId, articleId, true)
    if (redirect) return res.status(404).send({message: 'redirect', redirect})
    return res.status(404).send({message: 'not found'})
  }

  const relatedPosts = articles.map(a => ({...a, url: '/' + a.url.split(/^https:\/\/(.*?)\//)[2]}))

  res.send({
    ...wpInfo,
    category,
    services,
    relatedPosts,
  })
}

async function findCorrectArticleURL(wpId, articleId, forPro, forPickup?) {
  const type = !forPro && forPickup ? 'pickups' : 'media'
  const service = await Service.findOne({wpId}).select('key')
  if (service) return `/services/${service.key}/${type}/${articleId}`

  const category = await Category.findOne({wpId}).select('key')
  const prefix = forPro ? '/pro' : '/t'
  if (category) return `${prefix}/${category.key}/${type}/${articleId}`

  return null
}

async function previewArticlePage(req, res) {
  const { params: { id }, query: {service, category} } = req
  if (!id) return res.status(404).send({message: 'not found'})

  const isAMP = req.url.includes('/amp/')

  let target = null
  let reference = null
  if (service) {
    const model = await Service.findOne({key: service}).select('id name')
    if (model) {
      target = model.id
      reference = 'Service'
    }
  } else if (category) {
    const model = await Category.findOne({key: category}).select('id name')
    if (model) {
      target = model.id
      reference ='Category'
    }
  }

  // 記事を取得
  const preview = await isWPLoggedIn(req.headers.cookie)
  // TODO: 固定ページのプレビュー
  const wpInfo = await fetchArticleData({id, target, reference, preview, isAMP})
  if (!wpInfo) return res.status(404).send({message: 'not found'})

  res.send(wpInfo)
}

async function clearArticleCache(req, res) {
  const { params: { id }, body: {service, category, marusen} } = req
  if (!id) return res.status(404).send({message: 'not found'})

  const wpAuth = await isWPLoggedIn(req.headers.cookie)
  if (!wpAuth) return res.status(403).json({message: '認証に失敗しました'})

  const targetPathList = [
    `/media/wp-json/wp/v2/posts/${id}`,
  ]
  const articleType = marusen ? 'pickups' : 'media'
  const apiArticleType = marusen ? 'pickups' : 'articles'
  if (service) {
    const model = await Service.countDocuments({key: service})
    if (model) {
      targetPathList.push(`/services/${service}/${articleType}/${id}`)
      targetPathList.push(`/api/services/${service}/${apiArticleType}/${id}`)
    }
  } else if (category) {
    const model = await Category.countDocuments({key: category})
    if (model) {
      targetPathList.push(`/t/${category}/${articleType}/${id}`)
      targetPathList.push(`/api/categories/${category}/${apiArticleType}/${id}`)
    }
  }

  try {
    const result = await CloudFront.cacheInvalidation(targetPathList)
    res.json(result)
  } catch (e) {
    res.status(400).json({message: 'キャッシュ削除失敗'})
  }

}

async function isWPLoggedIn(cookie) {
  if (!cookie) return false
  let wptoken = cookie.split(' ').find(cookie => /wordpress_logged_in_/.test(cookie))
  let user = null
  if (wptoken) {
    wptoken = wptoken.split('=')[1]
    user = await axios.get(`${wpOrigin}/wp-json/custom/v1/is_wploggedin?wptoken=${encodeURIComponent(wptoken)}`)
    if (user) return true
  }
  return false
}

async function fetchById({id, preview = false, isFixed = false}) {
  const api = isFixed ? `${wpOrigin}/wp-json/wp/v2/pages/${id}` : `${wpOrigin}/wp-json/wp/v2/posts/${id}`
  const url = api + (preview ? `?preview_time=${Date.now()}` : '')
  const option = preview ? {
    auth: {
      username: config.get('wordpress.username'),
      password: config.get('wordpress.password'),
    },
  }: undefined

  const data = await axios
    .get(url, option)
    .then(res => res.data)
    .catch(e => e.response)

  if (!data || [401, 404].includes(data.status)) {
    return false
  }

  if (data.draft) {
    const url = `${wpOrigin}/wp-json/wp/v2/posts/${id}/revisions/${data.draft}?preview_time=${Date.now()}`
    const draft = await axios
      .get(url, option)
      .then(res => res.data)
      .catch(e => e.response)
    data.content = draft.content
  }

  data.title = data.title.rendered
  data.authorId = data.author
  data.author = data.article_author
  data.published = data.date
  data.shareImage = data.featured_image ? data.featured_image.src : undefined
  return data
}

async function fetchPostList({type, category = null, author = null, page = null, per_page = null}) {
  const params: any = {type: type === 'pro' ? 'pro' : 'customer'}
  if (category) params.category = category
  if (author) params.author = author
  if (page) params.page = page
  if (per_page) params.per_page = per_page

  const data = await axios.get(`${wpOrigin}/wp-json/custom/v1/posts?${qs.stringify(params)}`)
    .then(res => ({articles: res.data, total: parseInt(res.headers['x-wp-total'], 10)}))
  return data
}

async function fetchArticleData({id, target, reference, type = 'customer', isFixed = false, preview = false, isAMP = false}) {
  const data = await fetchById({id, preview, isFixed})
  if (!data) return false

  const redirect = data.acf.redirect
  const forPro = data.acf.forPro
  const marusen = data.acf.marusen
  const pref = data.acf.pref
  const oldZipTitle = data.yoast_meta.yoast_wpseo_title.includes('| SMOOOSY') ? null : data.yoast_meta.yoast_wpseo_title
  const zipTitle = data.acf.zipTitle || oldZipTitle
  const catId = safeTraverse(data, ['categories', 0])
  const meta = data.yoast_meta
  let relatedPosts = data['jetpack-related-posts'] ? data['jetpack-related-posts'].map(post => ({
    id: post.id,
    url: post.url,
    img: post.img,
    date: post.date,
    title: post.title,
  })) : []

  const categoryId = (data.categories || [])[0]
  if (!preview && categoryId && type === 'customer') {
    let relatedMarusens = await fetchRecommendArticleList({category: categoryId, pref: prefectures[pref] || 'all', per_page: 6})
    // 自分自身の記事を除く
    relatedMarusens = (relatedMarusens.articles || []).filter(rm => rm.id !== parseInt(id))
    // 重複削除
    relatedPosts = [...new Map(relatedMarusens.concat(relatedPosts).map((v) => [v.id, v])).values()].slice(0, 4)
  } else {
    // 自分自身の記事を除く
    relatedPosts = (relatedPosts || []).filter(r => r.id !== parseInt(id))
  }

  // htmlをdomに変換
  const { doms, profiles, reviewInfo } = await replaceHtmlToModule(data.content.rendered, target, reference, isAMP)

  return {
    articleId: id,
    title: data.title,
    author: data.author,
    authorId: data.authorId,
    published: data.published,
    modified: data.modified,
    shareImage: data.shareImage,
    redirect,
    forPro,
    marusen,
    pref,
    doms,
    catId,
    zipTitle,
    meta,
    relatedPosts,
    profiles,
    reviewInfo,
  }
}

async function fetchCategoryList() {
  const cats = await axios.get(`${wpOrigin}/wp-json/custom/v1/categories`).then(res => res.data)

  let [ categories, services ] = await Promise.all([
    Category.find({wpId: cats.filter(c => c.parent === 0).map(c => c.id)}).select('key name wpId').lean(),
    Service.find({wpId: cats.filter(c => c.parent !== 0).map(c => c.id)}).select('key name category wpId imageUpdatedAt').lean({virtuals: ['image']}),
  ])
  categories = categories.map(c => {
    c.services = services.filter(s => c._id.equals(s.category))
    return c
  })

  return categories
}

async function fetchPopularArticleList() {
  const data = await axios
    .get(`${wpOrigin}/wp-json/custom/v1/popular_posts?days=7&limit=10`)
    .then(res => res.data)
    .catch(e => e.response)

  if (!data) {
    return []
  }
  for (const d of data) {
    d.post_permalink = d.post_permalink.replace(process.env.NODE_ENV === 'production' ? 'https://smooosy.com' : 'https://dev.smooosy.com', '')
  }

  return data
}

async function fetchRecommendArticleList({category = null, pref = null, page = null, per_page = null}) {
  const params: any = {type: 'customer'}
  if (category) params.category = category
  if (pref) params.pref = pref
  if (page) params.page = page
  if (per_page) params.per_page = per_page

  const data = await axios.get(`${wpOrigin}/wp-json/custom/v1/posts?${qs.stringify(params)}`)
    .then(res => ({articles: res.data, total: parseInt(res.headers['x-wp-total'], 10)}))
    .catch(() => ({articles: [], total: 0}))

  return data
}

async function replaceHtmlToModule(html, target, reference, isAMP) {
  // remove all style attributes
  html = html.replace(/style="[^"]+"/ig, '')

  const priceServiceKeys = new Set()
  const $ = cheerio.load(html)
  // ページ最下段スクロール固定バーを削除（TODO: そのうちMedia側の記事から直接削除する）
  $('div.su-fix').remove()
  // 文中Zipモジュールを削除
  $('.su-form').remove()

  const wrapper = $('<div class="medium-editor-scroll-x"></div>')
  $('table.tablepress').wrap(wrapper)

  const doms = []
  $('body').children().each(function() {
    const $this = $(this)
    // skip &nbsp;
    if ($this.html().replace('&#xA0;', '').trim() === '') {
      return
    }
    // プロモジュール
    if ($this.is('div.su-pro-align')) {
      const $img = $this.find('img')
      const src = $img.attr('src')
      const $a = $this.find('a')
      const href = $a.attr('href')
      const url = (href || '').split('?')[0].split('/') || []
      const id = url.length > 0 ? url[url.length - 1] : null
      const label = $a.text()
      const $desc = $this.find('div.mm-desc.su-pro-desc')
      const desc = $desc.text()
      const profileId = id.length === 16 ? shortIdToMongoId(id) : /^[a-fA-F0-9]{24}$/.test(id) ? id : null
      if (profileId) {
        doms.push({id: uuidv4(), component: 'pro', props: {src, href, label, desc, profileId}})
      }
    // プロ紹介モジュール
    } else if ($this.is('div.su-intro')) {
      const id = $this.html()
      const profileId = id.length === 16 ? shortIdToMongoId(id) : /^[a-fA-F0-9]{24}$/.test(id) ? id : null
      if (profileId) {
        doms.push({id: uuidv4(), component: 'intro', props: {profileId}})
      }
    // サービス価格分布モジュール
    } else if ($this.is('div.su-price')) {
      const serviceKey = $this.html()
      if (serviceKey) {
        priceServiceKeys.add(serviceKey)
        doms.push({id: uuidv4(), component: 'price', props: {serviceKey}})
      }
    // インスタグラム
    } else if (isAMP && $this.is('blockquote[data-instgrm-permalink]')) {
      let link = $this.attr('data-instgrm-permalink')
      link = link.split('instagram.com/p/')[1]
      if (!link) return
      link = link.split('/')[0]
      if (!link) return
      doms.push({
        id: uuidv4(),
        instagram: true,
        dom: `<amp-instagram data-shortcode="${link}" width="320" height="392" layout="responsive"></amp-instagram>`,
      })
    // モジュール以外の通常のDOM
    } else {
      // 動画を中央寄せにする
      $this.find('iframe.youtube-player').each(function(index, element) {
        $(element).addClass('aligncenter')
      })

      if (isAMP) {
        $this.find('iframe.youtube-player').each(function(index, element) {
          const videoId = $(element).attr('src').split('/embed/')[1].split('?')[0]
          $(element).replaceWith(`<amp-youtube layout='responsive' data-videoid=${videoId} width=640 height=390 >`)
        })
        $this.find('script,svg').remove('')
      }

      $this.find('img').each(function (index, element) {
        $(element).removeAttr('sizes')
      })
      doms.push({id: uuidv4(), dom: $.html($this)})
    }
  })

  const serviceIds =
    reference === 'Category' ? await Service.find({category: target}).distinct('_id') :
    reference === 'Service' ? [ target ] :
    []
  const profileIds = doms.filter(d => d.component === 'intro').map(d => d.props.profileId)
  let introductions = (target && reference) ? await ProfileIntroduction
    .find({
      profile: {$in: profileIds},
      target,
      reference,
    }).populate({
      path: 'profile',
      select: 'name prefecture shortId address reviews reviewCount averageRating services suspend deactivate',
      populate: [
        {path: 'services', select: 'name key imageUpdatedAt', match: {enabled: true}},
        {path: 'pro', select: 'imageUpdatedAt'},
        {path: 'reviews', match: {service: serviceIds, rating: {$gt: 3}}, options: {sort: '-createdAt', limit: 3} },
      ],
    }) : []
  introductions = introductions.filter(intro => !intro.profile.suspend && !intro.profile.deactivate)

  const profiles = introductions.map(i => i.profile)
  let reviewInfo = null
  const profilesWithReview = profiles.filter(p => p.reviewCount)
  if (profilesWithReview.length > 0) {
    reviewInfo = {
      avg: profilesWithReview.reduce((sum, current) => sum + current.averageRating, 0) / profilesWithReview.length,
      count: profilesWithReview.reduce((sum, current) => sum + current.reviewCount, 0),
    }
  }

  const introductionObjs = {}
  for (const introduction of introductions) {
    introductionObjs[introduction.profile.id] = introduction
  }

  const priceServices = await Service.find({key: {$in: Array.from(priceServiceKeys)}}).select('key name')
  const priceServiceObjs = {}
  for (const priceService of priceServices) {
    priceServiceObjs[priceService.key] = priceService
  }

  for (const dom of doms) {
    if (dom.component === 'price') {
      if (priceServiceObjs[dom.props.serviceKey]) {
        const service = priceServiceObjs[dom.props.serviceKey]
        const price = await getPriceEstimate({service: service._id})

        if (price.average && price.low && price.high) {
          dom.props.service = service
          dom.props.price = price
        }
      }
    }
    if (dom.component !== 'intro') continue
    dom.props.introduction = introductionObjs[dom.props.profileId]
  }
  return { doms, profiles, reviewInfo }
}

