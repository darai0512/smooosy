const { timeRangeToHourDuration } = require('../../../src/api/lib/date')

test('timeRangeToHourDuration', () => {
  expect(timeRangeToHourDuration('10:00', '19:00')).toBe(9)
  expect(timeRangeToHourDuration('10:00', '翌日1:00')).toBe(15)
  expect(timeRangeToHourDuration('10:00', '10:30')).toBe(0.5)
})
