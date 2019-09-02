const getPort = require('get-port')

module.exports = {
  port: getPort,
  websocket: {
    port: 9000,
  },
  mongodb: {
    uri: `mongodb://localhost:27017/${process.env.MONGO_DB_NAME}-test`,
  },
  payment: {
    secret: 'dummysecret',
  },
  intercom: {
    secretKey: 'dummykey',
    accessToken: 'dummytoken',
  },
  twilio: {
    authToken: 'dummytoken',
  },
  sendgrid: {
    apiKey: '',
    templateIdToSendGridUuid: {
      'emailReviewRequest': 'uuid',
    },
  },
  wordpress: {
    username: 'dummy',
    password: '',
  },
  sitemap: {
    path: '/tmp',
  },
}
