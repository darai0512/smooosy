import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import {
  InputLabel,
  Input,
  Select,
  Chip,
  Dialog,
  Button,
  FormControl,
} from '@material-ui/core'
import DateVerticalPicker from './DateVerticalPicker'
import moment from 'moment'

const styles = theme => ({
  formControl: {
    margin: theme.spacing(),
    minWidth: 120,
    maxWidth: 200,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: theme.spacing(0.25),
  },
  calendar: {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    position: 'relative',
    flex: 1,
  },
  button: {
    fontSize: 20,
    height: '50px',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
      height: '40px',
    },
  },
  datePicker: {
    padding: '8px 8px 0',
  },
  dialogPaper: {
    width: '90%',
  },
  buttonWrap: {
    position: 'sticky',
    left: 0,
    bottom: 0,
    padding: 5,
    width: '100%',
  },
})

class DatePicker extends React.Component {
  state = {
    showCalendar: false,
    openSelect: false,
  };

  handleSubmit = () => {
    this.setState({ showCalendar: false })
    this.props.onChange(this.props.dates, false /* isCalendarStillOpen */)
  };

  handleChange = dates => {
    if (this.props.onChange) {
      this.props.onChange(dates, true /* isCalendarStillOpen */)
    }
  };

  render() {
    const { dates, overrideClasses = {} } = this.props

    const classes = { ...this.props.classes, ...overrideClasses }

    const formattedDates = dates.map(date => moment(date.date).format('MM/DD'))

    return (
      <div>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor='select-multiple-chip'>日付</InputLabel>
          <Select
            multiple
            open={this.state.openSelect}
            value={formattedDates}
            onOpen={() => this.setState({ showCalendar: true })}
            input={<Input id='select-multiple-chip' />}
            renderValue={selected => (
              <div className={classes.chips}>
                {selected.map(d => (
                  <Chip key={d} label={d} className={classes.chip} />
                ))}
              </div>
            )}
           />
        </FormControl>
        <Dialog
          open={this.state.showCalendar}
          onClose={this.handleSubmit}
          PaperProps={{className: classes.dialogPaper}}
        >
          <DateVerticalPicker
            multi
            calendarClassName={classes.calendar}
            className={classes.datePicker}
            items={dates}
            limitFutureMonth={2}
            onChange={this.handleChange}
          />
          <div className={classes.buttonWrap}>
            <Button className={classes.button} variant='contained' color='primary' onClick={this.handleSubmit}>
              仕事日で絞る
            </Button>
          </div>
        </Dialog>
      </div>
    )
  }
}

export default withStyles(styles)(DatePicker)
