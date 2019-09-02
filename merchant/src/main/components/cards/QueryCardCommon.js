import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import QuerySelection from 'components/cards/QuerySelection'

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
  },
  wrap: {
    padding: '0 24px',
    [theme.breakpoints.down('xs')]: {
      padding: '0 16px',
    },
  },
}))
export default class QueryCardCommon extends React.Component {

  constructor(props) {
    super(props)
    this.state = this.propsToState(props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.query.id !== nextProps.query.id && this.container) {
      this.container.scrollTop = 0
    }
    this.setState(this.propsToState(nextProps))
  }

  propsToState = (props) => {
    const answers = []
    for (let option of props.query.options) {
      const answer = (props.query.answers || []).find(a => a.id === option.id) // すでに回答済み
      answers.push(answer || option)
    }
    return {answers}
  }

  next = () => {
    const { query } = this.props
    const { answers } = this.state
    for (let ans of answers) {
      if (!ans.checked) delete ans.noteText
    }
    const result = {queryId: query.id, answers}
    const checkedAnswers = answers.filter(a => a.checked)
    result.skipQueryIds = [].concat(...checkedAnswers.map(a => a.skipQueryIds))

    this.props.next(result)
  }

  prev = () => {
    const { query } = this.props
    const { answers } = this.state
    this.props.prev({queryId: query.id, answers})
  }

  render() {
    const { query, isFirstQuery, isLastQuery, onClose, progress, classes } = this.props
    const { answers } = this.state

    const imageOptions = answers.filter(a => a.image).length > 0


    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div ref={e => this.container = e} className={classes.container}>
          <QueryCardHeader sub={(imageOptions || query.type === 'multiple') ? '複数選択可' : '単一選択'} helperText={query.helperText}>
            {query.text}
          </QueryCardHeader>
          <div className={classes.wrap}>
            <QuerySelection
              query={query}
              answers={answers}
              onChange={answers => this.setState({answers})}
            />
          </div>
        </div>
        <QueryCardFooter
          className='nextQuery common'
          disabledNext={answers.filter(a => a.checked).length === 0}
          onPrev={isFirstQuery ? null : () => this.prev()}
          onNext={() => this.next()}
          prevTitle='戻る'
          nextTitle={isLastQuery ? '送信する' : '次へ'}
          />
      </div>
    )
  }
}
