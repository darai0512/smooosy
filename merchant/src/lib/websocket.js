import io from 'socket.io-client'
import { wsOrigin } from '@smooosy/config'

const ws = {
  socket: null,
  isConnected: false,
  emitStack: [],
  receivers: {},

  init() {
    ws.socket = io(wsOrigin, { rejectUnauthorized: false })

    // ignore connection error
    ws.socket.on('connect_error', () => {})

    ws.socket.on('connect', () => {
      ws.isConnected = true
      ws.socket.on('event', (data) => {
        ws.recieve(data)
      })
      ws.emitStack.map(emit => ws.socket.emit(emit.event, emit.data))
      ws.emitStack = []
      ws.socket.on('reconnect', () => {
        ws.isConnected = true
        ws.emitStack.map(emit => ws.socket.emit(emit.event, emit.data))
        ws.emitStack = []
      })
      ws.socket.on('error', (error) => {
        if (window.rollbar) {
          window.rollbar.error(error)
        }
      })
      ws.socket.on('disconnect', () => {
        ws.isConnected = false
      })
    })

  },

  addReceiver(type, receiver) {
    if (!ws.receivers.hasOwnProperty(type)) {
      ws.receivers[type] = []
    }
    ws.receivers[type].push(receiver)
  },

  removeAllReceiver(type) {
    if (ws.receivers.hasOwnProperty(type)) {
      ws.receivers[type] = []
    }
  },

  recieve(data) {
    if (data && data.type) {
      if (ws.receivers.hasOwnProperty(data.type)) {
        ws.receivers[data.type].map((receiver) => receiver(data))
      }
    }
  },

  send(event, data) {
    if (ws.isConnected) {
      ws.socket.emit(event, data)
    }    else {
      ws.emitStack.push({event, data})
    }
  },

}

export default ws
