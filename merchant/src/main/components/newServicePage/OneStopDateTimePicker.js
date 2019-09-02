import React from 'react'
import moment from 'moment'
import { Popover, IconButton, withStyles } from '@material-ui/core'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import RightIcon from '@material-ui/icons/ChevronRight'
import Counter from './Counter'
import { fillDigits } from 'lib/util'

const FORMAT_DATE = 'YYYY-MM-DD'
@withStyles(theme => ({
  button: {
    background: theme.palette.common.white,
    width: '100%',
    padding: '5px 15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  divider: {
    fontSize: 24,
  },
  calendar: {
    display: 'flex',
  },
  section: {
    margin: '10px 10px 0',
    padding: 5,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 2,
    background: theme.palette.grey[100],
  },
  timeWrap: {
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    flex: 1,
  },
  picker: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dateStr: {
    fontSize: 20,
    [theme.breakpoints.up('sm')]: {
      marginRight: 20,
    },
  },
  timeStr: {
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  placeholder: {
    color: theme.palette.grey[700],
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
}))
export default class OneStopDateTimePicker extends React.Component {
  state = {
    popover: null,
    pristine: true,
  }

  selectDate = (date) => {
    const { start, end, onChange } = this.props
    this.setState({pristine: false})
    onChange({
      date,
      start,
      end,
    })
  }

  onChangeTime = type => value => {
    const { date, start, end, onChange } = this.props
    this.setState({pristine: false})
    onChange({
      date,
      start,
      end,
      [type]: value,
    })
  }

  fill = num => fillDigits(num, 2, '0')

  render() {
    const { classes, withStart, withEnd, date, start, end, placeholder = '日時を選択' } = this.props
    const { popover, pristine } = this.state
    let timeStr = ''
    if (withStart) {
      timeStr += `  ${start.hour}:${this.fill(start.minute)}`
      if (withEnd) {
        timeStr += ` ~ ${end.hour}:${this.fill(end.minute)}`
      }
    }
    return (
      <>
        <div className={classes.button} onClick={e => this.setState({popover: e.currentTarget})}>
          {pristine ?
            <div className={classes.placeholder}>{placeholder}</div>
          :
            <>
              <div className={classes.dateStr}>{date}</div>
              <div className={classes.timeStr}>{timeStr}</div>
            </>
          }
        </div>
        <Popover
          open={!!popover}
          anchorEl={popover}
          onClose={() => this.setState({popover: null})}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <div>
            <div className={[classes.calendar, classes.section].join(' ')}>
              <Calendar onSelect={this.selectDate} date={date} />
            </div>
            <div className={classes.timeWrap}>
              {withStart &&
                <div className={[classes.section, classes.time].join(' ')}>
                  <Time minute={start.minute} hour={start.hour} onChange={this.onChangeTime('start')} />
                </div>
              }
              {withStart && withEnd &&
                <>
                  <div className={classes.divider}>~</div>
                  <div className={[classes.section, classes.time].join(' ')}>
                    <Time minute={end.minute} hour={end.hour} onChange={this.onChangeTime('end')} />
                  </div>
                </>
              }
            </div>
          </div>
        </Popover>
      </>
    )
  }
}

@withStyles({
  root: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
  },
})
class Time extends React.Component {
  onChange = type => value => {
    const { minute, hour } = this.props
    this.props.onChange({
      minute: type === 'minute' ? value * 30 : minute,
      hour: type === 'hour' ? value : hour,
    })
  }

  render() {
    const { hour, minute, classes } = this.props
    return (
      <div className={classes.root}>
        <Counter min={0} max={23} loop defaultValue={12} value={hour} onChange={this.onChange('hour')} column />
        <span className={classes.separator}>：</span>
        <Counter min={0} max={1} loop defaultValue={0} value={Math.round(minute / 30)} onChange={this.onChange('minute')} column>
          {value => ('0' + (value * 30)).slice(-2)}
        </Counter>
      </div>
    )
  }
}

const weekdays = '日月火水木金土'.split('')
@withStyles(theme => ({
  root: {
    padding: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  month: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 16,
    color: theme.palette.grey[700],
    marginBottom: 5,
  },
  moveIcon: {
    width: 30,
    height: 30,
  },
  calendar: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 260,
  },
  row: {
    display: 'flex',
    flex: 1,
    width: '100%',
  },
  cell: {
    height: '100%',
    flex: 1,
    fontSize: 16,
    paddingTop: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 35,
    minWidth: 35,
    '&:nth-child(1)': {
      color: theme.palette.red[700],
    },
    '&:nth-child(7)': {
      color: theme.palette.primary.main,
    },
  },
  selected: {
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:nth-child(1)': {
      color: theme.palette.common.white,
      background: theme.palette.red[700],
    },
    '&:nth-child(7)': {
      color: theme.palette.common.white,
      background: theme.palette.primary.main,
    },
  },
  days: {
    borderRadius: 2,
  },
  otherMonth: {
    color: theme.palette.grey[500],
    '&:nth-child(1)': {
      color: theme.palette.red[200],
    },
    '&:nth-child(7)': {
      color: theme.palette.blue[200],
    },
  },
  pointer: {
    cursor: 'pointer',
  },
  todaySelected: {
    '&:after': {
      content: '"今日"',
      fontSize: 12,
      color: theme.palette.white,
    },
  },
  today: {
    '&:after': {
      content: '"今日"',
      fontSize: 12,
      color: theme.palette.red[700],
    },
  },
}))
class Calendar extends React.Component {
  constructor(props) {
    super(props)
    const date = moment(props.date)
    this.today = moment().format(FORMAT_DATE)
    this.state = {
      date,
      weeks: this.createNextWeeks(date),
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.date !== prevProps.date) {
      this.setState({date: moment(this.props.date)})
    }
  }

