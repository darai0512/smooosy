export {}
const google  = require('googleapis')
const readline = require('readline')
const config = require('config')
const moment = require('moment')
const bigquery = require('./bigquery')
import bigquery_searchconsole = require('../bigquery_searchconsole.json')
import bigquery_searchconsole_summary = require('../bigquery_searchconsole_summary.json')
const { Service, Category } = require('../models')
const { slack } = require('./util')

module.exports = {
  auth,
  search,
}

// Refreshトークンが切れた時に呼ぶ(未使用時6ヶ月)
async function auth() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const SCOPE = ['https://www.googleapis.com/auth/webmasters']
  const oauth2Client = new google.auth.OAuth2(config.searchConsole.CLIENT_ID, config.searchConsole.CLIENT_SECRET, config.searchConsole.REDIRECT_URL)
  const getAccessToken = (oauth2Client) => {
    // OAuth2認証のためのURLを生成する
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // refresh_tokenが必要なので、offlineを指定
      scope: SCOPE,
    })
    console.log('右記のURLをブラウザで開いてください: ', url)
    rl.question('表示されたコードを貼り付けてください: ', (code) => {
      oauth2Client.getToken(code, (err, tokens) => {
        console.log('トークンが発行されました')
        console.log(tokens)
        console.log('上記の情報を大切に保管してください')
      })
    })
  }
  getAccessToken(oauth2Client)
}

