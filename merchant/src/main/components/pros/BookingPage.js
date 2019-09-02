import React from 'react'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import { reduxForm, Field } from 'redux-form'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, withStyles } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationClose from '@material-ui/icons/Close'

import { loadForPro as loadMeet } from 'modules/meet'
import { create as createSchedule } from 'modules/schedule'
import renderTextInput from 'components/form/renderTextInput'
import DateVerticalPicker from 'components/DateVerticalPicker'
import TimePicker from 'components/TimePicker'

@withWidth()
@reduxForm({
  form: 'booking',
  initialValues: {
    day: null,
    time: {
      start: null,
      end: null,
    },
    info: {},
  },
  validate: (values) => {
    const errors = {}
    if (!values.day) {
      errors.day = '必須項目です'
    }
    if (!values.time) {
      errors.time = '必須項目です'
    } else {
      if (!values.time.start) {
        errors.time = '必須項目です'
      }
      if (!values.time.end) {
        errors.time = '必須項目です'
      }
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
    values: state.form.booking.values,
  }),
  { loadMeet, createSchedule }
)
@withTheme
@withStyles(theme => ({
  root: {
  },
  header: {
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  head: {
    width: '90%',
    maxWidth: 600,
    height: 50,
    margin: '0 auto',
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  main: {
    width: '90%',
    margin: '30px auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  mainStep0: {
    maxWidth: 600,
  },
  mainStep1: {
    maxWidth: 400,
  },
  calHeader: {
    background: theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    height: 50,
  },
  calendar: {
    margin: '30px 0',
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      borderLeft: 0,
      borderRight: 0,
    },
  },
  timePicker: {
    padding: 10,
  },
  block: {
    margin: '30px 0',
    padding: 20,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      padding: 10,
      borderLeft: 0,
      borderRight: 0,
    },
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: '20px 10px 10px',
  },
  notice: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.palette.grey[500],
    [theme.breakpoints.down('xs')]: {
      margin: '0px 10px',
    },
  },
  timeBox: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: 5,
  },
  hourButton: {
    width: '23%',
    margin: 5,
    lineHeight: '34px',
    padding: 0,
    [theme.breakpoints.down('xs')]: {
      width: '46%',
    },
  },
}))
export default class BookingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      step: 0,
      answers: [],
    }
  }

  componentDidMount() {
    this.props.loadMeet(this.props.match.params.id).then(({meet}) => {
      this.load({id: meet.pro.id})
    })

    this.props.initialize({
      info: {
        owner: this.props.user.id,
      },
    })
  }

  getMoment = (day, time) => {
    if (!day || !time) {
      return null
    }
    return moment(`${moment(day).format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm')
  }

  handleSubmit = (values) => {
    const { meet } = this.props

    const startTime = this.getMoment(values.day, values.time.start).toDate()
    const endTime = this.getMoment(values.day, values.time.end).toDate()

    return this.props.createSchedule({
      ...values,
      user: meet.pro.id,
      meet: meet.id,
      type: 'job',
      status: 'accept',
      startTime,
      endTime,
    }).then(() => {
      this.props.history.push(this.props.location.pathname.replace(/\/booking/, ''))
    })
  }

  render() {
    const { step, answers } = this.state
    const { meet, values, width, handleSubmit, invalid, submitting, classes } = this.props

    if (!meet) return null

    const startTime = values.time ? this.getMoment(values.day, values.time.start) : null
    const endTime = values.time ? this.getMoment(values.day, values.time.end) : null

    const steps = [
      (
      <div key='day' className={classes.calendar}>
        <Field name='day' component={({input: {onChange}}) =>
          <DateVerticalPicker
            items={answers}
            onChange={(answers) => {
              this.setState({answers})
              const dateTime = answers[0]
              onChange(dateTime.date)
            }}
          />
        } />
      </div>
      ),
      (
      <div key='time' className={classes.calendar}>
        <Field name='time' component={({input: {onChange}}) =>
          <TimePicker
            answers={answers}
            rootClass={classes.timePicker}
            subType='duration'
            onChange={(answers) => {
              this.setState({answers})
              const dateTime = answers[0]
              onChange({
                start: dateTime.start,
                end: dateTime.end ? dateTime.end : null,
              })
            }}
          />
        } />
      </div>
      ),
      (
      <div key='address' className={classes.block}>
        <div className={classes.subtitle}>
          どこで会いますか？
          {startTime && endTime &&
            <p style={{fontSize: 14}} >
              日時:{
                startTime.format('M/DD')} {['日', '月', '火', '水', '木', '金', '土'][startTime.weekday()]
              } {startTime.format('H:mm')} - {endTime.format('H:mm')}
            </p>
          }
        </div>
        <div>
          <Field name='info.address' placeholder='105-0011 東京都港区芝公園4-2−8' component={renderTextInput} />
        </div>
      </div>
      ),
    ]

    return (
      <div className={classes.root}>
        <Helmet>
          <title>予約作成</title>
        </Helmet>
        <div className={classes.header}>
          <div className={classes.head}>
            {step > 0 &&
              <Button onClick={() => this.setState({step: step - 1})} >
                <NavigationChevronLeft />
                戻る
              </Button>
            }
            <div style={{flex: 1}} />
            <Link to={this.props.location.pathname.replace(/\/booking/, '')}>
              <Button style={{minWidth: 40}} >
                <NavigationClose />
              </Button>
            </Link>
          </div>
        </div>
        <form className={[classes.main, step === 0 ? classes.mainStep0 : classes.mainStep1].join(' ')}>
          <div style={{margin: 10, fontSize: 16, fontWeight: 'bold', textAlign: 'center'}}>仕事の日程を登録する</div>
          <div className={classes.notice}>※仕事日の翌日に案件のステータスが自動的に完了になり、クチコミ依頼が送られます。</div>
          {steps[step]}
          <div style={{display: 'flex', margin: width === 'xs' ? '0 20px': 0}}>
            <Button variant='contained'
              color='primary'
              type='submit'
              style={{flex: 1, height: 45}}
              onClick={step === steps.length - 1 ? handleSubmit(this.handleSubmit) : (e) => {
                e.preventDefault()
                this.setState({step: step + 1})
              }}
              disabled={invalid || submitting}
            >
              {step === steps.length - 1 ? '保存する' : '次へ'}
            </Button>
          </div>
        </form>
      </div>
    )
  }
}
