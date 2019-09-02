const moment = require('moment')

// default sort
export function sortWithMatchMoreAndIsExactMatch(a, b, filters) {
  // date-match based sort order:
  // 1). Request with single/multiple dates, match
  // 2). Request with single/multiple dates, other dates ok, or no calendar
  if (filters && filters.dates.length > 0) {
    const { isExactDateMatch: isAExactDateMatch } = dateMatchInfo(a, filters.dates)
    const { isExactDateMatch: isBExactDateMatch } = dateMatchInfo(b, filters.dates)

    if (isAExactDateMatch ^ isBExactDateMatch) {
      return Number(isBExactDateMatch) - Number(isAExactDateMatch)
    }

    // if neither request exact matches on dates, sort by other comparisons
  }

  // match-more requests should be upper with createdAt desc
  if (a.meetId || b.meetId) {
    return !!b.meetId - !!a.meetId // desc with boolean
  }

  // isExactMatch requests should be middle with createdAt desc
  if (a.isExactMatch || b.isExactMatch) {
    return !!b.isExactMatch - !!a.isExactMatch //desc with boolean
  }

  if (!filters) {
    return 0
  }

  // other requests should be bottom with createdAt desc
  return 0
}

export function dateMatchInfo(request, matchDates) {
  const dateQuestions = request.description.filter(d => d.type === 'calendar')

  const dates = dateQuestions.reduce((arr, q) => {
    return arr.concat(q.answers.filter(a => !!a.date).map(a => moment(a.date)))
  }, []) || []

  const allowsOtherDates = !!dateQuestions.find(q => {
    return q.answers.find(a => a.text && a.text === '他の日時でも可')
  })

  if (!matchDates.length) {
    return { isDateMatch: true, isExactDateMatch: true }
  }

  if (dates.length && dates.find(a =>
    matchDates.find(fd => moment(fd.date).isSame(a, 'day')))) {
    return { isDateMatch: true, isExactDateMatch: true }
  } else if (allowsOtherDates || !dates.length) {
    return { isDateMatch: true, isExactDateMatch: false }
  }

  return { isDateMatch: false, isExactDateMatch: false }
}

export function requestMatchesFilters(request, filters) {
  if (!filters) {
    return true
  }

  if (filters.distance && request.distance && request.distance > filters.distance) {
    return false
  }

  const { isDateMatch } = dateMatchInfo(request, filters.dates)

  if (!isDateMatch) {
    return false
  }

  if (filters.serviceIds.length > 0 && !filters.serviceIds.includes(request.service._id)) {
    return false
  }

  return true
}
