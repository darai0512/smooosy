import React from 'react'
import { TextField } from '@material-ui/core'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'

import ResponsiveDialog from 'components/ResponsiveDialog'
import TimePicker from 'components/TimePicker'
import DateVerticalPicker from 'components/DateVerticalPicker'

// This component must be styled - export only styled versions
// of this component
class DateField extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = { open: false }
  }

  onClick = () => {
    this.setState({ open: true })
  }

  onSelected = items => {
    const { dateTime } = this.props
    dateTime.date = items[0].date
    this.setState({ open: false })
    this.props.onChange({dateTime})
  }

  onChangeTime = answers => {
    const dateTime = answers[0]
    this.props.onChange({dateTime})
  }

  onClose = () => {
    this.setState({ open: false })
  }

  render() {
    const { dateTime, query, classes, overrideClasses = {}, dateOverrides = {}, timeOverrides = {}, fieldProps } = this.props
    const { open } = this.state

    return (
      <div className={classes.root}>
        {query.summary && <h4>{query.summary}</h4>}
        <TextField
          fullWidth
          placeholder={dateOverrides.placeholder ? dateOverrides.placeholder : '日付を選んでください'}
          error={!dateOverrides.disableError && !dateTime.date}
          value={dateTime.date ? moment(dateTime.date).format('YYYY/MM/DD') : ''}
          InputProps={{
            className: overrideClasses.dateInput,
          }}
          InputLabelProps={{
            shrink: true,
          }}
          onClick={this.onClick}
          {...fieldProps}
        />
        {dateTime.date &&
          <TimePicker
            hideDate
            rootClass={classes.time}
            answers={[dateTime]}
            subType={query.subType}
            onChange={this.onChangeTime}
            overrideClasses={overrideClasses}
            overrides={timeOverrides}
          />
        }
        <ResponsiveDialog
          open={!!open}
          onClose={this.onClose}
          muiClasses={{paper: classes.dialog}}
          >
          <DateVerticalPicker
            calendarClassName={classes.calendar}
            items={[dateTime]}
            limitFutureMonth={3}
            onChange={this.onSelected}
          />
        </ResponsiveDialog>
      </div>
    )
  }
}

export const SidebarDateField = withStyles(() => ({
  root: {
    marginBottom: 20,
  },
  dialog: {
    width: 600,
    minWidth: 'auto',
    height: 'auto',
  },
  calendar: {
    height: '70vh',
  },
  time: {
    marginTop: 10,
  },
}))(DateField)

export const QuestionDateField = withStyles(() => ({
  dialog: {
    width: 600,
    minWidth: 'auto',
    height: 'auto',
  },
  calendar: {
    height: '70vh',
  },
}))(DateField)