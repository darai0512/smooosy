import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Typography, Button } from '@material-ui/core'
import ServicePicker from 'components/ServicePicker'
import DatePicker from 'components/DatePicker'
import DistancePicker from 'components/DistancePicker'

const defaultFilters = {
  dates: [],
  serviceIds: [],
}

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 15,
  },
  title: {
    marginRight: theme.spacing(),
    marginBottom: theme.spacing(),
  },
  flexBreak: {
    flexBasis: '100%',
    height: 0,
  },
  clearFiltersButton: {
    height: 40,
    marginTop: theme.spacing(),
    marginBottom: theme.spacing(),
  },
  formControl: {
    marginRight: theme.spacing(),
    marginBottom: theme.spacing(),
    minWidth: 120,
    maxWidth: 500,
    [theme.breakpoints.down('xs')]: {
      minWidth: 140,
    },
  },
})

// from pro services, get all services that the pro has
// list them with request count next to them - need to make a new list for this
@withStyles(styles)
export default class RequestFilters extends React.Component {
  state = {
    filters: { ...defaultFilters },
    haveFilters: false,
  }

  onServiceIdsChange = (serviceIds) => {
    const newFilters = { ...this.state.filters, serviceIds }
    this.setState({ filters: newFilters, haveFilters: true })
    this.props.onChange(newFilters, true, 'service')
  }

  onDistanceChange = (distance) => {
    const newFilters = { ...this.state.filters, distance }
    this.setState({ filters: newFilters, haveFilters: true })
    this.props.onChange(newFilters, true, 'distance')
  }

  onDatesChange = (dates, isCalendarStillOpen) => {
    const newFilters = { ...this.state.filters, dates }
    this.setState({ filters: newFilters, haveFilters: true })
    this.props.onChange(newFilters, true, 'date', isCalendarStillOpen/* isIntermediateChange */)
  }

  clearFilters = () => {
    const newFilters = { ...defaultFilters }
    this.setState({ filters: newFilters, haveFilters: false })
    this.props.onChange(newFilters, false)
  }

  render () {
    const { classes } = this.props

    return (
      <div>
        <div className={classes.root}>
          <Typography variant='h6' className={classes.title}>絞り込み</Typography>
          <div className={classes.flexBreak} />
          <ServicePicker
            onChange={this.onServiceIdsChange}
            serviceMap={this.props.serviceMap}
            selectedServiceIds={this.state.filters.serviceIds}
            overrideClasses={{
              formControl: classes.formControl,
            }}
            />
          <DatePicker
            onChange={this.onDatesChange}
            dates={this.state.filters.dates}
            overrideClasses={{
              formControl: classes.formControl,
            }}
          />
          <DistancePicker
            onChange={this.onDistanceChange}
            distance={this.state.filters.distance}
            overrideClasses={{
              formControl: classes.formControl,
            }}
          />
          {this.state.haveFilters &&
            <Button fullWidth size='small' variant='outlined' className={classes.clearFiltersButton} onClick={this.clearFilters}>リセット</Button>
          }
        </div>
      </div>
    )
  }
}
