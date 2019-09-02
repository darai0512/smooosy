export {}
const moment = require('moment')
const { ObjectID } = require('mongodb')
const { slack } = require('./util')
const redis = require('./redis')
const qs = require('qs')

let instance

function set(i) {
  instance = i

  return function unset() {
    instance = null
  }
}

function get() {
  if (!instance) {
    throw new Error('MailClient singleton was never set')
  }

  return instance
}

class MailClient {
  client: any
  templates: any
  apiClient: any
  clientIsStubbed: any
  metrics: any
  constructor({mailClient, apiClient, apiKey, templates, clientIsStubbed, metrics}) {
    this.client = mailClient
    this.client.setApiKey(apiKey)
    this.client.setSubstitutionWrappers('#', '#')
    this.templates = templates
    if (apiClient) {
      this.apiClient = apiClient
      this.apiClient.setApiKey(apiKey)
    }
    this.clientIsStubbed = clientIsStubbed
    this.metrics = metrics
  }

  async getTemplate(id) {
    const redisPrefix = 'sgtemplate-'
    const template = await redis.getAsync(redisPrefix + id).then(res => JSON.parse(res)).catch(console.error)
    const oneHourAgo = moment(new Date()).subtract(1, 'h')
    if (template && template.updatedAt && moment(template.updatedAt).isAfter(oneHourAgo)) {
      return Promise.resolve(template)
    }
    return this.request({url: `/v3/templates/${this.templates[id]}`})
      .then(res => {
        res[0].body.updatedAt = moment(new Date())
        try {
          redis.setAsync(redisPrefix + id, JSON.stringify(res[0].body))
        } catch (e) {
          console.error(e)
        }
        return res[0].body
      })
      .catch(err => {
        if (template) return template
        slack({
          message: `SendGrid template取得エラー ${id} ${err.message}`,
          room: 'ops',
        })
        throw new Error(`redisにSendGridテンプレートがありません: ${id}`)
      })
  }

  async deleteTemplateCache(id) {
    const redisPrefix = 'sgtemplate-'
    return await redis.getAsync(redisPrefix + id)
      .then(res => {
        if (!res) {
          return true
        }
        return redis.delAsync(redisPrefix + id)
          .then(res => !!res)
          .catch(console.error)
      })
      .catch(console.error)
  }

