import React from 'react'
import qs from 'qs'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import {
  withStyles,
  Button,
} from '@material-ui/core'
import PlaceIcon from '@material-ui/icons/Place'

import { sendLog } from 'modules/auth'

import { geocode, parseGeocodeResults, getGPS } from 'lib/geocode'
import { prefectualCapitals, BQEventTypes } from '@smooosy/config'

@withRouter
@connect(state => ({
  loc: state.service.servicePageV2.location,
}), { sendLog })
@withStyles(theme => ({
  root: {
    margin: 'auto',
    zIndex: 10,
    [theme.breakpoints.down('xs')]: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    },
  },
  message: {
    fontSize: 14,
    color: theme.palette.grey[600],
    marginBottom: 10,
  },
  box: {
    background: theme.palette.common.white,
    width: 500,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  zipInput: {
    flex: 1,
    padding: '5px 15px',
    fontSize: 20,
    outline: 'none',
    borderRadius: '0 3px 3px 0',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderLeft: '1px solid transparent',
    '-webkit-appearance': 'none',
    display: 'flex',
    alignItems: 'center',
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
    [theme.breakpoints.down('xs')]: {
      minWidth: 160,
      padding: '3px 8px',
      textAlign: 'center',
      fontSize: 18,
    },
  },
  title: {
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  titleXS: {
    fontSize: 24,
    margin: '10px 15px auto',
    color: theme.palette.common.white,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  zip: {
    marginBottom: 20,
    height: 50,
    display: 'flex',
    alignItems: 'stretch',
  },
  button: {
    height: 50,
    fontSize: 20,
  },
  icon: {
    color: theme.palette.grey[600],
    width: 36,
    height: 36,
    marginRight: 5,
  },
  placeText: {
    paddingRigh: 10,
    marginRight: 10,
    color: theme.palette.grey[600],
  },
  place: {
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.grey[200],
    borderRadius: '3px 0 0 3px',
    padding: '0 10px',
    cursor: 'pointer',
  },
  picker: {
    flex: 1,
    outline: 'none',
    borderRadius: '0 3px 3px 0',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderLeft: '1px solid transparent',
    corsor: 'pointer',
    display: 'flex',
    alignItems: 'stretch',
  },
}))
export default class ZipInputBox extends React.Component {
  static defaultProps = {
    onZipChange: () => {},
  }

  constructor(props) {
    super(props)
    this.state = {
      zip: this.zipInit(props.loc),
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.loc.path !== this.props.loc.path) {
      this.setState({zip: this.zipInit(this.props.loc)})
    }
  }

  zipInit = loc => {
    let zip = loc.path.split(',').join('')
    // if at prefecture page, append prefectual capital to zip
    if (loc.path.split(',').length === 1) {
      zip += prefectualCapitals[loc.name]
    }
    this.props.onZipChange(zip)
    return zip
  }

  onChange = e => {
    this.props.onZipChange(e.target.value)
    this.setState({zip: e.target.value})
  }

  getAddressFromGPS = () => {
    return getGPS()
      .then(geocode)
      .then(parseGeocodeResults)
      .then(({zipcode = '', prefecture, city, town}) => {
        return [prefecture, city, town].join('') || zipcode.replace('-', '')
      })
  }

  onClickZipIcon = () => {
    if (this.zipRef) {
      this.zipRef.focus()
    }
  }

  onEnter = () => {
    const { service, history } = this.props
    const { zip } = this.state
    const query = {
      serviceId: service._id,
      zip,
    }
    this.props.sendLog(BQEventTypes.match_more.CLICK_SP_SEARCH, query)
    history.push(`/instant-results?${qs.stringify(query)}`)
  }

  render() {
    const { classes, service, loc } = this.props
    const { zip } = this.state
    const title = `${service.name}, ${loc.name}`

    return (
      <div className={classes.root}>
        <h3 className={classes.titleXS}>{title}</h3>
        <div className={classes.box}>
          <h3 className={classes.title}>{title}</h3>
          <div className={classes.message}>{service.description}</div>
          <div className={classes.zip}>
            <div className={classes.place} onClick={this.onClickZipIcon}>
              <PlaceIcon className={classes.icon} />
              <span className={classes.placeText}>場所</span>
            </div>
            <input ref={e => this.zipRef = e} name='zip' value={zip} className={classes.zipInput} placeholder='地名・郵便番号' onChange={this.onChange} />
          </div>
          <Button color='primary' variant='contained' className={classes.button} onClick={this.onEnter}>検索</Button>
        </div>
      </div>
    )
  }
}
