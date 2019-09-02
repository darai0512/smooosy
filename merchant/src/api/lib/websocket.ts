export {}
const config = require('config')

const ws = {
  io: null,
  emitStack: [],
  receivers: {},

  init() {
    const socket = require('socket.io')
    ws.io = socket.listen(config.get('websocket.port'))
    const ioRedis = require('socket.io-redis')
    ws.io.adapter(ioRedis({ host: config.get('redis').host, port: config.get('redis').port }))
    ws.io.on('connection', (client) => {
      ws.recieve({type: 'connection', socket_id: client.id})
      client.on('event', (data) => ws.recieve({...data, socket_id: client.id}))
      client.on('disconnect', () => {
        ws.recieve({type: 'disconnect', socket_id: client.id})
      })
    })
    return ws
  },

  addReceiver(type, receiver) {
    if (!ws.receivers.hasOwnProperty(type)) {
      ws.receivers[type] = []
    }
    ws.receivers[type].push(receiver)
  },

  recieve(data) {
    if (data && data.type) {
      if (ws.receivers.hasOwnProperty(data.type)) {
        ws.receivers[data.type].map((receiver) => receiver(data))
      }
    }
  },

  emitAll(data) {
    ws.io.emit('event', data)
  },
}

module.exports = ws
