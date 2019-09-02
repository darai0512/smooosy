export {}
const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: {
    env: process.env.NODE_ENV,
    instanceId: process.env.INSTANCE_ID,
  },
  transports: [
    new transports.Console({}),
  ],
})

module.exports = logger