import React from 'react'
import moment from 'moment'
import { FormControlLabel, MenuItem, TextField, FormGroup, Checkbox } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const timeRangeHash = {
  '時間指定なし': 0,
  '早朝(〜9時)': 1,
  '午前(9〜12時)': 2,
  '午後(12〜15時)': 3,
  '夕方(15〜18時)': 4,
  '夜(18時〜)': 5,
}
const timeRange = Object.keys(timeRangeHash)

// subType = duration で利用する時間間隔
const addMinutes = []
let addMinute = 0
for (let i = 0; i < 24; i++) {
  if (i <= 4) { // 最初の4時間は 30分間隔も加える
    addMinutes.push(addMinute + 30)
  }
  addMinute += 60
  addMinutes.push(addMinute)
}

@withStyles(() => ({
  date: {
    padding: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  wavedash: {
    padding: '0 10px',
  },
}))
export default class TimePicker extends React.Component {
  static defaultProps ={
    multi: false,
    subType: 'none',
    answers: [],
    hideDate: false,
    rootClass: '',
    listClass: '',
    overrideClasses: '',
    overrides: '',
  }

  constructor(props) {
    super(props)
    this.state = {answers: props.answers}
    if (props.multi) {
      this.currentDate = new Date().getDate()
      this.multiChoiceArray = this.getMultiChoices(props.hidePastChoices)
    } else {
      this.startTime = this.getStartTimeChoices(props.hidePastChoices)
    }
  }

  handleSelectPeriod = (idx, selected) => {
    const { answers } = this.state

    let time = answers[idx].time
    if (selected === '時間指定なし') {
      time = []
    } else {
      const defaultIdx = time.indexOf('時間指定なし')
      if (defaultIdx !== -1) time = [...time.slice(0, defaultIdx), ...time.slice(defaultIdx + 1)]
    }
    if (time) {
      const idx = time.indexOf(selected)
      if (idx === -1) {
        time.push(selected)
      } else {
        time = [...time.slice(0, idx), ...time.slice(idx + 1)]
        if (!time.length) time = ['時間指定なし']
      }
    } else {
      time = [selected]
    }

    answers[idx].time = time.sort((a, b) => timeRangeHash[a] - timeRangeHash[b])
    this.props.onChange(answers)
    this.setState({answers})
  }

  timeToMinute = (time) => {
    return Number(time.split(':')[0]) * 60 + Number(time.split(':')[1])
  }

  addTime = (time, addMinute) => {
    const minuteTime = this.timeToMinute(time) + addMinute
    return `${Math.floor(minuteTime / 60)}:${('0' + minuteTime % 60).substr(-2)}`
  }

  formatTime = (time) => {
    const hour = Number(time.split(':')[0])
    const minute = Number(time.split(':')[1])
    let isNextDay = false
    if (hour >= 24) {
      isNextDay = true
    }
    return `${isNextDay ? `翌日${hour - 24}` : hour}:${('0' + minute % 60).substr(-2)}`
  }

  handleChangeTime = (key, value) => {
    const { answers } = this.state
    answers[0][key] = value
    if (key === 'start') {
      delete answers[0].end
    }
    this.props.onChange(answers)
    this.setState({answers})
  }

  getMultiChoices = (hidePastChoices) => {
    if (!hidePastChoices) {
      return timeRange
    }
    let choiceArray = []
    const currentHour = new Date().getHours()
    let start = 0
    const rangeArray = [[0, 9], [9, 12], [12, 15], [15, 18], [18, 24]]
    rangeArray.map((array, index) => {
      if (array[0] <= currentHour && currentHour < array[1]) {
        start = index + 2
        return
      }
    })
    if (start === 6) {
      start -= 1
    }
    choiceArray.push(timeRange[0])
    timeRange.slice(start, timeRange.length).map(val => {
      choiceArray.push(val)
    })
    return choiceArray
  }

  getStartTimeChoices = (hidePastChoices) => {
    if (!hidePastChoices) {
      return [...Array(18)].map((_, idx) => [`${idx+6}:00`, `${idx+6}:30`]).reduce((prev, curr) => prev.concat(curr))
    }
    const currentHour = new Date().getHours()
    const array = [...Array(18)].map((_, idx) => {
      if (idx+6 > currentHour) {
        return [`${idx+6}:00`, `${idx+6}:30`]
      }
    }).filter(v => v).reduce((prev, curr) => prev.concat(curr))
    return array
  }

  render() {
    const { multi, subType, hideDate, rootClass, listClass, classes, overrideClasses, overrides } = this.props
    const { answers } = this.state

    return (
      <div className={rootClass}>
        {multi ?
          <div className='timeSelect-multi'>
            {answers.map((answer, i) =>
              <div key={i} className={listClass}>
                <div className={classes.date}>
                  {moment(answer.date).format('YYYY/MM/DD(dddd)')}
                </div>
                <FormGroup row>
                  {answer.date.getDate() === this.currentDate ?
                    this.multiChoiceArray.map((text, idx) => (
                      <FormControlLabel
                        key={idx}
                        checked={answer.time && answer.time.indexOf(text) !== -1}
                        control={<Checkbox color='primary' value={text} onChange={() => this.handleSelectPeriod(i, text)} />}
                        label={text}
                      />
                    ))
                    :
                      timeRange.map((text, idx) => (
                        <FormControlLabel
                          key={idx}
                          checked={answer.time && answer.time.indexOf(text) !== -1}
                          control={<Checkbox color='primary' value={text} onChange={() => this.handleSelectPeriod(i, text)} />}
                          label={text}
                        />
                    ))}
                </FormGroup>
              </div>
            )}
          </div>
        :
          <div className={listClass + ' timeSelect'}>
            {!hideDate &&
              <div className={classes.date}>
                {moment(answers[0].date).format('YYYY/MM/DD(dddd)')}
              </div>
            }
            <div className={classes.time}>
              <TextField
                select
                label={`${subType === 'duration' ? '開始' : ''}時刻`}
                value={answers[0].start || ''}
                style={{width: 90, color: !answers[0].time && '#999', flex: 1}}
                onChange={e => this.handleChangeTime('start', e.target.value)}
                InputProps={{
                  classes: {
                    root: overrideClasses.timeInput,
                  },
                }}
                InputLabelProps={{
                  classes: {
                    root: overrideClasses.timeInputLabel,
                    shrink: overrideClasses.timeInputLabelHidden,
                  },
                  disableAnimation: overrides.disableAnimation,
                }}
              >
                {this.startTime.map((time, idx) => (
                  <MenuItem key={time} value={time} className={`time_${idx}`}>{time}</MenuItem>
                ))}
              </TextField>
              {subType === 'duration' && <div className={classes.wavedash}>〜</div>}
              {subType === 'duration' &&
                <TextField
                  className='time'
                  select
                  label='終了時間'
                  value={answers[0].end || ''}
                  style={{width: 90, flex: 1}}
                  onChange={e => this.handleChangeTime('end', e.target.value)}
                  InputProps={{
                    className: overrideClasses.timeInput,
                  }}
                  disabled={!answers[0].start}
                >
                  {answers[0].start &&
                    addMinutes.map((addMinute) => this.formatTime(this.addTime(answers[0].start, addMinute))).map((time, idx) => <MenuItem key={time} value={time} className={`time_${idx}`}>{time}</MenuItem>)
                  }
                </TextField>
              }
            </div>
          </div>
        }
      </div>
    )
  }
}
