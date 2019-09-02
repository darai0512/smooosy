import React from 'react'
import ReactGA from 'react-ga'

const sendGA = (e, gaEvent) => {
  // 左クリックのみ
  if (e.button !== 0) return
  ReactGA.event({category: 'tellink', action: gaEvent.action, label: gaEvent.id })
}

const TelLink = ({phone, gaEvent}) => (
  !/[0-9\-]+/.test(phone) ?
    <span>{phone}</span>
  : window.callCenter ?
    <a onClick={() => window.callCenter(phone)}>{phone}</a>
  : window.ga && gaEvent ?
    <a href={`tel:${phone}`} onMouseDown={(e) => sendGA(e, gaEvent)}>{phone}</a>
  :
    <a href={`tel:${phone}`}>{phone}</a>
)

export default TelLink
