import React from 'react'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import PanoramaFishEyeIcon from '@material-ui/icons/PanoramaFishEye'
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory'
import CloseIcon from '@material-ui/icons/Close'

const weekdays = ['日', '月', '火', '水', '木', '金', '土']
let prevDayMonth

const WeeklySchedule = withStyles(theme => ({
  root: {
    display: 'flex',
  },
  task: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
    fontSize: 16,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  taskEnd: {
    borderRight: `1px solid ${theme.palette.grey[300]}`,
  },
  date: {
    padding: 3,
  },
  weekday: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    width: '100%',
    textAlign: 'center',
  },
  icon: {
    padding: 3,
  },
  saturday: {
    color: theme.palette.blue.A200,
  },
  sunday: {
    color: theme.palette.red[500],
  },
}))(({schedules, startingDay, dayOff, hideWeekday, classes, className}) => (
  <div className={[classes.root, className].join(' ')}>
    {[...Array(7)].map((_, idx) => moment(startingDay || new Date()).add(idx, 'days')).map((date, idx) => {
      const start = date.clone().startOf('day')
      const end = date.clone().endOf('day')
      let icon = null
      let message = ''
      const hasBooking = schedules.find(s => s.recurrence !== 'week' && moment(s.startTime).isBetween(start, end, null, '[]'))
      if (hasBooking) {
        // 通常営業以外の予定が入っている
        icon = <ChangeHistoryIcon />
        message = '予定あり'
      } else if (!dayOff[start.day()]) {
        // 通常営業時間外
        icon = <PanoramaFishEyeIcon />
        message = '通常営業'
      } else {
        // 通常営業のみ
        icon = <CloseIcon />
        message = '定休日'
      }
      const currentDayMonth = date.format('MM')
      let dayFormat
      if (currentDayMonth !== prevDayMonth) {
        dayFormat = 'M/D'
        prevDayMonth = currentDayMonth
      } else {
        dayFormat = 'D'
      }

      return (
        <div title={message} key={`date_${idx}`} className={[classes.task, date.day() === 0 ? classes.sunday : date.day() === 6 ? classes.saturday : '', idx === 6 ? classes.taskEnd : '' ].join(' ')}>
          {!hideWeekday && <div className={classes.weekday}>{weekdays[date.day()]}</div>}
          <div className={classes.date}>{date.format(dayFormat)}</div>
          <div className={classes.icon}>{icon}</div>
        </div>
      )
    })}
  </div>
))

export default WeeklySchedule