import React from 'react'
import moment from 'moment'
import { timeNumbers } from '@smooosy/config'

export default class CountDown extends React.Component {
  static defaultProps = {
    start: new Date(),
    hour: timeNumbers.requestExpireHour,
    style: {},
    prefix: '残り',
    includeSecond: false,
    lineBreak: false,
  }

  UNSAFE_componentWillMount() {
    this.start(this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.start(nextProps)
  }

  start = (props) => {
    const { start, hour } = props
    this.setState({
      limit: moment(start).add(hour, 'hours'),
      now: moment(),
    })

    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.setState({now: moment()})
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
    this.interval = null
  }

  render () {
    const { limit, now } = this.state
    const { style, prefix, includeSecond, lineBreak } = this.props

    if (now.isAfter(limit)) {
      clearInterval(this.interval)
      this.interval = null
      return <span style={style}>期限切れ</span>
    }

    const diff = limit.diff(now, 'seconds')
    const diffHours = Math.floor(diff / (60 * 60))
    const diffMinutes = Math.floor((diff % (60 * 60)) / 60)
    const diffSeconds = diff % 60

    const hour = diffHours > 0 ? `0${diffHours}`.slice(-2) + '時間' : ''
    const min = `0${diffMinutes}`.slice(-2) + '分'
    const second = includeSecond ? `0${diffSeconds}`.slice(-2) + '秒' : ''

    if (lineBreak) {
      return <div style={style}><p>{prefix}{hour}</p><p>{min}{second}</p></div>
    }
    return <span style={style}>{prefix}{hour}{min}{second}</span>
  }
}
