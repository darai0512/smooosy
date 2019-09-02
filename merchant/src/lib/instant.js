import qs from 'qs'
import moment from 'moment'


/*
* ?serviceId=59099b4de9cea447c050b9ae&zip=1070052&d[59099b4de9cea447c050b9af]=59099b4de9cea447c050b9ac
*/
export function parseQueryParams(search) {
  const query = qs.parse(search, {ignoreQueryPrefix: true})
  query.d = query.d || {}
  query.zip = query.zip || query.defaultZip
  return query
}

export function createDateAnswer({date, start, end}) {
  return {
    date: date ? moment(date).toDate() : null,
    start: start || '',
    end: end || '',
  }
}

export function getDialogInfo({service, d, date, start, end, loc, zipcode, address, prefecture, city, town}) {
  const dialogInfo = {}

  // quetionIdとanswerIdからdialogInfoを作成する
  // フィルター条件を質問時に回答済みにする
  for (let queryId in d) {
    const options = d[queryId]
    // singular, multiple, number
    const query = service.queries.find(q => q._id === queryId)
    if (!query) continue
    const answers = []
    for (let answer of query.options) {
      if (query.type === 'singular') {
        if (answer._id === options) {
          answer.checked = true
        } else {
          delete answer.checked
        }
      } else if (query.type === 'multiple') {
        if (options.find(o => o === answer._id)) {
          answer.checked = true
        } else {
          delete answer.checked
        }
      } else if (query.type === 'number') {
        const option = options.find(o => o._id === answer._id)
        if (option) {
          answer.number = Number(option.number)
        } else {
          answer.number = Number(answer.defaultNumber)
        }
      }

      answers.push(answer)
    }

    dialogInfo[queryId] = answers
  }

  // location
  // 位置カードが２つ以上ある場合は１つめに入るので注意（引っ越し等）
  const queryLocation = service.queries.find(q => q.type === 'location')
  if (queryLocation && loc && zipcode && address && prefecture && city) {
    dialogInfo[queryLocation._id] = []
    dialogInfo[queryLocation._id][0] = {text: address.text}
    dialogInfo[queryLocation._id].location = {
      loc, zipcode, address: address.text, prefecture, city, town,
    }
  }

  // calendar
  const queryCalendar = service.queries.find(q => q.type === 'calendar' && q.usedForPro)
  if (queryCalendar && date) {
    dialogInfo[queryCalendar._id] = [createDateAnswer({date, start, end})]
  }

  return dialogInfo
}

export function formatConditions(d) {
  // convert d to conditions
  const conditions = {}
  for (let [queryId, value] of Object.entries(d || {})) {
    if (Array.isArray(value)) {
      conditions[queryId] = {}
      for (let val of value) {
        if (typeof val === 'string') {
          conditions[queryId][val] = true
        } else {
          conditions[queryId][val._id] = val.number
        }
      }
    } else {
      conditions[queryId] = { [value]: true }
    }
  }
  return conditions
}

const CAR_CATEGORY = '車検・修理'
export function isMatchMoreCampaignService(service) {
  return service.tags[0] === CAR_CATEGORY && service.matchMoreEditable
}