async function search(prevDay = 3, onlyDetail = false) {
  const start = moment().format('YYYY/MM/DD HH:mm:ss')
  const OAuth2 = google.auth.OAuth2
  const oauth2Client = new OAuth2(
    config.searchConsole.CLIENT_ID,
    config.searchConsole.CLIENT_SECRET,
    config.searchConsole.SITE_URL,
  )
  oauth2Client.setCredentials({
    refresh_token: config.searchConsole.REFRESH_TOKEN,
  })

  const fetch = () => {
    return new Promise((resolve, reject) => {
      oauth2Client.refreshAccessToken((err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }

  try {
    await fetch()
  } catch (err) {
    console.log(err)
    return
  }

  const services = await Service.find({})
  const serviceList = {}
  services.map(s => {
    if (s.key) serviceList[s.key] = s
  })
  const categoryList = {}
  const categoies = await Category.find().select('key name')
  categoies.map(c => categoryList[c.key] = c.name)

  const webmasters = google.webmasters({
    version: 'v3',
    auth: oauth2Client,
  })

  const date = formatDate(new Date().setDate(new Date().getDate() - prevDay))
  const query = async (dimensions) => {
    const LIMIT = 25000
    let page = 0
    let rowCount = 0
    const result = []

    // 25000ごとpagingして全件取得
    do {
      const resource = {
        rowLimit: LIMIT,
        startRow: LIMIT * page,
        dimensions,
        startDate: date,
        endDate: date,
      }
      const rows: any[] = await new Promise((resolve, reject) => {
        webmasters.searchanalytics.query({
          siteUrl: encodeURIComponent(config.searchConsole.SITE_URL),
          auth: oauth2Client,
          resource,
        }, (err, datas) => {
          if (err || !datas) {
            reject(err || new Error('Search Console API エラー'))
          } else {
            // 検索アナリティクスのデータが最大で25000件表示される
            resolve(datas.rows || [])
          }
        })
      })

      result.push(...rows)
      rowCount = rows.length
      page++
    } while (rowCount === 25000)

    return result
  }

  try {
    const resultSummary = onlyDetail ? null : await query(['date'])
    const resultKeyword = onlyDetail ? null : await query(['query'])
    const resultPage = onlyDetail ? null : await query(['query', 'page'])
    const resultDetail = await query(['page'])
    let data = null
    // dailyのサマリ（クリック数、表示回数、検索順位）
    if (resultSummary && resultSummary.length > 0) {
      data = resultSummary.map(r => {
        return {
          date: moment(date).toDate(),
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          rank: r.position,
        }
      })[0]
    }
    // キーワードのURL
    const pages = {}
    if (resultPage && resultPage.length > 0) {
      resultPage.map(r => {
        pages[r.keys[0]] = r.keys[1]
      })
    }
    let keywords = null
    // キーワードに対するクリック数と表示回数と検索順位
    if (resultKeyword && resultKeyword.length > 0) {
      keywords = resultKeyword.map(r => {
        return {
          date: moment(date).toDate(),
          keyword: r.keys[0],
          url: pages[r.keys[0]],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          rank: r.position,
          option: pages[r.keys[0]] ? JSON.stringify(getOption(pages[r.keys[0]], serviceList, categoryList)) : JSON.stringify({type: 'その他'}),
        }
      })
    }
    let detailLogs = null
    // page で全件保存
    if (resultDetail && resultDetail.length > 0) {
      detailLogs = resultDetail.map(r => {
        const option = getOption(r.keys[0], serviceList, categoryList)
        return {
          date: moment(date).toDate(),
          url: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          rank: r.position,
          ...option,
        }
      })
    }

    if (data) {
      if (bigquery.validate(data, bigquery_searchconsole_summary)) {
        await bigquery
          .insert(config.get('bigquery.dataset'), config.get('bigquery.table_searchconsole_summary'), [data])
          .catch((e) => {
            console.log(e)
          })

        const message = `:rocket:【Google SearchConsole 集計結果】集計対象日：${moment(data.date).format('YYYY/MM/DD')}\n集計開始:${start}\n表示回数:${data.impressions}\nクリック数:${data.clicks}\n平均CTR:${data.ctr}\n平均順位:${data.rank}`
        slack({message, room: 'jobs'})
      }
    }
    if (keywords) {
      const logs = []
      for (const keyword of keywords) {
        if (!bigquery.validate(keyword, bigquery_searchconsole)) continue
        logs.push(keyword)
      }

      if (logs.length > 0) {
        await bigquery
          .insert(config.get('bigquery.dataset'), config.get('bigquery.table_searchconsole'), logs)
          .catch((e) => {
            console.log(e)
          })
      }
    }

    if (detailLogs && detailLogs.length > 0) {
      await bigquery
        .insert(config.get('bigquery.dataset'), config.get('bigquery.table_searchconsole_detail'), detailLogs)
        .catch((e) => {
          console.log(e)
        })
    }

  } catch (err) {
    console.log(err)
    const message = `:ghost:【Google SearchConsole 集計エラー】\n${err.stack}`
    slack({message, room: 'jobs'})
  }

}

function getOption(url, serviceList, categoryList) {
  url = url.split('#')[0].split('?')[0]

  // 旧メディア
  if (/\.com\/media/.test(url)) {
    const tokens = url.split('/')
    const idx = tokens.findIndex(e => e === 'media')
    const category = (idx + 1 < tokens.length) ? tokens[idx + 1] : ''
    const service = (idx + 2 < tokens.length) ? tokens[idx + 2] : ''

    const ret: any = {type: 'メディア'}
    if (categoryList[category]) {
      ret.category = categoryList[category]
    }
    if (serviceList[service] && serviceList[service].tags) {
      ret.service = serviceList[service].name
    }

    if (/\/amp\//.test(url)) {
      ret.amp = true
    }

    return ret
  }

  // メディア
  if (/\/media/.test(url)) {
    const tokens = url.split('/')
    const idx = tokens.findIndex(e => e === 'media')

    const ret: any = {type: 'メディア'}
    if (tokens[idx - 2] === 'services') {
      const service = tokens[idx - 1]
      if (serviceList[service] && serviceList[service].tags) {
        ret.service = serviceList[service].name
        ret.category =serviceList[service].tags[0]
      }
    } else if (tokens[idx - 2] === 't') {
      const category = tokens[idx - 1]
      if (categoryList[category]) {
        ret.category = categoryList[category]
      }
    }

    if (/\d+/.test(tokens[idx + 1])) {
      ret.article_id = tokens[idx + 1]
    }

    if (/\/amp\//.test(url)) {
      ret.amp = true
    }

    return ret
  }

  // メディア: ○選
  if (/\/pickups\//.test(url)) {
    const tokens = url.split('/')
    const idx = tokens.findIndex(e => e === 'pickups')

    const ret: any = {type: 'メディア:○選'}
    if (tokens[idx - 2] === 'services') {
      const service = tokens[idx - 1]
      if (serviceList[service] && serviceList[service].tags) {
        ret.service = serviceList[service].name
        ret.category =serviceList[service].tags[0]
      }
    } else if (tokens[idx - 2] === 't') {
      const category = tokens[idx - 1]
      if (categoryList[category]) {
        ret.category = categoryList[category]
      }
    }

    if (/\d+/.test(tokens[idx + 1])) {
      ret.article_id = tokens[idx + 1]
    }

    if (/\/amp\//.test(url)) {
      ret.amp = true
    }

    return ret
  }

  // プロフィールページ
  if (/\/p\/.+/.test(url)) {
    const ret: any = {type: 'プロフィール'}
    if (/\/amp\//.test(url)) {
      ret.amp = true
    }

    return ret
  }
  // 大カテゴリページ
  if (/\/sections\/.+/.test(url)) {
    return {type: 'セクション'}
  }
  // カテゴリページ
  if (/\/t\/.+/.test(url)) {
    const tokens = url.split('/')
    const idx = tokens.findIndex(e => e === 't')
    const category = (idx + 1 < tokens.length) ? tokens[idx + 1] : ''

    const ret: any = {type: 'カテゴリ'}
    if (categoryList[category]) {
      ret.category = categoryList[category]
    }

    if (/\/amp\//.test(url)) {
      ret.amp = true
    }

    return ret
  }
  // サービスページ
  if (/\/services\/.+/.test(url)) {
    const tokens = url.split('/')
    const idx = tokens.findIndex(e => e === 'services')
    const service =  (idx + 1 < tokens.length) ? tokens[idx + 1] : ''

    if (service === 'prices' || tokens[idx + 2] === 'requests') return { type: 'その他' }

    const ret: any = {type: 'サービス'}
    if (serviceList[service] && serviceList[service].tags) {
      ret.service = serviceList[service].name
      ret.category = serviceList[service].tags[0]
    }
    if (/\/amp\//.test(url)) {
      ret.amp = true
    }

    return ret
  }
  // プロページ
  if (/\/pro$/.test(url)) {
    return {type: 'プロ'}
  }
  if (/\/pro\/.+/.test(url)) {
    const tokens = url.split('/')
    const idx = tokens.findIndex(e => e === 'services')
    const category =  (idx + 1 < tokens.length) ? tokens[idx + 1] : ''

    const ret: any = {type: 'プロカテゴリ'}
    if (categoryList[category]) {
      ret.category = categoryList[category]
    }

    return ret
  }
  // トップページ
  if (url === 'https://smooosy.com/') {
    return {type: 'トップ'}
  }

  return {type: 'その他'}
}

const formatDate = (date) => {
  const d = new Date(date)
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  const year = d.getFullYear()
  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day
  return [year, month, day].join('-')
}

