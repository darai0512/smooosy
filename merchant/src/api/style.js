const fs = require('fs')

const globalStyle = `${fs.readFileSync(__dirname + '/../static/css/globalStyle.css', 'UTF-8')}`.replace(/[\n\s]{2,}/g, ' ')

const wpStyle =`${fs.readFileSync(__dirname + '/../static/css/wpStyle.css', 'UTF-8')}`.replace(/[\n\s]{2,}/g, ' ')

const ssrStyle = `${fs.readFileSync(__dirname + '/../static/css/ssrStyle.css', 'UTF-8')}`.replace(/[\n\s]{2,}/g, ' ')

module.exports = {
  globalStyle,
  wpStyle,
  ssrStyle,
}