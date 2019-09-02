export {}
const googleAuth = require('google-auth-library')
const auth = new googleAuth()
const commonConfig = require('@smooosy/config')
const config = require('config')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const { Service, ServiceArea, Category, CategoryArea, Lead } = require('../models')
const sheets = require('googleapis').sheets('v4')
const {
  spreadsheetId, spreadsheetLeadId, spreadsheetScrapingId,
  spreadsheetServiceSchema, spreadsheetCategorySchema,
  descriptionServiceSchema, pageDescriptionServiceSchema,
  descriptionCategorySchema, pageDescriptionCategorySchema,
  oauthClient, oauthSecret,
} = config.get('google')

module.exports = {
  scraping2Lead,
  mongo2sheets,
  sheets2mongo,
  sheets2leadDescription,
}

async function scraping2Lead(req, res) {
  const sheetId = spreadsheetScrapingId
  // OAuth認証
  const oauth2Client = new auth.OAuth2(oauthClient, oauthSecret, `${commonConfig.webOrigin}/api/googles/scraping2Lead`)

  const { code } = req.query

  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: ['https://www.googleapis.com/auth/spreadsheets']})
    return res.redirect(authUrl)
  }

  const token = await new Promise((resolve, reject) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        reject()
      } else {
        resolve(token)
      }
    })
  })
  oauth2Client.credentials = token

  console.log(`import from https://docs.google.com/spreadsheets/d/${sheetId}`)

  const values: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId: sheetId,
      majorDimension: 'ROWS',
      range: '\'service_crawl\'!A3:Z1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  // leadのwebサイトからの検索語句一覧をjsonで保存
  const leadServices = []
  for (const val of values) {
    const service = await Service.findOne({name: val[0]}).select('_id tags').lean()
    const option = val[2] ? val[2].split(/,\s*/).filter(o => o) : []
    leadServices.push({
      service: val[0],
      serviceId: service._id,
      category: service.tags[0],
      done: val[3] === 'done',
      option,
      required: val[1].split(/,\s*/).filter(m => m && !option.includes(m)),
    })
  }
  fs.writeFileSync(path.join(__dirname, '../leadServiceRegex.json'), JSON.stringify(leadServices, null, 2))
  res.json({
    message: 'success!',
    url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
  })
}

async function mongo2sheets(req, res) {
  // OAuth認証
  const oauth2Client = new auth.OAuth2(oauthClient, oauthSecret, `${commonConfig.webOrigin}/api/googles/mongo2sheets`)

  const { code } = req.query
  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: ['https://www.googleapis.com/auth/spreadsheets']})
    return res.redirect(authUrl)
  }

  const token = await new Promise((resolve, reject) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        reject()
      } else {
        resolve(token)
      }
    })
  })
  oauth2Client.credentials = token

  console.log(`export to https://docs.google.com/spreadsheets/d/${spreadsheetId}`)

  const services = await Service.find()
  const values = [
    spreadsheetServiceSchema.map(e => e.text),
    ...services.map(service => spreadsheetServiceSchema.map(e => {
      let value = service[e.key]
      if (value === undefined) value = ''
      if (Array.isArray(value)) value = value.join(', ')
      return value
    })),
  ]

  await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.update({
      auth: oauth2Client,
      spreadsheetId,
      range: 'B1:Z1000',
      valueInputOption: 'USER_ENTERED',
      resource: {
        range: 'B1:Z1000',
        majorDimension: 'ROWS',
        values,
      },
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response)
    })
  })

  res.json({
    message: 'success!',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  })
}

