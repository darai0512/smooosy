import React from 'react'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { create as createSchedule, remove as removeSchedule } from 'modules/schedule'
import { Table, TableBody, TableRow, TableCell, Tooltip } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme, withStyles } from '@material-ui/core/styles'

@withWidth()
@connect(
  state => ({
    bookings: state.schedule.schedules.filter(s => s.type !== 'block'),
    blocks: state.schedule.schedules.filter(s => s.type === 'block' && !s.recurrence),
    recurrences: state.schedule.schedules.filter(s => s.type === 'block' && s.recurrence),
  }),
  { createSchedule, removeSchedule }
)
@withTheme
@withStyles({
  joint: {
    colspan: 3,
  },
})
@withRouter
export default class Calendar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hoverWeek: -1,
    }
  }

  addSchedule = (hour) => {
    const startTime = hour.clone().toDate()
    const endTime = hour.clone().endOf('hour').toDate()
    this.props.createSchedule([{
      type: 'block',
      startTime,
      endTime,
    }]).then(() => this.props.load())
  }

  removeSchedule = (schedule) => {
    this.props.removeSchedule([schedule.id]).then(() => this.props.load())
  }

  toggleHour = (hour) => {
    const { weekStart } = this.props
    const scheduleInWeek = this.scheduleInWeek('block')
    const blank = []
    const ids = []
    for (let i in scheduleInWeek) {
      const week = scheduleInWeek[i]
      const targetHour = weekStart.clone().add(i * 24 + hour, 'hours')
      if (targetHour.isBefore(moment())) {
        continue
      } else if (week[hour]) {
        ids.push(week[hour].id)
      } else {
        blank.push(targetHour)
      }
    }

    if (blank.length) {
      this.props.createSchedule(blank.map(hour => {
        const startTime = hour.clone().toDate()
        const endTime = hour.clone().endOf('hour').toDate()
        return {
          type: 'block',
          startTime,
          endTime,
        }
      })).then(() => this.props.load())
    } else if (ids.length) {
      this.props.removeSchedule(ids).then(() => this.props.load())
    }
  }

  toggleWeek = (week) => {
    const { weekStart } = this.props
    const targetWeek = this.scheduleInWeek('block')[week]
    const blank = []
    const ids = []
    for (let i = 0; i < 24; i++) {
      const targetHour = weekStart.clone().add(week * 24 + i, 'hours')
      if (targetHour.isBefore(moment())) {
        continue
      } else if (targetWeek[i]) {
        ids.push(targetWeek[i].id)
      } else {
        blank.push(targetHour)
      }
    }

    if (blank.length) {
      this.props.createSchedule(blank.map(hour => {
        const startTime = hour.clone().toDate()
        const endTime = hour.clone().endOf('hour').toDate()
        return {
          type: 'block',
          startTime,
          endTime,
        }
      })).then(() => this.props.load())
    } else if (ids.length) {
      this.props.removeSchedule(ids).then(() => this.props.load())
    }
  }

  scheduleInWeek = (type) => {
    const { bookings, blocks, recurrences } = this.props

    const scheduleInWeek = [...Array(7)].map(() => [])
    for (let schedule of blocks) {
      const week = moment(schedule.startTime).day()
      const hour = moment(schedule.startTime).hour()
      if (!scheduleInWeek[week]) continue
      scheduleInWeek[week][hour] = schedule
    }
    if (type === 'block') return scheduleInWeek

    for (let schedule of recurrences) {
      const week = moment(schedule.startTime).day()
      const hour = moment(schedule.startTime).hour()
      if (!scheduleInWeek[week]) continue
      const endWeek = moment(schedule.endTime).day()
      const endHour = moment(schedule.endTime).hour()
      if (week === endWeek) {
        for (let h = hour; h <= endHour; h++) scheduleInWeek[week][h] = schedule
      } else {
        for (let h = hour; h < 24; h++) scheduleInWeek[week][h] = schedule
        for (let h = 0; h <= endHour; h++) scheduleInWeek[endWeek][h] = schedule
      }
    }

    for (let schedule of bookings) {
      const week = moment(schedule.startTime).day()
      const hour = moment(schedule.startTime).hour()
      if (!scheduleInWeek[week]) continue
      scheduleInWeek[week][hour] = schedule
      if (schedule.type === 'job' && moment(schedule.startTime).minutes() == 30) {
        scheduleInWeek[week][hour + 1] = schedule
      }
    }
    return scheduleInWeek
  }

  calculateDayStart() {
    if (typeof this.state.dayStart === 'number') {
      return this.state.dayStart
    } else if (typeof this.props.dayStart === 'number') {
      return Math.min(this.props.dayStart, 7)
    }

    return 7
  }

  render() {
    const { weekStart, width, theme } = this.props
    const { common, grey, blue, secondary } = theme.palette

    const dayStart = this.calculateDayStart()

    const styles = {
      root: {
      },
      table: {
        borderTop: `1px solid ${grey[300]}`,
        borderRight: `1px solid ${grey[300]}`,
        background: common.white,
        tableLayout: 'fixed',
        borderCollapse: 'unset',
      },
      week: {
        borderLeft: `1px solid ${grey[300]}`,
        textAlign: 'center',
        padding: 5,
      },
      time: {
        borderLeft: `1px solid ${grey[300]}`,
        textAlign: 'right',
        padding: '2px 5px',
        overflow: 'inherit',
        whiteSpace: 'inherit',
        textOverflow: 'inherit',
      },
      column: {
        borderLeft: `1px solid ${grey[300]}`,
        padding: 0,
      },
      badgeStyle: {
        background: common.white,
        borderRadius: 0,
        width: 18,
        height: 15,
      },
      header: {
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        borderLeft: `1px solid ${grey[300]}`,
        borderRight: `1px solid ${grey[300]}`,
      },
      legends: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      legend: {
        width: 20,
        height: 20,
        border: `1px solid ${grey[300]}`,
      },
    }

    const scheduleInWeek = this.scheduleInWeek()

    return (
      <div style={styles.root}>
        <Helmet>
          <style>{width !== 'xs' && `
            .column:hover,
            .time:hover,
            .time:hover ~ .column,
            .week:hover,
            .column${this.state.hoverWeek} {
              box-shadow: inset 0 0 100px 100px ${blue[50]};
            }
          `}</style>
        </Helmet>
        <div style={styles.header}>
          <div style={styles.legends}>
            <div style={styles.legend} />
            <p style={{margin: 10}}>空き</p>
            <div style={{...styles.legend, background: blue[100]}} />
            <p style={{margin: 10}}>ブロック</p>
            <div style={{...styles.legend, background: blue.A200}} />
            <p style={{margin: 10}}>予約</p>
          </div>
          <div style={{textAlign: 'center', paddingBottom: 5}}>仕事が入っている日時をクリックしてブロックしましょう</div>
        </div>
        <Table style={styles.table}>
          <TableBody>
            <TableRow>
              <TableCell style={{...styles.week, width: 50}} />
              {[...Array(7)].map((_, week) => {
                const day = weekStart.clone().add(week, 'days')
                const disableClick = day.isBefore(moment(), 'day')
                return (
                  <Tooltip
                    key={week}
                    disableHoverListener={disableClick}
                    disableFocusListener={disableClick}
                    title={
                      <div style={{textAlign: 'center', fontSize: 13}}>
                        <div>日付をクリックすると</div>
                        <div>終日ブロックできます</div>
                      </div>
                    }
                  >
                    <TableCell
                      className={disableClick ? '' : 'week'}
                      onMouseOver={() => this.setState({hoverWeek: week})}
                      onMouseOut={() => this.setState({hoverWeek: -1})}
                      onClick={() => this.toggleWeek(week)}
                      style={{
                        ...styles.week,
                        color: day.isSame(moment(), 'day') ? secondary.main : disableClick ? grey[500] : 'inherit',
                        cursor: disableClick ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <p style={{pointerEvents: 'none'}}>{['日', '月', '火', '水', '木', '金', '土'][day.weekday()]}</p>
                      <p style={{pointerEvents: 'none', fontSize: 16, fontWeight: 'bold'}}>{day.date()}{width === 'xs' ? '' : '日'}</p>
                    </TableCell>
                  </Tooltip>
                )
              })}
            </TableRow>
            {dayStart > 0 &&
              <TableRow style={{height: 30}}>
                <TableCell style={{...styles.time, height: 30, whiteSpace: 'nowrap'}}>
                  <a style={{ padding: 5, fontSize: 11}} onClick={() => this.setState({dayStart: 0})}>0時から表示</a>
                </TableCell>
                {[...Array(7)].map((_, week) => <TableCell key={`${week}_showmore`} style={{height: 30}} />)}
              </TableRow>
            }
            {[...Array(24 - dayStart)].map((_, i) => {
              const hour = i + dayStart
              const lastWeekTime = weekStart.clone().add(6 * 24 + hour, 'hours')
              const disableHourClick = lastWeekTime.isBefore(moment())
              return (
                <TableRow key={hour}>
                  <Tooltip
                    disableHoverListener={disableHourClick}
                    disableFocusListener={disableHourClick}
                    title={
                      <div style={{textAlign: 'center', fontSize: 13}}>
                        <div>時間をクリックすると</div>
                        <div>同じ時間帯全てを</div>
                        <div>ブロックできます</div>
                      </div>
                    }
                  >
                    <TableCell
                      style={{...styles.time, verticalAlign: 'top', cursor: disableHourClick ? 'not-allowed' : 'cursor'}}
                      className={disableHourClick ? '' : 'time'}
                      onClick={() => this.toggleHour(hour)}
                    >
                      {hour}:00
                    </TableCell>
                  </Tooltip>
                  {[...Array(7)].map((_, week) => {
                    const columnHour = weekStart.clone().add(week * 24 + hour, 'hours')
                    const schedule = scheduleInWeek[week][hour]
                    return schedule && schedule.type !== 'block' ?
                      <TableCell key={`${week}_${hour}`} style={{...styles.column, background: blue.A200, cursor: 'pointer'}} onClick={() => this.props.history.push('/pros/schedules/booking')} />
                    : columnHour.isBefore(moment()) ?
                      <TableCell key={`${week}_${hour}`} className='block' style={{...styles.column, background: grey[200]}} />
                    : schedule && schedule.recurrence ?
                      <TableCell key={`${week}_${hour}`} style={{...styles.column, background: grey[100], cursor: 'not-allowed'}} />
                    : schedule ?
                      <TableCell key={`${week}_${hour}`} style={{...styles.column, background: blue[100], cursor: 'pointer'}} onClick={() => this.removeSchedule(schedule)} />
                    :
                      <TableCell key={`${week}_${hour}`} className={`column${week} column`} style={{...styles.column, cursor: 'pointer'}} onClick={() => this.addSchedule(columnHour)} />
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }
}
