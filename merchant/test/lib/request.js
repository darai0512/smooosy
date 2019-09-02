const test = require('ava')
const {
  sortWithMatchMoreAndIsExactMatch,
  requestMatchesFilters,
} = require('../../src/lib/request')

test('sortWithMatchMoreAndIsExactMatch', t => {
  const requests = [
    { _id: 1 },
    { _id: 2, isExactMatch: true }, // will be 4th position
    { _id: 3 },
    { _id: 4, isExactMatch: false }, // will be current position
    { _id: 5 },
    { _id: 6, isExactMatch: false, meetId: 1 }, // will be 1st position
    { _id: 7 },
    { _id: 8, meetId: 2 }, // will be 2nd position
    { _id: 9, isExactMatch: true, meetId: 2 }, // will be 3rd position
    { _id: 10 },
  ]

  requests.sort(sortWithMatchMoreAndIsExactMatch)

  const expectedOrder = [ 6, 8, 9, 2, 1, 3, 4, 5, 7, 10 ]
  const actualOrder = requests.map(r => r._id)

  t.deepEqual(actualOrder, expectedOrder)
})

test('sortWithMatchMoreAndIsExactMatch with date filters', t => {
  // cases:
  // dates: none
  // dates: match, other dates: yes
  // dates: no match, other dates: yes
  // dates: match, other dates: no
  // dates: no match, other dates: no

  const requests = [
    { _id: 1, description: [] },
    { _id: 2, description: makeDescription(new Date('09/06/2019'), true) },
    { _id: 3, description: makeDescription(new Date('09/07/2019'), true) },
    { _id: 4, description: makeDescription(new Date('09/06/2019'), false) },
    { _id: 5, description: makeDescription(new Date('09/07/2019'), false) },
  ]

  requests.sort((a, b) => {
    return sortWithMatchMoreAndIsExactMatch(a, b, {
      dates: [ { date: new Date('09/06/2019') } ],
    })
  })

  const expectedOrder = [ 2, 4, 1, 3, 5 ]
  const actualOrder = requests.map(r => r._id)

  t.deepEqual(actualOrder, expectedOrder)
})

function makeDescription(date, otherDatesAllowed) {
  return [{
    type: 'calendar',
    answers: [{
      date,
    }, {
      text: otherDatesAllowed ? '他の日時でも可' : '他の日時は不可',
    }],
  }]
}

test('requestMatchesFilters', t => {
  const request = {
    description: makeDescription(new Date('09/06/2019'), false),
    distance: 5000,
    service: { _id: 1 },
  }

  t.true(requestMatchesFilters(request, null), 'no filters matches all requests')
  t.true(requestMatchesFilters(request, { serviceIds: [ 1 ], dates: [ { date: new Date('09/06/2019') } ], distance: 6000 }), 'match all filters')
  t.false(requestMatchesFilters(request, { dates: [], distance: 2000, serviceIds: [] }), 'distance filter mismatch')
  t.false(requestMatchesFilters(request, { dates: [], serviceIds: [ 2, 3 ] }), 'service filter mismatch')
  t.false(requestMatchesFilters(request, { dates: [ new Date('09/07/2019') ], serviceIds: [] }), 'date filter mismatch')
})