// dev.smooosy.dbs（開発）、smooosy.dbs（本番）よりサービスページのデータをインポートする
async function sheets2mongo(req, res) {
  // OAuth認証
  const oauth2Client = new auth.OAuth2(oauthClient, oauthSecret, `${commonConfig.webOrigin}/api/googles/sheets2mongo`)

  const { code } = req.query
  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: ['https://www.googleapis.com/auth/spreadsheets']})
    return res.redirect(authUrl)
  }

  const token = await new Promise((resolve, reject) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        reject()
      } else {
        resolve(token)
      }
    })
  })
  oauth2Client.credentials = token

  console.log(`import from https://docs.google.com/spreadsheets/d/${spreadsheetId}`)

  const prefectures = {}
  Object.keys(commonConfig.prefectures).forEach(key => {
    prefectures[commonConfig.prefectures[key]] = key
  })

  await Promise.all([
    sheets2mongoServices(oauth2Client, prefectures),
    sheets2mongoCategories(oauth2Client, prefectures),
  ])

  res.json({
    message: 'success!',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  })
}

// サービスのインポート
async function sheets2mongoServices(oauth2Client, prefectures) {

  // servicesシートより取得
  const values: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'services\'!2:1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  const idlist = []
  const serviceIds = {}
  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    const service: any = {}
    spreadsheetServiceSchema.forEach((e, idx) => {
      service[e.key] = value[idx+1] || ''
    })
    service.priority = (service.priority - 0) || 0
    service.enabled = service.enabled === 'TRUE'
    service.interview = service.interview === 'TRUE'
    service.needMoreInfo = service.needMoreInfo === 'TRUE'
    service.tags = Array.from(new Set((service.tags ? service.tags.split(/,\s*/) : []).filter(e => e)))

    idlist[i] = service._id
    if (value[0] !== 'y') continue

    // _idは存在していたらDB上に存在
    if (service._id) {
      serviceIds[service.key] = mongoose.Types.ObjectId(service._id)
      await Service.findOneAndUpdate(
        { _id: service._id },
        service,
        { upsert: true, runValidators: true }
      )
    // 存在していなかったら新規
    } else {
      delete service._id
      const s = await Service.create(service)
      idlist[i] = s._id
      serviceIds[service.key] = s._id
    }
  }


  // service.descriptionシートより取得
  const descriptions: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'service.description\'!2:1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  // service.pageDescriptionシートより取得
  const pageDescriptions: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'service.pageDescription\'!2:1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  const descriptionSchema: any[] = Array.from(descriptionServiceSchema)
  const pageDescriptionSchema: any[] = Array.from(pageDescriptionServiceSchema)

  // 都道府県情報追加
  for (const key in prefectures) {
    const prefecture = prefectures[key]
    descriptionSchema.push({key, text: prefecture})
    pageDescriptionSchema.push({key, text: prefecture})
  }

  const serviceAreas = {}
  const serviceDescs = {}
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]

    let key = ''
    descriptionSchema.forEach((e, idx) => {
      if (e.key === 'key') {
        key = description[idx] || ''
        return
      }
      if (key === '') return
      if (e.key === 'common') {
        serviceDescs[key] = { _id: serviceIds[key], ...serviceDescs[key], description: description[idx] || '' }
        return
      }
      // 地域別のサービス説明取得
      if (prefectures[e.key]) {
        const serviceArea = {
          place: prefectures[e.key],
          key: e.key,
          serviceKey: key,
          service: serviceIds[key],
          description: description[idx] || '',
        }
        serviceAreas[`${key}_${e.key}`] = {...serviceAreas[`${key}_${e.key}`], ...serviceArea}
      }
    })
  }


  for (let i = 0; i < pageDescriptions.length; i++) {
    const pageDescription = pageDescriptions[i]

    let key = ''
    pageDescriptionSchema.forEach((e, idx) => {
      if (e.key === 'key') {
        key = pageDescription[idx] || ''
        return
      }
      if (key === '') return
      if (e.key === 'common') {
        if (serviceIds[key]) {
          serviceDescs[key] = { _id: serviceIds[key], ...serviceDescs[key], pageDescription: pageDescription[idx] || '' }
        }
        return
      }
      if (e.key === 'template') {
        // TODO: {{content}}処理？
        return
      }
      // 地域別のサービスページ説明取得
      if (prefectures[e.key]) {
        const serviceArea = {
          place: prefectures[e.key],
          key: e.key,
          serviceKey: key,
          service: serviceIds[key],
          pageDescription: pageDescription[idx] || '',
        }
        serviceAreas[`${key}_${e.key}`] = {...serviceAreas[`${key}_${e.key}`], ...serviceArea}
      }
    })
  }

  for (const key in serviceDescs) {
    if (serviceDescs[key]._id) {
      await Service.findOneAndUpdate(
        { _id: serviceDescs[key]._id },
        serviceDescs[key],
        { upsert: true, runValidators: true }
      )
    }
  }

  const bulk = ServiceArea.collection.initializeOrderedBulkOp()
  bulk.find({}).remove()
  for (const key in serviceAreas) {
    bulk.insert(serviceAreas[key])
  }

  await new Promise((resolve) => {
    bulk.execute((err, result) => {
      resolve(result)
    })
  })


  await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.update({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'services\'!B2:B1000',
      valueInputOption: 'USER_ENTERED',
      resource: {
        range: '\'services\'!B2:B1000',
        majorDimension: 'COLUMNS',
        values: [idlist],
      },
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response)
    })
  })
}

