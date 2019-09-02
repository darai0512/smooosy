import React from 'react'
import { Button, TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import RightIcon from '@material-ui/icons/KeyboardArrowRight'

import { QuestionDateField } from 'components/DateField'
import WhiteBox from 'components/WhiteBox'
import GAEventTracker from 'components/GAEventTracker'

import { GAEvent } from '@smooosy/config'

class ConversionBox extends React.Component {
  static defaultProps = {
    title: 'どの地域でお探しですか？',
    questions: [{
      type: 'location',
    }],
    gaEvent: {},
    submitText: '次へ',
  }

  state = {
    dateTime: {},
  }

  onChange = ({ type, value }) => {
    this.setState({ [type]: value })
  }

  onSubmit = () => {
    // Legacy ZipBox interface
    this.props.onSubmit(
      this.state.location,
      this.props.analytics.subPosition,
      this.state.dateTime
    )
  }

  render() {
    const {
      title,
      classes,
      submitText,
      serviceQuestions,
      analytics,
    } = this.props

    // All services at least ask for location
    const questions = [{ type: 'location'}]

    if (serviceQuestions) {
      const dateQuestion = serviceQuestions.find(sq => sq.type === 'calendar' && sq.subType === 'fixed')

      if (dateQuestion) {
        questions.push({ type: 'dateTime', placeholder: dateQuestion.summary })
      }
    }

    return (
      <WhiteBox title={title}>
        <form onSubmit={e => e.preventDefault()} >
          {questions.map(q => (
            <Question
              key={q.type}
              classes={classes}
              onChange={this.onChange}
              type={q.type}
              placeholder={q.placeholder}
              value={this.state[q.type]}
              defaultValue={q.defaultValue}
            />
          ))}
          <GAEventTracker
            category={GAEvent.category.dialogOpen}
            action={analytics.page}
            label={analytics.service.key}
          >
            <Button variant='contained' color='primary' type='submit' className={classes.submitButton} onClick={this.onSubmit}>
              {submitText}
              <RightIcon className={classes.submitIcon} />
            </Button>
          </GAEventTracker>
        </form>
      </WhiteBox>
    )
  }
}

function Question({ classes, type, placeholder, value, defaultValue, onChange }) {
  switch (type) {
    case 'location':
      return <LocationQuestion
        classes={classes}
        defaultValue={defaultValue}
        onChange={v => onChange({ type, value: v })}
        />
    case 'dateTime':
      return <DateTimeQuestion
        classes={classes}
        value={value}
        placeholder={placeholder}
        onChange={v => onChange({ type, value: v })}
      />
    default:
      return null
  }
}

const DateTimeQuestion = ({ classes, value, placeholder, onChange }) => {
  return <QuestionDateField
    query={{}}
    dateTime={value}
    name='dateTime'
    overrideClasses={{
      dateInput: classes.input,
      timeInput: classes.input,
      timeInputLabel: classes.inputLabel,
      timeInputLabelHidden: classes.inputLabelHidden,
      timeContainer: classes.inputContainer,
    }}
    dateOverrides={{
      disableError: true,
      placeholder,
    }}
    timeOverrides={{disableAnimation: true}}
    onChange={({dateTime}) => onChange(dateTime)}
  />
}

const LocationQuestion = ({ classes, defaultValue, onChange }) => {
  return <div>
    <TextField
      name='location'
      className={classes.inputContainer}
      defaultValue={defaultValue}
      InputProps={{
        className: classes.input,
      }}
      placeholder='地名・郵便番号を入力'
      onChange={e => onChange(e.target.value)}
    />
  </div>
}

export default withStyles(theme => ({
  inputContainer: {
    marginTop: 0,
    width: '100%',
  },
  input: {
    height: 60,
    padding: '5px 15px',
    fontSize: 25,
    maxWidth: 300,
    minWidth: 230,
    outline: 'none',
    color: theme.palette.common.black,
    backgroundColor: theme.palette.common.white,
    borderRadius: '2px 0 0 2px',
    borderWidth: '1px 1px 0px 1px',
    borderStyle: 'solid',
    '&:placeholder': theme.palette.common.black,
    borderColor: theme.palette.grey[400],
    '&:focus': {
      borderColor: theme.palette.primary.main,
    },
    [theme.breakpoints.down('xs')]: {
      minWidth: 160,
      height: 40,
      padding: '3px 8px',
      fontSize: 15,
    },
    marginTop: '0px !important',
    marginBottom: 12,
    flex: 1,
  },
  inputLabel: {
    color: theme.palette.grey[500],
    fontSize: 25,
    zIndex: 1,
    left: 15,
    top: -7,
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
      left: 10,
      top: -11,
    },
  },
  inputLabelHidden: {
    display: 'none',
  },
  submitIcon: {
    marginLeft: 10,
    fontSize: 32,
    [theme.breakpoints.down('xs')]: {
      fontSize: 32,
      marginLeft: 0,
    },
  },
  submitButton: {
    width: '100%',
    borderRadius: '0 2px 2px 0',
    height: 60,
    fontSize: 24,
    padding: '4px 16px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
      height: 40,
      padding: '4px 12px',
    },
  },
}))(ConversionBox)

