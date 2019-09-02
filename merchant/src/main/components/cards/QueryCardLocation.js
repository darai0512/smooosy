import React from 'react'
import { FormControl, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import GoogleMapEdit from 'components/GoogleMapEdit'
import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'

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
  content: {
    padding: '0 24px 24px',
    overflowY: 'auto',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      padding: '0 16px 16px',
    },
  },
  location: {
    paddingTop: 5,
  },
  select: {
    width: '100%',
    marginLeft: 0,
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
}))
export default class QueryCardLocation extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.propsToState(this.props)
  }

  componentDidUpdate(prevProps) {
    if (this.props.query.id !== prevProps.query.id) {
      this.setState({location: null})
      setTimeout(() => {
        this.setState(this.propsToState(this.props))
      }, 0)
    }
  }

  propsToState = props => {
    const state = {
      location: props.query.answers ? props.query.answers.location : {},
      answers: props.query.answers || props.query.options || [],
    }

    if (props.query.subType !== 'required') {
      const answers = state.answers
      if (answers.every(ans => !ans.checked)) answers[0].checked = true
      state.answers = answers
      state.inputLocation = (answers[1] && answers[1].checked) ? 'yes' : 'no'
    }
    return state
  }

  next = () => {
    const answers = this.state.answers
    answers.location = this.state.location
    this.props.next({queryId: this.props.query.id, answers})
  }

  onChangeLocation = (location = {}) => {
    this.setState({location})
    if (location.address) {
      const answers = this.state.answers
      answers[0] = {
        text: location.address,
      }
      this.setState({answers})
    }
  }

  toggle = value => {
    const { answers } = this.state
    if (value === 'yes') {
      answers[0].checked = false
      answers[1].checked = true
    } else {
      answers[0].checked = true
      answers[1].checked = false
    }
    this.setState({
      answers,
      inputLocation: value,
      location: value === 'no' ? {} : this.state.location,
    })
  }

  render() {
    const { query, isFirstQuery, isLastQuery, onClose, progress, initial, prev, classes } = this.props
    const { answers, inputLocation, location } = this.state

    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div className={classes.content}>
          <QueryCardHeader sub={query.subType === 'required' ? '必須' : ''} helperText={query.helperText}>
            {query.text}
          </QueryCardHeader>
          {query.subType !== 'required' &&
            <FormControl>
              <RadioGroup name='locationInput' value={this.state.inputLocation} onChange={(_, value) => this.toggle(value)}>
                <FormControlLabel value='no' control={<Radio color='primary' />} label={answers[0].text} />
                <FormControlLabel value='yes' control={<Radio color='primary' />} label={answers[1].text} />
              </RadioGroup>
            </FormControl>
          }
          {(query.subType === 'required' || inputLocation === 'yes') && location &&
            <GoogleMapEdit
              isStatic
              mapHeight={200}
              className={classes.location}
              loc={location.loc}
              address={location.address}
              onChange={this.onChangeLocation}
              initial={location.search || initial}
            />
          }
        </div>
        <QueryCardFooter
          className='nextQuery location'
          disabledNext={(query.subType === 'required' || inputLocation === 'yes') && !(location && location.loc)}
          onPrev={isFirstQuery ? null : () => prev()}
          onNext={() => this.next()}
          prevTitle='戻る'
          nextTitle={isLastQuery ? '送信する' : '次へ'}
          />
      </div>
    )
  }
}
