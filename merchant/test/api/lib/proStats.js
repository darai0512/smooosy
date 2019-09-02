const test = require('ava')
const moment = require('moment')
const proStats = require('../../../src/api/lib/proStats')

test('calculate', async t => {
  const { meetHourly, hiredMeetHourly, hiredMeetFixed,
          receivedRequest, transactionLimited,
          transactionLimitedThreeMonthsAgo, received, meets, transactions,
          hired, hiredPrice, chargePrice,
  } = makeFixtures()

  const allTimeStats = proStats.calculate({
    receive: received,
    meets: meets,
    transactions: transactions,
  })

  t.is(allTimeStats.receiveCount, received.length + meets.length)
  t.is(allTimeStats.meetsCount, meets.length)
  t.is(
    allTimeStats.meetRate,
    meets.length / (meets.length + received.length),
  )
  t.is(allTimeStats.hiredCount, hired.length)
  t.is(allTimeStats.hiredRate, hired.length / meets.length)
  t.is(allTimeStats.hiredPrice, hiredPrice)
  t.is(allTimeStats.chargePrice, chargePrice)
  t.is(allTimeStats.returnOnInvestment, hiredPrice / chargePrice)
  t.is(
    allTimeStats.limitedPoint, transactionLimited.point + transactionLimitedThreeMonthsAgo.point,
  )

  const receivedWithinMonth = [ receivedRequest ]
  const meetsWithinMonth = [ meetHourly, hiredMeetHourly, hiredMeetFixed ]
  const hiredWithinMonth = [
    hiredMeetHourly,
    hiredMeetFixed,
  ]
  const hiredPriceWithinMonth = hiredMeetHourly.price * 5 + hiredMeetFixed.price
  const chargePriceWithinMonth = transactionLimited.price

  const oneMonthStats = proStats.calculate({
    receive: received,
    meets: meets,
    transactions: transactions,
    filter: d => moment(d) >= moment().subtract(1, 'months'),
  })

  t.is(oneMonthStats.receiveCount, receivedWithinMonth.length + meetsWithinMonth.length)
  t.is(oneMonthStats.meetsCount, meetsWithinMonth.length)
  t.is(
    oneMonthStats.meetRate,
    meetsWithinMonth.length / (meetsWithinMonth.length + receivedWithinMonth.length),
  )
  t.is(oneMonthStats.hiredCount, hiredWithinMonth.length)
  t.is(oneMonthStats.hiredRate, hiredWithinMonth.length / meetsWithinMonth.length)
  t.is(oneMonthStats.hiredPrice, hiredPriceWithinMonth)
  t.is(oneMonthStats.chargePrice, chargePriceWithinMonth)
  t.is(oneMonthStats.returnOnInvestment, hiredPriceWithinMonth / chargePriceWithinMonth)
  t.is(oneMonthStats.limitedPoint, transactionLimited.point)
})

test('calculateByService', t => {
  const { received, meets, transactions } = makeFixtures()

  const today = new Date()
  const oneMonthAgo = today.setMonth(today.getMonth() - 1)
  const threeMonthsAgo = today.setMonth(today.getMonth() - 3)

  const byService = proStats.calculateByService({
    receive: received,
    meets,
    transactions,
    lookbackDateMap: {
      last1Month: oneMonthAgo,
      last3Months: threeMonthsAgo,
    },
  })

  const cleaningLast1Month = findDate(byService.cleaning.byLookbackDate, 'last1Month')
  const cleaningLast3Months = findDate(byService.cleaning.byLookbackDate, 'last3Months')

  t.is(byService.cleaning.service, 'cleaning')

  t.is(cleaningLast1Month.receiveCount, 1)
  t.is(cleaningLast1Month.meetsCount, 1)
  t.is(cleaningLast1Month.hiredCount, 0)
  t.is(cleaningLast1Month.hiredRate, 0)
  t.is(cleaningLast1Month.meetRate, 1)
  t.is(cleaningLast1Month.hiredPrice, 0)
  t.is(cleaningLast3Months.receiveCount, 1)
  t.is(cleaningLast3Months.meetsCount, 1)
  t.is(cleaningLast3Months.hiredCount, 0)
  t.is(cleaningLast3Months.hiredRate, 0)
  t.is(cleaningLast3Months.meetRate, 1)
  t.is(cleaningLast3Months.hiredPrice, 0)

  const photographyLast1Month = findDate(byService.photography.byLookbackDate, 'last1Month')
  const photographyLast3Months = findDate(byService.photography.byLookbackDate, 'last3Months')

  t.is(byService.photography.service, 'photography')

  t.is(photographyLast1Month.receiveCount, 3)
  t.is(photographyLast1Month.meetsCount, 2)
  t.is(photographyLast1Month.hiredCount, 2)
  t.is(photographyLast1Month.hiredRate, 2/2)
  t.is(photographyLast1Month.meetRate, 2/3)
  t.is(photographyLast1Month.hiredPrice, 75000)
  t.is(photographyLast3Months.receiveCount, 5)
  t.is(photographyLast3Months.meetsCount, 3)
  t.is(photographyLast3Months.hiredCount, 3)
  t.is(photographyLast3Months.hiredRate, 3/3)
  t.is(photographyLast3Months.meetRate, 3/5)
  t.is(photographyLast3Months.hiredPrice, 75000)
})

