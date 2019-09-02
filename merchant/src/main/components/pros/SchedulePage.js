import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Button, IconButton, Badge } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import ActionEvent from '@material-ui/icons/DateRange'
import Calendar from 'components/pros/Calendar'
import Booking from 'components/pros/Booking'
import { loadAllForPro as loadSchedules, unload as unloadSchedules } from 'modules/schedule'

@withWidth()
@connect(
  state => ({
    schedules: state.schedule.schedules,
  }),
  { loadSchedules, unloadSchedules }
)
@withTheme
export default class SchedulePage extends React.Component {
  constructor(props) {
    super(props)
    const state = props.location.state || {}
    const weekStart = moment(state.startTime).startOf('week')
    this.state = {
      weekStart,
      tab: props.match.params.tab || 'calendar',
    }
  }

  componentDidMount() {
    this.load().then(({schedules}) => {
      const scheduleHours = schedules.filter(s => s.recurrence === 'week')
      .map(s => moment(s.startTime).hour())

      if (scheduleHours.length) {
        this.setState({ dayStart: scheduleHours.sort((a, b) => a - b)[0] })
      }
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.tab !== prevProps.match.params.tab) {
      this.setState({tab: this.props.match.params.tab})
    }
  }

  moveWeek = (start) => {
    this.props.unloadSchedules()
    this.load(start).then(() => this.setState({weekStart: start}))
  }

  load = (start) => {
    const weekStart = start || this.state.weekStart
    const weekEnd = weekStart.clone().endOf('week')
    return this.props.loadSchedules({
      startTime: weekStart.toDate(),
      endTime: weekEnd.toDate(),
      recurrence: 'week',
    })
  }

  render() {
    const { dayStart, weekStart, tab } = this.state
    const { schedules, width, theme } = this.props
    const { common, grey, blue } = theme.palette

    const styles = {
      root: {
      },
      header: {
        background: common.white,
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: 10,
        borderBottom: `1px solid ${grey[300]}`,
      },
      bookingButton: {
        width: 100,
        lineHeight: '34px',
        border: `1px solid ${grey[500]}`,
        padding: '0 10px',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 0,
      },
      calendarButton: {
        width: 100,
        marginLeft: -1,
        lineHeight: '34px',
        padding: '0 10px',
        border: `1px solid ${grey[500]}`,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 5,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 5,
      },
      calendar: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: 800,
        margin: width === 'xs' ? '0' : '40px auto',
      },
      calHeader: {
        background: common.white,
        display: 'flex',
        alignItems: 'center',
        height: 50,
        borderTop: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        borderLeft: `1px solid ${grey[300]}`,
        borderRight: `1px solid ${grey[300]}`,
      },
      iconStyle: {
        width: 36,
        height: 36,
      },
      icon: {
        width: 50,
        height: 50,
        padding: 7,
      },
      badge: {
        position: 'absolute',
        top: 1,
        right: 1,
      },
      date: {
        position: 'absolute',
        top: 21,
        left: 15,
        zIndex: 1,
        cursor: 'pointer',
        background: common.white,
        borderRadius: 0,
        width: 18,
        height: 15,
        color: blue.A200,
      },
    }

    const thisWeek = moment().startOf('week')
    const weekEnd = weekStart.clone().endOf('week')
    const pending = schedules ? schedules.filter(s => s.status === 'pending') : []

    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div style={{flex: 1}}>
            <Button onClick={() => this.props.history.push(this.props.location.state ? this.props.location.state.from : '/pros')} style={{minWidth: 40}}>
              <NavigationChevronLeft />
              {width !== 'xs' && '戻る'}
             </Button>
          </div>
          <div style={{position: 'relative'}}>
            <Button style={styles.bookingButton} disabled={tab === 'booking'} onClick={() => this.props.history.push('/pros/schedules/booking')} >予約一覧</Button>
            {pending.length > 0 && <Badge color='primary' badgeContent={pending.length} style={styles.badge} />}
          </div>
          <Button style={styles.calendarButton} disabled={tab === 'calendar'} onClick={() => this.props.history.push('/pros/schedules/calendar')} >カレンダー</Button>
          <div style={{flex: 1}} />
        </div>
        <div style={styles.calendar}>
          <div style={styles.calHeader}>
            <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center'}}>
              <IconButton ref={(e) => this.today = e} style={styles.icon} onClick={() => this.moveWeek(thisWeek)}><ActionEvent style={{...styles.iconStyle, color: blue.A200}} /></IconButton>
              <Badge badgeContent={moment().date()} style={styles.date} onClick={() => this.moveWeek(thisWeek)} />
              {width !== 'xs' &&
                <a onClick={() => this.moveWeek(thisWeek)}>今週</a>
              }
            </div>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: width === 'xs' ? 15 : 18, fontWeight: 'bold'}}>
              <IconButton onClick={() => this.moveWeek(weekStart.subtract(1, 'week'))}><NavigationChevronLeft style={{color: blue.A200}} /></IconButton>
              <div style={{minWidth: 100, textAlign: 'center'}}>
                <span>{weekStart.month() + 1}/{weekStart.date()}</span>
                <span>-</span>
                <span>{weekStart.month() !== weekEnd.month() && `${weekEnd.month() + 1}/`}{weekEnd.date()}</span>
                {weekEnd.year() !== moment().year() && <span>, {weekEnd.year()}</span>}
              </div>
              <IconButton onClick={() => this.moveWeek(weekStart.add(1, 'week'))}><NavigationChevronRight style={{color: blue.A200}} /></IconButton>
            </div>
            <div style={{flex: 1}} />
          </div>
          {tab === 'calendar' ?
            <Calendar dayStart={dayStart} weekStart={weekStart} load={this.load} />
          :
            <Booking weekStart={weekStart} load={this.load} />
          }
        </div>
      </div>
    )
  }
}
