export {}
const config = require('config')

const linebot = require('axios').create({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + config.get('linebot.bearer'),
  },
  baseURL: 'https://api.line.me/v2/bot',
})

const linemsg = 'linemsg'

module.exports = {
  linebot,
  linemsg,
}