// カテゴリのインポート
async function sheets2mongoCategories(oauth2Client, prefectures) {

  // categoriesシートより取得
  const values: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'categories\'!2:1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  const idlist = []
  const categoryIds = {}
  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    const category: any = {}
    spreadsheetCategorySchema.forEach((e, idx) => {
      category[e.key] = value[idx+1] || ''
    })

    idlist[i] = category._id
    if (value[0] !== 'y') continue

    // _idは存在していたらDB上に存在
    if (category._id) {
      categoryIds[category.key] = mongoose.Types.ObjectId(category._id)
      await Category.findOneAndUpdate(
        { _id: category._id },
        category,
        { upsert: true, runValidators: true }
      )
    // 存在していなかったら新規
    } else {
      delete category._id
      const c = await Category.create(category)
      idlist[i] = c._id
      categoryIds[category.key] = c._id
    }
  }

  // category.descriptionシートより取得
  const descriptions: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'category.description\'!2:1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  // category.pageDescriptionシートより取得
  const pageDescriptions: any[] = await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'category.pageDescription\'!2:1000',
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response.values)
    })
  })

  const descriptionSchema: any[] = Array.from(descriptionCategorySchema)
  const pageDescriptionSchema: any[] = Array.from(pageDescriptionCategorySchema)

  // 都道府県情報追加
  for (const key in prefectures) {
    const prefecture = prefectures[key]
    descriptionSchema.push({key, text: prefecture})
    pageDescriptionSchema.push({key, text: prefecture})
  }

  const categoryAreas = {}
  const categoryDescs = {}
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]

    let key = ''
    descriptionSchema.forEach((e, idx) => {
      if (e.key === 'key') {
        key = description[idx] || ''
        return
      }
      if (key === '') return
      if (e.key === 'common') {
        categoryDescs[key] = { _id: categoryIds[key], ...categoryDescs[key], description: description[idx] || '' }
        return
      }
      // 地域別のカテゴリ説明取得
      if (prefectures[e.key]) {
        const categoryArea = {
          place: prefectures[e.key],
          key: e.key,
          categoryKey: key,
          category: categoryIds[key],
          description: description[idx] || '',
        }
        categoryAreas[`${key}_${e.key}`] = {...categoryAreas[`${key}_${e.key}`], ...categoryArea}
      }
    })
  }


  for (let i = 0; i < pageDescriptions.length; i++) {
    const pageDescription = pageDescriptions[i]

    let key = ''
    pageDescriptionSchema.forEach((e, idx) => {
      if (e.key === 'key') {
        key = pageDescription[idx] || ''
        return
      }
      if (key === '') return
      if (e.key === 'common') {
        if (categoryIds[key]) {
          categoryDescs[key] = { _id: categoryIds[key], ...categoryDescs[key], pageDescription: pageDescription[idx] || '' }
        }
        return
      }
      if (e.key === 'template') {
        // TODO: {{content}}処理？
        return
      }
      // 地域別のカテゴリページ説明取得
      if (prefectures[e.key]) {
        const categoryArea = {
          place: prefectures[e.key],
          key: e.key,
          categoryKey: key,
          category: categoryIds[key],
          pageDescription: pageDescription[idx] || '',
        }
        categoryAreas[`${key}_${e.key}`] = {...categoryAreas[`${key}_${e.key}`], ...categoryArea}
      }
    })
  }

  for (const key in categoryDescs) {
    if (categoryDescs[key]._id) {
      await Category.findOneAndUpdate(
        { _id: categoryDescs[key]._id },
        categoryDescs[key],
        { upsert: true, runValidators: true }
      )
    }
  }

  const bulk = CategoryArea.collection.initializeOrderedBulkOp()
  bulk.find({}).remove()
  for (const key in categoryAreas) {
    bulk.insert(categoryAreas[key])
  }

  await new Promise((resolve) => {
    bulk.execute((err, result) => {
      resolve(result)
    })
  })


  await new Promise((resolve, reject) => {
    sheets.spreadsheets.values.update({
      auth: oauth2Client,
      spreadsheetId,
      range: '\'categories\'!B2:B1000',
      valueInputOption: 'USER_ENTERED',
      resource: {
        range: '\'categories\'!B2:B1000',
        majorDimension: 'COLUMNS',
        values: [idlist],
      },
    }, (err, response) => {
      if (err) {
        return reject(err)
      }
      resolve(response)
    })
  })
}


