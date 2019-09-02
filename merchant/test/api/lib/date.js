import test from 'ava'

import {timeRangeToHourDuration} from '../../../src/api/lib/date'

test('timeRangeToHourDuration', t => {
  t.is(timeRangeToHourDuration('10:00', '19:00'), 9)
  t.is(timeRangeToHourDuration('10:00', '翌日1:00'), 15)
  t.is(timeRangeToHourDuration('10:00', '10:30'), 0.5)
})
