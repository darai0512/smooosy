export {}
const moment = require('moment')

function calculate({ receive = [], meets = [], transactions = [], filter = () => true }: {receive: any[], meets: any[], transactions: any[], filter: (x: any) => any}) {
  meets = meets.filter(m => filter(m.createdAt))
  receive = receive.filter(r => filter(r.createdAt))
  const hired = meets.filter(m => filter(m.createdAt) && (m.hiredAt || ['progress', 'done'].includes(m.status)))
  transactions = transactions.filter(t => filter(t.createdAt))

  const meetsCount = meets.length
  const receiveCount = receive.length + meets.length

  const meetRate = receiveCount ? (meetsCount / receiveCount) : 0

  const hiredCount = hired.length
  const hiredRate = meetsCount ? hiredCount / meetsCount : 0
  const hiredPrice = hired.reduce((sum, m) => sum + (m.priceType === 'fixed' ? m.price : m.priceType === 'hourly' ? m.price * 5 : 0), 0)

  const chargePrice = transactions.reduce((sum, t) => sum + (t.price || 0), 0)
  const returnOnInvestment = chargePrice ? hiredPrice / chargePrice : 0
  const limitedPoint = transactions.reduce((sum, t) => sum + (t.type === 'limited' ? t.point : 0), 0)

  return {
    receiveCount, meetsCount, meetRate, hiredCount, hiredRate, hiredPrice, chargePrice, returnOnInvestment, limitedPoint,
  }
}

function calculateByService({ receive, meets, lookbackDateMap }) {
  const meetsByService = groupByService(meets)
  const receiveByService = groupByService(receive)

  const byService = {}

  const allServices = [...(new Set(
    Object.keys(receiveByService).concat(Object.keys(meetsByService)),
  ))]

  allServices.forEach(service => {
    byService[service] = {
      service: service,
      byLookbackDate: [],
    }

    Object.keys(lookbackDateMap).forEach(dateName => {
      const result: any = calculate({
        receive: receiveByService[service],
        meets: meetsByService[service],
        filter: d => moment(d) >= moment(lookbackDateMap[dateName]),
      } as any)
      result.lookbackDate = dateName
      byService[service].byLookbackDate.push(result)
    })
  })

  return byService
}

function groupByService(meets) {
  const byService = {}

  meets.forEach(m => {
    if (!byService[m.service]) {
      byService[m.service] = []
    }

    byService[m.service].push(m)
  })

  return byService
}

module.exports = { calculate, calculateByService }