import React from 'react'
import moment from 'moment'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import { green } from '@material-ui/core/colors'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import RightIcon from '@material-ui/icons/ChevronRight'

import { scrollToElement } from 'lib/scroll'

moment.updateLocale('en', {weekdays: ['日', '月', '火', '水', '木', '金', '土']})

// 月曜日
const mondayOfWeek = m => m.subtract({days: (m.weekday() + 6) % 7})
const CELL_HEIGHT = 36

@withStyles(theme => ({
  root: {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 18,
  },
  headerButton: {
    width: 70,
    color: theme.palette.common.black,
  },
  calendar: {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    height: CELL_HEIGHT * 6.5,
    position: 'relative',
  },
  floatMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.palette.primary.dark,
    position: 'absolute',
    top: -26,
    left: 0,
    right: 0,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    padding: 1,
    fontSize: 16,
    position: 'relative',
  },
  pastDay: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'not-allowed',
    background: theme.palette.grey[300],
    color: theme.palette.grey[500],
    borderRadius: 4,
  },
  day: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  today: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: green[600],
    borderRadius: 4,
    '&:hover': {
      opacity: 0.6,
    },
  },
  selectedDay: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    borderRadius: 4,
    '&:hover': {
      opacity: 0.6,
    },
  },
  nextMonthFab: {
    position: 'absolute',
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
  },
}))
export default class DateVerticalPicker extends React.Component {

  static defaultProps = {
    limitFutureMonth: 12,
  }

  constructor(props) {
    super(props)

    const today = moment()
    const dates = []
    const start = mondayOfWeek(today.clone().startOf('month'))
    this.beforePos = today.diff(start, 'week') * CELL_HEIGHT
    const end = today.clone().add({month: props.limitFutureMonth}).endOf('month').startOf('date')
    while (start.isBefore(end)) {
      const week = []
      for (let i = 0; i < 7; i++) {
        week.push(start.clone())
        start.add({day: 1})
      }
      dates.push(week)
    }

    this.state = {
      dates,
      today,
      selectMonth: today.clone().startOf('month'),
    }
    this.weekRefs = {}
    this.monthAnimTimers = {}
    this.calendar = null
  }

  componentDidMount() {
    if (this.calendar) this.calendar.scrollTop = this.beforePos
  }

  componentWillUnmount() {
    this.weekRefs = {}
    this.monthAnimTimers = {}
    this.calendar = null
    this.beforePos = 0
  }

  nextMonth = () => {
    const { selectMonth } = this.state
    if (!this.calendar) return

    const key = selectMonth.clone().add({month: 1}).format('YYYYMM')
    if (this.weekRefs[key]) {
      scrollToElement(this.weekRefs[key], CELL_HEIGHT)
    }
  }

  prevMonth = () => {
    const { selectMonth } = this.state
    if (!this.calendar) return

    const key = selectMonth.clone().subtract({month: 1}).format('YYYYMM')
    if (this.weekRefs[key]) {
      scrollToElement(this.weekRefs[key], CELL_HEIGHT)
    }
  }

  toggleItem = (date) => {
    const { items, onChange, multi }= this.props
    if (multi) {
      const idx = items.findIndex(e => moment(e.date).isSame(date, 'day'))
      if (idx === -1) {
        onChange([...items, {date}].sort((a, b) => a.date < b.date ? -1 : 1))
      } else {
        onChange([...items.slice(0, idx), ...items.slice(idx + 1)])
      }
    } else {
      onChange([{...items[0], date}])
    }
  }

  scroll = () => {
    const { selectMonth, today } = this.state
    if (!this.calendar) return

    const pos = this.calendar.scrollTop
    let month = today.format('YYYYMM')
    for (const key in this.weekRefs) {
      const weekRef = this.weekRefs[key]
      const monthTop = weekRef.offsetTop - CELL_HEIGHT * 2
      if (monthTop < pos) {
        month = key
      }
    }
    this.beforePos = pos
    if (month !== selectMonth.format('YYYYMM')) {
      this.setState({selectMonth: moment(month, 'YYYYMM')})
    }
  }

  renderCalendar = () => {
    const { classes, calendarClassName, items, limitFutureMonth, className } = this.props
    const { dates, selectMonth, today } = this.state

    const isFirstMonth = selectMonth.isSame(today, 'month')
    const isLastMonth = selectMonth.diff(today, 'month') >= limitFutureMonth - 1

    return (
      <div className={[classes.root, className].join(' ')}>
        <div className={classes.header}>
          <Button size='small' variant='outlined' classes={{root: classes.headerButton}} onClick={() => this.prevMonth()} style={{visibility: isFirstMonth ? 'hidden' : 'visible'}}>
            <LeftIcon style={{fontSize: 18}} />
            {selectMonth.clone().subtract({month: 1}).format('M月')}
          </Button>
          <div style={{flex: 1, textAlign: 'center', fontWeight: 'bold'}}>
            {selectMonth.format('YYYY年MM月')}
          </div>
          <Button size='small' variant='outlined' classes={{root: classes.headerButton}} onClick={() => this.nextMonth()} style={{visibility: isLastMonth ? 'hidden' : 'visible'}}>
            {selectMonth.clone().add({month: 1}).format('M月')}
            <RightIcon style={{fontSize: 18}} />
          </Button>
        </div>
        <Week />
        <div ref={e => this.calendar = e} className={[classes.calendar, calendarClassName].join(' ')} onScroll={this.scroll}>
          {dates.map((week, idx) =>
            <div
              key={idx}
              style={{display: 'flex'}}
              ref={e => this.weekRefs[week[6].format('YYYYMM')] = this.weekRefs[week[6].format('YYYYMM')] || e}
            >
              {week.map((date, idxx) => {
                const isPastDate = date.isBefore(today, 'day')
                const isToday = date.isSame(today, 'day')
                const isCurrentMonth = date.isSame(selectMonth, 'month')
                const selectedDate = !!items.find(e => date.isSame(e.date, 'day'))
                const isStartDay = date.date() === 1
                const isStartWeek = date.date() - idxx <= 1

                const cellStyle = {
                  marginTop: isStartWeek ? CELL_HEIGHT * 2 : 0,
                }

                return (
                  <div key={idxx} className={classes.cell} style={cellStyle}>
                    {isStartDay &&
                      <div className={classes.floatMonth}>
                        {date.format('M月')}
                      </div>
                    }
                    <div
                      className={classes[isPastDate ? 'pastDay': selectedDate ? 'selectedDay' : isToday ? 'today' : 'day'] + ` day_${date.format('YYYYMMDD')}`}
                      onClick={() => isPastDate ? null : this.toggleItem(date.toDate())}
                      style={{fontWeight: isCurrentMonth ? 'bold' : 'normal'}}
                    >
                      {date.format('D')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  render() {
    return (
      <>
        {this.renderCalendar()}
      </>
    )
  }
}

const Week = withStyles({
  week: {display: 'flex', height: 32, alignItems: 'center'},
  weekday: {flex: 1, textAlign: 'center'},
}, {withTheme: true})(({classes, theme}) =>
  <div className={classes.week}>
    <div className={classes.weekday}>月</div>
    <div className={classes.weekday}>火</div>
    <div className={classes.weekday}>水</div>
    <div className={classes.weekday}>木</div>
    <div className={classes.weekday}>金</div>
    <div className={classes.weekday} style={{color: theme.palette.blue.A200}}>土</div>
    <div className={classes.weekday} style={{color: theme.palette.red[500]}}>日</div>
  </div>
)
