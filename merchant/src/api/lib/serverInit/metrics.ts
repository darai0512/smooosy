export {}
const config = require('config')
const logger = require('../logger')
const { Metrics, ConsoleLogStatsdClient } = require('../metrics')

function initMetrics({ isTest, isDevelop }) {
  let statsdClient
  const statsdOptions = {
    ...config.get('statsd'),
    logger,
    errorHandler: error => {
      console.error('statsd client error:', error)
    },
  }

  if (isDevelop || isTest) {
    statsdClient = new ConsoleLogStatsdClient(statsdOptions)
  } else {
    const StatsD = require('hot-shots')
    statsdClient = new StatsD(statsdOptions)
  }

  return {
    rootMetrics: new Metrics({ statsdClient }),
  }
}

module.exports = initMetrics