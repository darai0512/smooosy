import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Radio, FormControlLabel } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import DateVerticalPicker from 'components/DateVerticalPicker'
import TimePicker from 'components/TimePicker'
import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import { dateString } from 'lib/date'

@connect(
  state => ({
    expCalendarWarn: state.experiment.experiments.calendar_warn || 'control',
  })
)
@withStyles(theme => ({
  root: {
    overflow: 'hidden',
    background: '#fafafa',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    height: 600,
    [theme.breakpoints.down('xs')]: {
      height: '100%',
    },
  },
  container: {
    overflowY: 'calendar',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    flex: 1,
  },
  wrap: {
    background: theme.palette.common.white,
    margin: '0 24px 24px',
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    [theme.breakpoints.down('xs')]: {
      margin: 0,
      borderWidth: '1px 0 0',
    },
  },
  datetimePicker: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  selectWrap: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  select: {
    flex: 1,
    margin: 0,
  },
  selectTime: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    padding: 10,
  },
  timeFlex: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
}))
export default class QueryCardCalendar extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      step: 0,
      ...this.propsToState(props),
    }
  }

  propsToState = (props) => {
    // 初期値
    if (!props.query.answers) {
      return {
        answers: [],
        flexible: false,
      }
    }
    if (props.query.subType === 'multiple') {
      // 最後の回答
      const flexible = props.query.answers[props.query.answers.length - 1].flexible
      // 最後の1つ前までの回答
      const answers = props.query.answers.slice(0, -1)
      return {
        answers,
        flexible,
      }
    }

    return {
      answers: props.query.answers,
    }
  }

  stateToProps = () => {
    const { query } = this.props
    let { answers, flexible } = this.state

    // 閲覧用の文字を作成
    answers = answers.map(a => {
      if (query.subType === 'duration') {
        a.text = dateString(a.date) + `  ${a.start}から${a.end}まで`
      } else if (query.subType === 'fixed') {
        a.text = dateString(a.date) + '  ' + a.start
      } else {
        a.text = dateString(a.date) + (a.time ? `  ${a.time.join(', ')}` : '')
      }
      return a
    })

    // 複数日付選択の場合
    if (query.subType === 'multiple') {
      answers.push({
        flexible,
        text: flexible ? '他の日時でも可' : '他の日時は不可',
      })
    }

    return answers
  }

  prev = event => {
    if (this.state.step === 1) {
      this.setState({step: 0})
      if (this.container) this.container.scrollTop = 0
      return
    }

    const answers = this.stateToProps()
    this.props.prev({event, queryId: this.props.query.id, answers})
  }

  next = event => {
    if (this.state.step === 0) {
      const {answers} = this.state
      if (this.props.query.subType === 'duration') {
        answers[0].start = answers[0].start || '10:00'
      }
      this.setState({step: 1, answers})
      if (this.container) this.container.scrollTop = 0
      return
    }

    const answers = this.stateToProps()
    this.props.next({event, queryId: this.props.query.id, answers})
  }

  render() {
    const { query, isFirstQuery, isLastQuery, onClose, progress, classes, expCalendarWarn } = this.props
    const { answers, flexible, step } = this.state
    const multi = !['fixed', 'duration'].includes(query.subType)

    const canMoveNext = (() => {
      if (answers.length === 0) return false
      if (step === 1 && query.subType === 'duration') {
        return !!(answers[0].date && answers[0].start && answers[0].end)
      }
      if (step === 1 && query.subType === 'fixed') {
        return !!answers[0].start
      }
      return true
    })()

    const warn = (() => {
      if (answers.length === 0) return null
      if (step !== 0) return null
      if (!multi) return null
      // 直近４日以内の日程のみのとき、警告を出す
      const fourDay = moment().add(3, 'days')
      if (answers.every(answer => moment(answer.date).isBefore(fourDay))) {
        return 'もう少し先の日程を選ぶと見積りがつきやすくなります'
      }
      return null
    })()


    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div ref={e => this.container = e} className={classes.container}>
          <QueryCardHeader sub={multi && '複数選択可'} helperText={query.helperText}>
            {query.text}
          </QueryCardHeader>
          {step === 0 ?
            <div className={classes.wrap}>
              {query.subType === 'multiple' &&
                <div className={classes.selectWrap}>
                  <FormControlLabel
                    key='flexible'
                    className={classes.select}
                    label='希望日以外も調整可能'
                    control={<Radio color='primary' checked={flexible} value='flexible' onClick={() => this.setState({flexible: true})} />}
                  />
                  <FormControlLabel
                    key='notFlexible'
                    className={classes.select}
                    label='希望日のみ'
                    control={<Radio color='primary' checked={!flexible} value='notFlexible' onClick={() => this.setState({flexible: false})} />}
                  />
                </div>
              }
              <DateVerticalPicker
                multi={multi}
                items={answers}
                className={classes.datetimePicker}
                onChange={(items) => {
                  if (multi) items.map(i => i.time = ['時間指定なし'])
                  this.setState({answers: items})
                }}
              />
            </div>
          : step === 1 ?
            <TimePicker
              multi={multi}
              answers={answers}
              rootClass={classes.wrap}
              listClass={classes.selectTime}
              subType={query.subType}
              onChange={answers => this.setState({answers})}
              hidePastChoices={answers[0].date.getDate() === new Date().getDate()}
            />
          : null}
        </div>
        <QueryCardFooter
          className='nextQuery calendar'
          disabledNext={!canMoveNext}
          warn={expCalendarWarn === 'control' ? null : warn}
          onPrev={isFirstQuery && step === 0 ? null : (event) => this.prev(event)}
          onNext={(event) => this.next(event)}
          prevTitle='戻る'
          nextTitle={isLastQuery && step === 1 ? '送信する' : '次へ'}
        />
      </div>
    )
  }
}
