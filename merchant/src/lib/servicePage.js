import qs from 'qs'
import moment from 'moment'

export function getActionURL({ location, service, zip, defaultZip, pos, dateTime }) {
  const params = {}

  if (service.matchMoreEnabled) {
    if (dateTime && dateTime.date) {
      params.date = moment(dateTime.date).format('YYYY-MM-DD')
      params.start = dateTime.start
    }

    params.zip = zip
    params.defaultZip = defaultZip
    params.serviceId = service.id

    return `/instant-results?${qs.stringify(params)}`
  }

  const currentPath = location.pathname.replace(/^\/amp\//, '/')

  params.modal = true
  params.zip = zip
  params.source = 'zipbox'
  params.pos = pos

  return `${currentPath}?${qs.stringify(params)}`
}