import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import SelectQuery from 'components/SelectQuery'


@withStyles(({ palette: { grey, red } }) => ({
  helperText: {
    fontSize: 14,
    color: grey[800],
  },
  error: {
    color: red[500],
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 24,
    marginBottom: 24,
  },
}))
export default class JobRequirement extends React.Component {
  constructor(props) {
    super(props)

    const { query } = props.jobRequirement

    const answers = this.getAnswers(props.jobRequirement)

    this.state = {
      query,
      answers,
    }
  }

  getAnswers = (jobRequirement) => {
    const { query, answers: existingAnswers } = jobRequirement
    const answers = query.options.map(option => {
      const answer = existingAnswers.find(a => a.id === option.id)
      return {...option, checked: !!answer}
    })

    return answers
  }

  componentDidUpdate(prevProps) {
    if (prevProps.jobRequirement !== this.props.jobRequirement) {
      this.setState({
        answers: this.getAnswers(this.props.jobRequirement),
      })
    }
  }

  onAnswerChange = (answers) => {
    // If there's only one option for a question, it's ok to leave this
    // option unchecked.
    const isValid = answers.length === 1 || answers.some(a => a.checked) || this.props.jobRequirement.query.noOptionsChosenOkForPro

    this.setState({
      answers,
      error: !isValid ? '少なくとも1つ選択してください' : '',
    })
    this.props.onAnswerChange({
      id: this.props.jobRequirement.query._id,
      answers,
      isValid,
    })
  }

  render() {
    const { classes, disabled } = this.props
    const { query, answers, error } = this.state

    return (
      <>
        <h4>{query.proText}</h4>
        <div className={classes.helperText}>{query.proHelperText}</div>
        <SelectQuery
          disabled={disabled}
          query={query}
          answers={answers}
          onChange={this.onAnswerChange}
        />
        <div className={classes.error}>{error}</div>
      </>
    )
  }
}