function findDate(byLookbackDate, date) {
  return byLookbackDate.find(s => s.lookbackDate === date)
}

function makeFixtures() {
  const now = moment().toISOString()
  const oneDayAgo = moment().subtract(1, 'days').toISOString()
  const threeMonthsAgo = moment().subtract(3, 'months').toISOString()
  const threeMonthsPlusOneDayAgo = moment()
    .subtract(3, 'months').add(1, 'days').toISOString()

  const meetHourly = {
    createdAt: oneDayAgo,
    priceType: 'hourly',
    price: 5000,
    service: 'cleaning',
  }

  const hiredMeetHourly = {
    createdAt: oneDayAgo,
    hiredAt: now,
    priceType: 'hourly',
    price: 5000,
    service: 'photography',
  }

  const hiredMeetFixed = {
    createdAt: oneDayAgo,
    status: 'progress',
    priceType: 'fixed',
    price: 50000,
    service: 'photography',
  }

  const hiredMeetFixedThreeMonthsAgo = {
    createdAt: threeMonthsAgo,
    hiredAt: threeMonthsPlusOneDayAgo,
    priceType: 'fixed',
    price: 50000,
    service: 'accounting',
  }

  const hiredMeetHourlyNonFixedThreeMonthsAgo = {
    createdAt: threeMonthsAgo,
    status: 'done',
    priceType: 'daily',
    price: 15000,
    service: 'photography',
  }

  const receivedRequest = {
    createdAt: oneDayAgo,
    service: 'photography',
  }

  const receivedRequestThreeMonthsAgo = {
    createdAt: threeMonthsAgo,
    service: 'photography',
  }

  const transaction = {
    createdAt: oneDayAgo,
    point: 5,
  }

  const transactionLimited = {
    createdAt: oneDayAgo,
    price: 1400,
    point: 10,
    type: 'limited',
  }

  const transactionLimitedThreeMonthsAgo = {
    createdAt: threeMonthsAgo,
    price: 1200,
    point: 10,
    type: 'limited',
  }

  const received = [ receivedRequest, receivedRequestThreeMonthsAgo ]
  const meets = [ meetHourly, hiredMeetHourly, hiredMeetFixed, hiredMeetFixedThreeMonthsAgo, hiredMeetHourlyNonFixedThreeMonthsAgo ]
  const transactions = [ transaction, transactionLimited, transactionLimitedThreeMonthsAgo ]
  const hired = [
    hiredMeetHourly,
    hiredMeetFixed,
    hiredMeetFixedThreeMonthsAgo, hiredMeetHourlyNonFixedThreeMonthsAgo,
  ]
  const hiredPrice = hiredMeetHourly.price * 5 + hiredMeetFixed.price + hiredMeetFixedThreeMonthsAgo.price
  const chargePrice = transactionLimited.price + transactionLimitedThreeMonthsAgo.price

  return { meetHourly, hiredMeetHourly, hiredMeetFixed,
    receivedRequest, transactionLimited,
    transactionLimitedThreeMonthsAgo, received, meets, transactions,
    hired, hiredPrice, chargePrice,
  }
}