  async send({id, from, to, substitutions, subject, html, tracking_settings }) {
    if (!this.templates[id]) {
      throw new Error(`invalid template id: ${id}`)
    }

    // WORKAROUND: substitution文字数制限のためtemplateを取得して自前で埋め込む
    // 関連issue: https://github.com/sendgrid/sendgrid-nodejs/issues/221
    const body = await this.getTemplate(id)

    const template = body.versions.filter(v => v.active)[0]
    if (!template) {
      return Promise.reject(new Error(`SendGridにテンプレートがありません: ${id}`))
    }

    if (/emailNewRequestForLead/.test(id)) {
      substitutions.unsubscribe = '<%asm_group_unsubscribe_raw_url%>'
    }

    subject = subject || template.subject.replace(/#([a-zA-Z_\-]+)#/g, (m, c1) => substitutions[c1])
    html = html || template.html_content.replace(/#([a-zA-Z_\-]+)#/g, (m, c1) => substitutions[c1] || substitutions[c1 + 'HTML'])
    const text = template.plain_content.replace(/#([a-zA-Z_\-]+)#/g, (m, c1) => substitutions[c1] || substitutions[c1 + 'Text'])
      .replace(/https:\/\/smooosy\.com\s/g, '') // ロゴのリンク削除
      .replace(/<img[^>]+>/g, '') // imgタグ削除
      .replace(/http([^\s]+)/g, '\n~~~~~~~~~~~~~~~~~~~\nhttp$1\n~~~~~~~~~~~~~~~~~~~')
      .replace(/お問い合わせ\smailto[^株]+/, 'お問い合わせ: info@smooosy.biz\n')

    const send = (address) => {
      const personalizations = []
      address = Array.isArray(address) ? address : [address]
      for (const add of address) {
        personalizations.push({
          to: add,
          custom_args: {
            mailLogId: new ObjectID(),
          },
        })
      }
      const params: any = {
        personalizations,
        from: `=?UTF-8?B?${Buffer.from('SMOOOSY').toString('base64')}?= <${from || 'no-reply@smooosy.com'}>`,
        subject,
        html,
        text,
        //templateId: this.templates[id],
        //substitutions,
        ipPoolName: 'transactional',
        categories: ['transactional', id, process.env.NODE_ENV || 'development'],
        tracking_settings,
      }
      if (/emailNewRequestForLead/.test(id)) {
        params.asm = { group_id: 5223 }
      }

      if (process.env.NODE_ENV === 'test') {
        console.warn('[SendGrid send]', id, address)
        return Promise.resolve(params)
      }

      return this.client
        .send(params)
        .then(() => {
          this.metrics.increment('mail.send.success', 1, {
            trackPath: id,
          })

          return params
        })
        .catch((err) => {
          this.metrics.increment('mail.send.error', 1, {
            trackPath: id,
          })

          // TODO: parse error and return it upstream in an easier to parse format
          throw err
        })
    }

    // 複数送信は上限1000アドレス
    // https://sendgrid.kke.co.jp/docs/API_Reference/Web_API_v3/Mail/index.html#-Limitations
    if (Array.isArray(to) && to.length > 1000) {
      const post = i => {
        const slice = to.slice(1000 * i, 1000 * (i + 1))
        if (slice.length === 0) return Promise.resolve()

        return send(slice).then(() => {
          return post(i + 1)
        })
      }
      return post(0)
    }

    return send(to)
  }

  async sendPrerendered({id, from, to, substitutions, subject, html, tracking_settings, categories = []}) {
    if (/emailNewRequestForLead/.test(id)) {
      substitutions.unsubscribe = '<%asm_group_unsubscribe_raw_url%>'
    }

    const send = (address) => {
      const personalizations = []
      address = Array.isArray(address) ? address : [address]
      for (const add of address) {
        personalizations.push({
          to: add,
          custom_args: {
            mailLogId: new ObjectID(),
          },
        })
      }
      const params: any = {
        personalizations,
        from: `=?UTF-8?B?${Buffer.from('SMOOOSY').toString('base64')}?= <${from || 'no-reply@smooosy.com'}>`,
        subject,
        html,
        ipPoolName: 'transactional',
        categories: ['transactional', id, process.env.NODE_ENV || 'development', ...categories],
        tracking_settings,
      }
      if (/emailNewRequestForLead/.test(id)) {
        params.asm = { group_id: 5223 }
      }

      if (process.env.NODE_ENV === 'test' && !this.clientIsStubbed) {
        console.warn('[SendGrid send]', id, address)
        return Promise.resolve(params)
      }

      return this.client
        .send(params)
        .then(() => {
          this.metrics.increment('mail.send.success', 1, {
            trackPath: id,
          })

          return params
        })
        .catch((err) => {
          this.metrics.increment('mail.send.error', 1, {
            trackPath: id,
          })

          // TODO: parse error and return it upstream in an easier to parse format
          throw err
        })
    }

    // 複数送信は上限1000アドレス
    // https://sendgrid.kke.co.jp/docs/API_Reference/Web_API_v3/Mail/index.html#-Limitations
    if (Array.isArray(to) && to.length > 1000) {
      const post = i => {
        const slice = to.slice(1000 * i, 1000 * (i + 1))
        if (slice.length === 0) return Promise.resolve()

        return send(slice).then(() => {
          return post(i + 1)
        })
      }
      return post(0)
    }

    return send(to)
  }

  search(params) {
    const req = {
      method: 'GET',
      url: `/v3/contactdb/recipients/search?${qs.stringify(params)}`,
    }

    return this.request(req)
  }

  delete(id) {
    const req = {
      method: 'DELETE',
      url: `/v3/contactdb/recipients/${id}`,
    }

    if (process.env.NODE_ENV !== 'production') {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('========= SendGrid API ============')
        console.warn(req)
        console.warn('============================')
      }
      return Promise.resolve([])
    }

    return this.request(req)
  }

  deleteAll(ids) {
    const req = {
      method: 'DELETE',
      url: '/v3/contactdb/recipients',
      body: ids,
    }

    if (process.env.NODE_ENV !== 'production') {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('========= Send Grid API ============')
        console.warn(req)
        console.warn('============================')
      }
      return Promise.resolve([])
    }

    return this.request(req)
  }

  request(req) {
    if (!this.apiClient) throw new Error('please initialize with apiClient.')

    return this.apiClient.request(req)
  }

}

module.exports = {
  MailClient,
  set,
  get,
}
