export {}
const config = require('config')
const redis = process.env.NODE_ENV === 'test' ? require('fakeredis') : require('redis')
const util = require('util')
const client = redis.createClient(config.get('redis'))
// promisifyAll
for (const key in client) {
  if (typeof client[key] === 'function') {
    client[key+'Async'] = util.promisify(client[key])
  }
}
const { slack } = require('./util')

// error時イベント
client.on('error', (err) => {
  console.trace(err)
  const message = `Redis Exception: ${err.name || 'Unknown'}\n\n${err.message}\n${err.stack}`
  slack({message, room: 'ops'})
})

// 接続切断時イベント
client.on('end', () => {
  const message = 'Redis Connection Closed'
  slack({message, room: 'ops'})
})

// 再接続時イベント
client.on('reconnecting', () => {
  const message = 'Redis Connection Reconnected'
  slack({message, room: 'ops'})
})

module.exports = client
