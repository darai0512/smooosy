import React from 'react'
import { Checkbox } from '@material-ui/core'
import { FormControl, FormControlLabel, FormGroup } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import { calcPriceOptions, calcFromFormula } from 'lib/price'

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
  selectWrap: {
    width: '100%',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  select: {
    padding: '0px 24px',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      padding: '0px 12px',
    },
  },
  selectableForm: {
    background: theme.palette.common.white,
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    margin: '0 24px 24px',
    display: 'block',
    [theme.breakpoints.down('xs')]: {
      margin: '0 16px 16px',
    },
  },
  option: {
    width: '29%',
    margin: '0 10px',
    [theme.breakpoints.down('xs')]: {
      width: '42%',
    },
  },
}))
export default class QueryCardPrice extends React.Component {

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
    const options = props.query.subType === 'formula' ? calcFromFormula({
      formula: props.query.formula,
      replacement: props.formulaReplacement,
      addPoint: props.query.addPoint,
      multiplePoint: props.query.multiplePoint,
    }) : calcPriceOptions({
      minPrice: props.query.minPrice + props.addPrice,
      maxPrice: props.query.maxPrice + props.addPrice,
      addPoint: props.query.addPoint,
      multiplePoint: props.query.multiplePoint,
    })
    const answers = options.map((option, i) => {
      const checked = (props.query.answers || []).filter(a => a.checked).map(a => a.range)
      return {
        ...option,
        _id: i,
        checked: !!checked.find(r => r[0] === option.range[0] || r[1] === option.range[1]),
      }
    })
    this.checkContinuous(answers)
    return {answers}
  }

  toggle = (option) => {
    const last = this.state.answers[this.state.answers.length - 1]
    if ((option._id === last._id && !last.checked) // 見当がつかないを選択したら他を外す
      || (option._id !== last._id && last.checked) // 見当がつかないを選択中に他を選択
    ) {
      const answers = this.state.answers.map(a => ({
        ...a,
        checked: a._id === option._id,
      }))
      this.setState({answers})
      return
    }

    const answers = this.state.answers.map(a => ({
      ...a,
      checked: a._id === option._id ? !a.checked : a.checked,
    }))
    this.checkContinuous(answers)
    this.setState({answers})
  }

  // 歯抜け状態をなくす
  checkContinuous = (answers) => {
    // 参照渡しのanswersを直接更新
    let count = answers.filter(a => a.checked).length
    let prev = false
    for (let a of answers) {
      if (a.checked) count--
      if (count === 0) break

      if (prev && !a.checked) a.checked = true
      prev = a.checked
    }
  }

  next = () => {
    const { query } = this.props
    const { answers } = this.state
    this.props.next({queryId: query.id, answers})
  }

  prev = () => {
    const { query } = this.props
    const { answers } = this.state
    this.props.prev({queryId: query.id, answers})
  }

  render() {
    const { query, isLastQuery, onClose, progress, classes } = this.props
    const { answers } = this.state

    const selectCount = answers.filter(a => a.checked).length
    let count = 0

    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div ref={e => this.container = e} className={classes.container}>
          <QueryCardHeader sub='複数選択可' helperText={query.helperText}>
            {query.text}
          </QueryCardHeader>
          <FormControl className={classes.selectableForm}>
            <FormGroup>
              {answers.map((answer, i) => {
                if (answer.checked) count++
                const disabled = 1 < count && count < selectCount && i !== answers.length - 1
                return (
                  <div key={i} className={classes.selectWrap}>
                    <FormControlLabel
                      className={`priceLabel ${classes.select}`}
                      control={
                        <Checkbox color='primary' disabled={disabled} checked={!!answer.checked} onClick={() => this.toggle(answer)} />
                      }
                      label={answer.text}
                    />
                  </div>
                )
              })}
            </FormGroup>
          </FormControl>
        </div>
        <QueryCardFooter
          className='nextQuery price'
          disabledNext={selectCount === 0}
          onPrev={() => this.prev()}
          onNext={() => this.next()}
          prevTitle='戻る'
          nextTitle={isLastQuery ? '送信する' : '次へ'}
          />
      </div>
    )
  }
}
