import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import ValueCounter from 'components/ValueCounter'
import ValueSelector from 'components/ValueSelector'
import LogisticalSlider from 'components/LogisticalSlider'
import japaneseNumber from 'lib/japaneseNumber'
import { generateRangeMap } from 'lib/range'

const ValueComponents = {
  counter: ValueCounter,
  selector: ValueSelector,
  slider: LogisticalSlider,
}

@withStyles(theme => ({
  root: {
    overflow: 'hidden',
    position: 'relative',
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
    overflowY: 'auto',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    flex: 1,
    paddingLeft: 18,
    paddingRight: 18,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingLeft: 6,
    paddingRight: 6,
    marginBottom: 20,
    width: '50%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      paddingLeft: 16,
      paddingRight: 16,
    },
  },
  single: {
    width: '100%',
  },
  title: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  items: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  content: {
    padding: '10px 20px',
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
}))
export default class QueryCardNumber extends React.Component {

  constructor(props) {
    super(props)
    this.answers = this.getFromProps(props)
    this.state = {
      answers: this.answers,
      disabledNext: this.getDisabledNext(),
    }
  }

  getDisabledNext = () => {
    const { query } = this.props
    return query.subType === 'required' && this.answers.every(a => a.number === 0)
  }

  getFromProps = (props) => {
    const answers = []
    for (let option of props.query.options) {
      let range

      if (option.stepSize) {
        const ranges = Object.values(generateRangeMap(option.min, option.max, option.stepSize))

        range = ranges[0].range
      }

      const answer = (props.query.answers || []).find(a => a.id === option.id) // すでに回答済み
      answers.push({
        id: option.id,
        text: answer ? answer.text : '',
        number: answer ? answer.number : (option.defaultNumber || option.min),
        range: answer ? answer.range : range,
        question: option.text,
        unit: option.unit,
      })
    }
    return answers
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.query.id !== nextProps.query.id && this.container) {
      this.container.scrollTop = 0
      this.answers = this.getFromProps(nextProps)
      this.setState({answers: this.answers})
    }
  }

  next = () => {
    const { query } = this.props
    for (let answer of this.answers) {
      const prefix = this.answers.length > 1 ? `${answer.question}: ` : ''

      let rangeText

      if (answer.range && answer.range.length === 1) {
        rangeText = `${japaneseNumber(answer.range[0]).format()}〜`
      } else if (answer.range && answer.range.length === 2) {
        rangeText = `${japaneseNumber(answer.range[0]).format()}〜${japaneseNumber(answer.range[1]).format()}`
      } else {
        rangeText = `${japaneseNumber(answer.number).format()}`
      }

      answer.text = `${prefix}${rangeText}${answer.unit}`
      delete answer.unit
    }
    this.props.next({queryId: query.id, answers: this.answers})
  }

  prev = () => {
    const { query } = this.props
    this.props.prev({queryId: query.id, answers: this.answers})
  }

  onChange = (idx, number, range) => {
    this.answers = this.answers.map((a, i) => i === idx ? {...a, number, range} : a)
    this.setState({
      disabledNext: this.getDisabledNext(),
    })
  }

  render() {
    const { query, isFirstQuery, isLastQuery, onClose, progress, classes } = this.props
    const { answers, disabledNext } = this.state
    const wrapperClass = query.options.length === 1 ? [classes.wrapper, classes.single].join(' ') : classes.wrapper

    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div ref={e => this.container = e} className={classes.container}>
          <QueryCardHeader sub='必須'>
            {query.text}
          </QueryCardHeader>
          <div className={classes.items}>
            {query.options.map((option, idx) => {
              const Component = ValueComponents[option.type]
              return (
                <div key={option.id} className={wrapperClass}>
                  {query.options.length > 1 && <p className={classes.title}>{option.text}</p>}
                  <Component
                    defaultValue={answers[idx].number}
                    id={option.id}
                    min={option.min}
                    max={option.max}
                    unit={option.unit}
                    stepSize={option.stepSize}
                    onChange={(number, range) => this.onChange(idx, number, range)}
                    rootClass={classes.content}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <QueryCardFooter
          className='nextQuery number'
          disabledNext={disabledNext}
          onPrev={isFirstQuery ? null : this.prev}
          onNext={this.next}
          prevTitle='戻る'
          nextTitle={isLastQuery ? '送信する' : '次へ'}
          />
      </div>
    )
  }
}
