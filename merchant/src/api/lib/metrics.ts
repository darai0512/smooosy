export {}
// Currently implemented using the `hot-shots` statsd library.

// Make a top-level Metrics object, with context variables added by
// various layers
class Metrics {
  statsdClient: any
  parentContext: any

  constructor({statsdClient, parentContext = {}}) {
    this.statsdClient = statsdClient
    this.parentContext = parentContext
  }

  increment(metric, value = 1, context = {}) {
    this.statsdClient.increment(metric, value, {
      ...this.parentContext, ...context,
    })
  }

  gauge(metric, value, context = {}) {
    this.statsdClient.gauge(metric, value, {
      ...this.parentContext, ...context,
    })
  }

  withContext(context) {
    return new Metrics({
      statsdClient: this.statsdClient,
      parentContext: {...this.parentContext, ...context},
    })
  }
}

class ConsoleLogStatsdClient {
  logger: any
  prefix: any
  globalTags: any
  constructor({ port, prefix, globalTags, logger }) {
    this.logger = logger
    this.prefix = prefix
    this.globalTags = globalTags
    logger.info('initializing console log statsd client', {
      port, prefix, globalTags,
    })
  }

  increment(metric, value = 1, context) {
    this.logger.info('metrics increment', {
      metric: this.prefix + metric,
      value,
      tags: { ...this.globalTags, ...context },
    })
  }

  gauge(metric, value = 1, context) {
    this.logger.info('metrics gauge', {
      metric: this.prefix + metric,
      value,
      tags: { ...this.globalTags, ...context },
    })
  }
}

module.exports = { Metrics, ConsoleLogStatsdClient }