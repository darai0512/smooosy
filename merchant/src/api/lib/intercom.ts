export {}
const Intercom = require('intercom-client')
const config = require('config')

const client = new Intercom.Client({ token: config.get('intercom.accessToken') })

module.exports = client
