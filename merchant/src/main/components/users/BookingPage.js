import React from 'react'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import { reduxForm, Field } from 'redux-form'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, IconButton, Tabs, Tab, RadioGroup, Radio, FormControlLabel } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import NavigationClose from '@material-ui/icons/Close'
import CommunicationPhone from '@material-ui/icons/Phone'
import ActionQuestionAnswer from '@material-ui/icons/QuestionAnswer'
import SocialPeople from '@material-ui/icons/People'

import { load as loadMeet } from 'modules/meet'
import { loadAll as loadSchedules, unload as unloadSchedules, create as createSchedule } from 'modules/schedule'
import renderTextInput from 'components/form/renderTextInput'
import BorderedButton from 'components/BorderedButton'

@withWidth()
@reduxForm({
  form: 'booking',
  initialValues: {
    info: {},
  },
  validate: (values) => {
    const errors = {}
    if (!values.type) {
      errors.type = '必須項目です'
    }
    if (!values.startTime) {
      errors.startTime = '必須項目です'
    }
    if (!values.info.phone) {
      errors.info = {phone: '必須項目です'}
    } else if (!/0\d{9,10}$/.test(values.info.phone.replace(/-/g, ''))) {
      errors.info = {phone: '正しい電話番号を入力してください'}
    }
    if (!values.info.address) {
      errors.info = {...errors.info, address: '必須項目です'}
    }
    return errors
  },
})
@connect(
  state => ({
    user: state.auth.user,
    meet: state.meet.meet,
    schedules: state.schedule.schedules,
    values: state.form.booking.values,
  }),
  { loadMeet, loadSchedules, unloadSchedules, createSchedule }
)
@withTheme
export default class BookingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      step: 0,
      weekStart: moment().startOf('week'),
      targetWeek: moment().day(),
    }
  }

  componentDidMount() {
    this.props.loadMeet(this.props.match.params.meetId).then(({meet}) => {
      if (meet.request.deleted) {
        return this.props.history.replace(`/requests/${meet.request.id}/responses/${meet.id}`)
      }
      this.load({id: meet.pro.id})
    })

    this.props.initialize({
      info: {
        owner: this.props.user.id,
        phone: this.props.user.phone,
      },
    })
  }

  moveWeek = (start) => {
    this.props.unloadSchedules()
    this.load({start}).then(() => this.setState({weekStart: start}))
  }

  load = ({id, start}) => {
    id = id || this.props.meet.pro.id
    const weekStart = start || this.state.weekStart
    const weekEnd = weekStart.clone().endOf('week')
    return this.props.loadSchedules(id, {
      startTime: weekStart.toDate(),
      endTime: weekEnd.toDate(),
      recurrence: 'week',
    }).then(({schedules}) => {
      const scheduleInWeek = this.scheduleInWeek(schedules)
      this.setState({scheduleInWeek})
    })
  }

  scheduleInWeek = () => {
    const { schedules } = this.props

    const scheduleInWeek = [...Array(7)].map(() => [])
    for (let schedule of schedules) {
      if (schedule.status === 'decline' || schedule.status === 'cancel') continue
      const week = moment(schedule.startTime).day()
      const hour = moment(schedule.startTime).hour()
      if (!scheduleInWeek[week]) continue
      if (!schedule.recurrence) {
        scheduleInWeek[week][hour] = schedule
        if (schedule.type === 'job' && moment(schedule.startTime).minutes() == 30) {
          scheduleInWeek[week][hour + 1] = schedule
        }
      } else if (schedule.recurrence === 'week') {
        const endWeek = moment(schedule.endTime).day()
        const endHour = moment(schedule.endTime).hour()
        if (week === endWeek) {
          for (let h = hour; h <= endHour; h++) scheduleInWeek[week][h] = schedule
        } else {
          for (let h = hour; h < 24; h++) scheduleInWeek[week][h] = schedule
          for (let h = 0; h <= endHour; h++) scheduleInWeek[endWeek][h] = schedule
        }
      }
    }
    return scheduleInWeek
  }

  handleSubmit = (values) => {
    const { meet } = this.props

    if (values.type !== 'phone') {
      delete values.info.phone
    } else if (values.info.owner === meet.pro.id && meet.pro.phone) {
      values.info.phone = meet.pro.phone
    }

    return this.props.createSchedule({
      ...values,
      user: meet.pro.id,
      meet: meet.id,
      status: 'pending',
      startTime: values.startTime.toDate(),
      endTime: values.startTime.clone().add(values.type === 'job' ? 60 : 30, 'minutes').toDate(),
    }).finally(() => {
      this.props.history.push(`/requests/${meet.request.id}/responses/${meet.id}`)
    })
  }

  render() {
    const { step, weekStart, targetWeek, scheduleInWeek } = this.state
    const { user, meet, values, width, handleSubmit, invalid, submitting, theme } = this.props
    const { common, grey, blue, secondary } = theme.palette

    if (!meet) return null

    const styles = {
      root: {
      },
      header: {
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      head: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: 600,
        height: 50,
        margin: '0 auto',
        padding: 10,
        display: 'flex',
        alignItems: 'center',
      },
      main: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: step === 1 ? 600 : 400,
        margin: '30px auto',
      },
      calHeader: {
        background: common.white,
        display: 'flex',
        alignItems: 'center',
        height: 50,
      },
      calendar: {
        margin: '30px 0',
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
        borderLeft: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        borderRight: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
      },
      block: {
        margin: '30px 0',
        padding: width === 'xs' ? 10 : 20,
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
        borderLeft: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        borderRight: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
      },
      subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        margin: '20px 10px 10px',
      },
      typeButton: {
        margin: 10,
        width: width === 'xs' ? 250 : 300,
        height: 45,
      },
      timeBox: {
        display: 'flex',
        flexWrap: 'wrap',
        padding: 5,
      },
      hourButton: {
        width: width === 'xs' ? '46%' : '23%',
        margin: 5,
        lineHeight: '34px',
        padding: 0,
      },
    }

    const weekEnd = weekStart.clone().endOf('week')
    const twoHoursAfter = moment().add(2, 'hours')

    return (
      <div style={styles.root}>
        <Helmet>
          <title>予約作成</title>
        </Helmet>
        <div style={styles.header}>
          <div style={styles.head}>
            {step > 0 &&
              <Button onClick={() => this.setState({step: step - 1})} >
                <NavigationChevronLeft />
                戻る
              </Button>
            }
            <div style={{flex: 1}} />
            <Link to={`/requests/${meet.request.id}/responses/${meet.id}`}>
              <Button style={{minWidth: 40}} >
                <NavigationClose />
              </Button>
            </Link>
          </div>
        </div>
        <form style={styles.main}>
          <div style={{margin: 10, fontSize: 16, fontWeight: 'bold', textAlign: 'center'}}>{meet.profile.name}様の予定を押さえる</div>
          {step === 0 ?
            <div style={styles.block}>
              <div style={styles.subtitle}>予約する用件は何ですか？</div>
              <Field name='type' component={({input: {value, onChange}}) =>
                <div style={{textAlign: 'center'}}>
                  {[
                    {key: 'phone', label: '電話での相談', icon: <CommunicationPhone />},
                    {key: 'consulting', label: '対面での相談', icon: <ActionQuestionAnswer />},
                    {key: 'job', label: '仕事の日取り', icon: <SocialPeople />},
                  ].map(type =>
                    <BorderedButton
                      key={type.key}
                      active={type.key === value}
                      style={styles.typeButton}
                      onClick={() => onChange(type.key)}
                    >
                      {type.icon}
                      {type.label}
                    </BorderedButton>
                  )}
                </div>
              } />
            </div>
          : step === 1 ?
            <div style={styles.calendar}>
              <div style={styles.calHeader}>
                <div style={{flex: 1}} />
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: width === 'xs' ? 15 : 18, fontWeight: 'bold'}}>
                  <IconButton disabled={weekStart.isBefore(moment())} onClick={() => this.moveWeek(weekStart.subtract(1, 'week'))}><NavigationChevronLeft style={{color: blue.A200}} /></IconButton>
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
              <Field name='startTime' component={({input: {value, onChange}}) =>
                <div style={{paddingBottom: 20}}>
                  <Tabs value={targetWeek} onChange={(e, targetWeek) => this.setState({targetWeek})} variant='fullWidth'>
                    {[...Array(7)].map((_, week) => {
                      const day = weekStart.clone().add(week, 'days')
                      return (
                        <Tab
                          key={week}
                          value={week}
                          style={{width: '14.28%', minWidth: 'auto', height: 'auto', borderBottom: `1px solid ${grey[300]}`}}
                          disabled={day.isBefore(moment().startOf('days'))}
                          label={
                          <div style={{color: day.isSame(moment(), 'day') ? secondary.main : day.isBefore(moment(), 'day') ? grey[300] : grey[800]}}>
                            <p>{['日', '月', '火', '水', '木', '金', '土'][day.weekday()]}</p>
                            <p style={{fontSize: 16, fontWeight: 'bold'}}>{day.date()}{width === 'xs' ? '' : '日'}</p>
                          </div>
                        } />
                      )
                    })}
                  </Tabs>
                  {[
                    {count: 6, offset: 6, text: '午前'},
                    {count: 6, offset: 12, text: '午後'},
                    {count: 4, offset: 18, text: '夕方'},
                  ].map(timeSlot =>
                    <div key={timeSlot.offset}>
                      <div style={styles.subtitle}>{timeSlot.text}</div>
                      <div style={styles.timeBox}>
                        {[...Array(timeSlot.count * 2)].map((_, i) => {
                          const time = weekStart.clone().add(this.state.targetWeek * 24 + i/2 + timeSlot.offset, 'hours')
                          const block = scheduleInWeek && scheduleInWeek[this.state.targetWeek][Math.floor(i/2) + timeSlot.offset]
                          return (
                            <BorderedButton
                              key={i}
                              style={styles.hourButton}
                              active={time.isSame(value)}
                              disabled={time.isBefore(twoHoursAfter) || !!block}
                              onClick={() => {
                                onChange(time);this.setState({step: step + 1})
                              }}
                            >
                              {time.format('H:mm')}
                            </BorderedButton>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              } />
            </div>
          : step === 2 && values.type === 'phone' ?
            <div style={styles.block}>
              <div style={styles.subtitle}>
                どちらが電話をしますか？
                {values.startTime &&
                  <a style={{fontSize: 14}} onClick={() => this.setState({step: step - 1})}>日時: {values.startTime.format('M/DD H:mm')}</a>
                }
              </div>
              <Field name='info.owner' component={({input}) =>
                <RadioGroup {...input} value={input.value} onChange={(e, value) => input.onChange(value)}>
                  <FormControlLabel
                    value={meet.pro.id}
                    control={<Radio color='primary' style={{padding: 10}} />}
                    label={
                      <span>
                        自分が電話をする
                        {values.info.owner === meet.pro.id && meet.pro.phone &&
                          <span style={{color: grey[500]}}><br/>{meet.pro.phone}</span>
                        }
                      </span>
                    } />
                  <FormControlLabel
                    value={user.id}
                    control={<Radio color='primary' style={{padding: 10}} />}
                    label='プロに電話してもらう'  />
                </RadioGroup>
              } />
              {values.info.owner === user.id &&
                <div style={{marginLeft: 50}}>
                  <Field name='info.phone' placeholder='090-1111-2222' component={renderTextInput} />
                </div>
              }
            </div>
          : step === 2 && values.type !== 'phone' ?
            <div style={styles.block}>
              <div style={styles.subtitle}>
                どこで会いますか？
                {values.startTime &&
                  <a style={{fontSize: 14}} onClick={() => this.setState({step: step - 1})}>日時: {values.startTime.format('M/DD H:mm')}</a>
                }
              </div>
              <Field name='info.owner' component={({input}) =>
                <RadioGroup {...input} value={input.value} onChange={(e, value) => input.onChange(value)}>
                  <FormControlLabel
                    value={meet.pro.id}
                    control={<Radio color='primary' style={{padding: 10}} />}
                    label='プロが指定する場所'
                  />
                  <FormControlLabel
                    value={user.id}
                    control={<Radio color='primary' style={{padding: 10}} />}
                    label='自分が指定する場所'
                  />
                </RadioGroup>
              } />
              {values.info.owner === user.id &&
                <div style={{marginLeft: 50}}>
                  <Field name='info.address' placeholder='105-0011 東京都港区芝公園4-2−8' component={renderTextInput} />
                </div>
              }
            </div>
          : null}
          {step !== 1 &&
            <div style={{margin: width === 'xs' ? '0 20px': 0}}>
              <Button variant='contained'
                color='primary'
                style={{width: '100%', height: 45}}
                onClick={step === 2 ? handleSubmit(this.handleSubmit) : (e) => {
                  e.preventDefault();this.setState({step: step + 1})
                }}
                disabled={invalid || submitting}
              >
                {step === 2 ? '保存する' : '次へ'}
              </Button>
            </div>
          }
        </form>
      </div>
    )
  }
}