async function sheets2leadDescription(req, res) {

  // OAuth認証
  const oauth2Client = new auth.OAuth2(oauthClient, oauthSecret, `${commonConfig.webOrigin}/api/googles/sheets2leadDescription`)

  const { code } = req.query
  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: ['https://www.googleapis.com/auth/spreadsheets']})
    return res.redirect(authUrl)
  }

  const token = await new Promise((resolve, reject) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        reject()
      } else {
        resolve(token)
      }
    })
  })
  oauth2Client.credentials = token

  try {
    // servicesシートより取得
    const values: any[] = await new Promise((resolve, reject) => {
      sheets.spreadsheets.values.get({
        auth: oauth2Client,
        spreadsheetId: spreadsheetLeadId,
        range: '2:1000',
      }, (err, response) => {
        if (err) {
          return reject(err)
        }
        resolve(response.values)
      })
    })

    res.json({
      message: '',
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetLeadId}`,
    })

    // console.log(values)
    const data = []
    for (let i = 1; i < values.length; i++) {
      const value = values[i]

      const tempSchema = [
        {key: '_id', text: '_id'},
        {key: 'name', text: 'name'},
        {key: 'url', text: 'url'},
        {key: 'industry', text: 'industry'},
        {key: 'address', text: 'address'},
        {key: 'email', text: 'email'},
        {key: 'phone', text: 'phone'},
        {key: 'category', text: 'category'},
        {key: 'description', text: 'description'},
      ]

      const importLead: any = {}
      tempSchema.forEach((e, idx) => {
        importLead[e.key] = value[idx] || ''
      })
      if (!importLead.description) continue

      data.push({
        _id: importLead._id,
        name: importLead.name,
        url: importLead.url,
        industry: importLead.industry,
        email: importLead.email,
        phone: importLead.phone,
        category: importLead.category,
        description: importLead.description,
      })
    }

    const inputs = []
    for (const input of data) {
      inputs.push({
        'updateOne': {
          'filter': { _id: input._id, registered: {$ne: true}},
          'update': input,
          'upsert': true,
        },
      })
    }

    try {
      await Lead.bulkWrite(inputs, { ordered: false })
    } catch (e) {
      // empty
    }

  } catch (e) {
    console.log(e)
  }

  console.log('done')
}