  changeMonth = (value) => () => {
    const { date } = this.state
    const newDate = date.clone().add(value, 'month')
    this.setState({
      date: newDate,
      weeks: this.createNextWeeks(newDate),
    })
  }

  createNextWeeks = (date) => {
    const startWeekDay = date.startOf('month').day()
    const lastWeekDay = date.endOf('month').day()
    const daysInThisMonth = [...new Array(date.daysInMonth())].map((_, idx) => idx + 1)
    const daysInLastMonth = date.clone().subtract(1, 'month').daysInMonth()
    const prev = startWeekDay ? [...new Array(daysInLastMonth)].map((_, idx) => idx + 1).slice(-startWeekDay) : []
    const weeks = {
      prev,
      thisMonth: [daysInThisMonth.splice(0, 7 - startWeekDay)],
      after: [1, 2, 3, 4, 5, 6].slice(0, 6 - lastWeekDay),
    }
    while (daysInThisMonth.length) {
      weeks.thisMonth.push(daysInThisMonth.splice(0, 7))
    }
    return weeks
  }

  selectDate = (day) => {
    const { date } = this.state
    const newDate = date.clone().set('date', day)
    this.setState({date: newDate})
    this.props.onSelect(newDate.format(FORMAT_DATE))
  }

  getCellClass = (d) => {
    const { classes, date } = this.props
    const cellClass = [classes.cell, classes.days, classes.pointer]
    const dateStr = `${this.state.date.format('YYYY-MM')}-${(('0' + d).slice(-2))}`
    const isToday = this.today === dateStr
    if (moment(date).format(FORMAT_DATE) === dateStr) {
      cellClass.push(classes.selected)
      if (isToday) {
        cellClass.push(classes.todaySelected)
      }
    } else if (isToday) {
      cellClass.push(classes.today)
    }

    return cellClass.join(' ')
  }

  render() {
    const { classes } = this.props
    const { weeks, date } = this.state

    return (
      <div className={classes.root}>
        <div className={classes.month}>
          <IconButton disableRipple disableTouchRipple className={classes.moveIcon} onClick={this.changeMonth(-1)}><LeftIcon /></IconButton>
          {date.format('YYYY年MM月')}
          <IconButton disableRipple disableTouchRipple className={classes.moveIcon} onClick={this.changeMonth(1)}><RightIcon /></IconButton>
        </div>
        <div className={classes.calendar}>
          <div className={classes.row}>
            {weekdays.map(d => <div className={classes.cell} key={d}>{d}</div>)}
          </div>
          {weeks.thisMonth.map((days, idx) => {
            if (idx === 0) {
              return (
                <div key={idx} className={classes.row}>
                  {weeks.prev.map(d => <div key={d} className={[classes.cell, classes.days, classes.otherMonth].join(' ')}>{d}</div>)}
                  {days.map(d => <div key={d} onClick={() => this.selectDate(d)} className={this.getCellClass(d)}>{d}</div>)}
                </div>
              )
            } else if (idx === weeks.thisMonth.length - 1) {
              return (
                <div key={idx} className={classes.row}>
                  {days.map(d => <div key={d} onClick={() => this.selectDate(d)} className={this.getCellClass(d)}>{d}</div>)}
                  {weeks.after.map(d => <div key={d} className={[classes.cell, classes.days, classes.otherMonth].join(' ')}>{d}</div>)}
                </div>
              )
            }
            return (
              <div key={idx} className={classes.row}>
                {days.map(d => <div key={d} onClick={() => this.selectDate(d)} className={this.getCellClass(d)}>{d}</div>)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
