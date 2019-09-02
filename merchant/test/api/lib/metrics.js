const test = require('ava')

const { Metrics } = require('../../../src/api/lib/metrics')

function mockStatsdClient(assertions) {
  return {
    increment: assertions,
    gauge: assertions,
    withContext: assertions,
  }
}

test('metrics.increment', t => {
  const rootContext = { a: 'b' }

  const metric = 'metric'
  const metricValue = 10
  const incrementStatsdClient = mockStatsdClient((m, v, tags) => {
    t.is(m, metric)
    t.is(v, metricValue)
    t.deepEqual(tags, { a: 'c', c: 5 })
  })
  const incrementContext = {
    a: 'c',
    c: 5,
  }

  const metrics = new Metrics({
    statsdClient: incrementStatsdClient, parentContext: rootContext,
  })
  metrics.increment(metric, metricValue, incrementContext)
})

test('metrics.gauge', t => {
  const rootContext = { a: 'b' }

  const gauge = 'gauge'
  const gaugeValue = 50
  const gaugeStatsdClient = mockStatsdClient((m, v, tags) => {
    t.is(m, gauge)
    t.is(v, gaugeValue)
    t.deepEqual(tags, { a: 'b', c: 5 })
  })
  const gaugeContext = {
    c: 5,
  }
  const metrics = new Metrics({
    statsdClient: gaugeStatsdClient, parentContext: rootContext,
  })
  metrics.gauge(gauge, gaugeValue, gaugeContext)
})

test('metrics.withContext', t => {
  const rootContext = { a: 'b' }
  const statsdClient = mockStatsdClient((m, v, tags) => {
    t.deepEqual(tags, { a: 'b', b: 'c', c: 'd' })
  })

  const metricsWithContext = new Metrics({
    statsdClient: statsdClient,
    parentContext: rootContext,
  }).withContext({ b: 'c' })

  metricsWithContext.increment('blah', 10, { c: 'd' })
})
