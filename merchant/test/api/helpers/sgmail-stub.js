const testutil = require('./testutil')

class SgMailStub {
  constructor(templates) {
    this.templates = templates || {}
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey
  }

  setSubstitutionWrappers() {}

  send({from, personalizations, html, subject}) {
    testutil.requiredParam(from, 'from')
    testutil.requiredParam(personalizations, 'personalizations')
    testutil.requiredParam(personalizations[0].to, 'personalizations[0].to')
    testutil.requiredParam(subject, 'subject')
    testutil.requiredParam(html, 'html')

    if (!this.apiKey) {
      return Promise.reject(new Error('api key was never set'))
    }

    return Promise.resolve({
      subject,
      html,
    })
  }
}

class SgApiStub {
  constructor(templates) {
    this.templates = templates || {}
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey
  }

  request({url}) {
    if (!this.apiKey) {
      return Promise.reject(new Error('api key was never set'))
    }

    const templateId = url.split('/')[3]
    const template = this.templates[templateId]
    if (!template) {
      return Promise.resolve([
        {
          body: {
            versions: [],
          },
        },
      ])
    }
    template.active = true
    return Promise.resolve([
      {
        body: {
          versions: [ template ],
        },
      },
    ])
  }
}


module.exports = {
  SgMailStub,
  SgApiStub,
}
