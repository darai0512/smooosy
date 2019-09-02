export {}
const axios = require('axios')
const qs = require('qs')

const config = require('config')
const { webOrigin } = require('@smooosy/config')

const redis = require('../lib/redis')

module.exports = {
  index,
  show,
}

const WP_ORIGIN = config.get('newsWP.origin')
const WP_SITE_ID = config.get('newsWP.siteId')
const LIST_FIELDS = [ 'ID', 'date', 'title', 'categories' ]
const SHOW_FIELDS = [ 'ID', 'date', 'title', 'categories', 'modified', 'content' ]
const DEFAULT_PER_PAGE = 10

/**
 * @see: https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/posts/
 */
async function index(req, res) {
  const { page, per_page } = req.query

  const query: any = {
    fields: LIST_FIELDS.join(','),
    number: DEFAULT_PER_PAGE,
  }

  if (page && page > 0) query.page = page
  if (per_page && per_page > 0) query.number = per_page

  const headers = await getAuthorizationHeaders()
  const data = await axios.get(`${WP_ORIGIN}/rest/v1.1/sites/${WP_SITE_ID}/posts?${qs.stringify(query)}`, {headers})
    .then(res => res.data)
    .catch(err => {
      const response = err.response || {}
      return {
        error: {
          status: response.status || 500,
          message: (response.data || {}).message,
        },
      }
    })

  if (data.error) {
    if (data.error.status !== 404) console.error(data.error)
    return res.status(data.error.status).json({message: data.error.message})
  }

  // change response close to WP REST API easy to migrate
  res.send({
    total: data.found,
    posts: data.posts.map(d => {
      return {
        id: d.ID,
        date: d.date,
        url: `${webOrigin}/company/news/${d.ID}`,
        title: d.title,
        category: convertCategories(d.categories),
      }
    }),
  })
}

/**
 * @see: https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/posts/%24post_ID/
 */
async function show(req, res) {
  const postId = req.params.id

  const query = {
    fields: SHOW_FIELDS.join(','),
  }

  const headers = await getAuthorizationHeaders()
  const data = await axios
    .get(`${WP_ORIGIN}/rest/v1.1/sites/${WP_SITE_ID}/posts/${postId}?${qs.stringify(query)}`, {headers}).then(res => res.data)
    .catch(err => {
      const response = err.response || {}
      return {
        error: {
          status: response.status || 500,
          message: (response.data || {}).message,
        },
      }
    })

  if (data.error) {
    if (data.error.status !== 404) console.error(data.error)
    return res.status(data.error.status).json({message: data.error.message})
  }

  res.send({
    id: data.ID,
    date: data.date,
    modfied: data.modfied,
    url: `${webOrigin}/company/news/${data.ID}`,
    title: data.title,
    category: convertCategories(data.categories),
    content: data.content,
  })
}

function convertCategories(categories) {
  const values = categories ? Object.values(categories) : null
  const c: any = values && values.length > 0 ? values[0] : null

  if (!c) {
    return null
  }
  return {
    id: c.ID,
    key: c.slug,
    name: c.description,
  }
}

async function getAuthorizationHeaders() {
  // auth for dev. production is public now
  // see: https://developer.wordpress.com/docs/oauth2/
  //      "Testing an application as the client owner"
  const clientId = config.get('newsWP.clientId')
  const clientSecret = config.get('newsWP.clientSecret')
  const username = config.get('newsWP.username')
  const password = config.get('newsWP.password')

  if (!clientId || !clientSecret || !username || !password) {
    return {}
  }

  const convertToHeader = data => ({
    authorization: `${data.token_type} ${data.access_token}`,
  })

  const cacheKey = `news-wp-token-${WP_SITE_ID}-${clientId}`
  const cacheData = await redis.getAsync(cacheKey).then(res => JSON.parse(res))
  if (cacheData) {
    return convertToHeader(cacheData)
  }

  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  params.append('grant_type', 'password')
  params.append('username', username)
  params.append('password', password)

  const data = await axios.post(`${WP_ORIGIN}/oauth2/token`, params)
    .then(res => res.data)
    .catch(err => ({error: err.response}))

  if (data.error) {
    console.error(data.error.data)
    return {}
  }
  await redis.setAsync(cacheKey, JSON.stringify(data), 'EX', 24 * 60 * 60)
  return convertToHeader(data)
}
