import React from 'react'
import qs from 'qs'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Button, Dialog, NoSsr } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import SearchIcon from '@material-ui/icons/Search'
import LocationIcon from '@material-ui/icons/LocationOn'

import { withApiClient } from 'contexts/apiClient'
import { updateGlobalSearch, loadAll as loadAllServices } from 'modules/service'
import { IncrementalElasticSearchGlobal, IncrementalElasticSearchGlobalDialog } from 'components/IncrementalElasticSearch'
import TextInput from 'components/form/renderTextInput'

@withApiClient
@connect(
  state => ({
    allServices: state.service.allServices.filter(s => s.enabled),
    globalSearch: state.service.globalSearch,
  }),
  { updateGlobalSearch, loadAllServices }
)
@withStyles(theme => ({
  root: {
    display: 'flex',
    height: '100%',
    padding: '0 10px',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  hide: {
    display: 'none',
    visibility: 'hidden',
  },
  zip: {
    fontWeight: 'bold',
    minWidth: 120,
    borderRadius: 0,
  },
  button: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    boxShadow: 'none',
  },
  mobileRoot: {
    maxWidth: 300,
    flex: 1,
    display: 'none',
    alignItems: 'center',
    cursor: 'text',
    height: 40,
    padding: 5,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
    },
  },
  mobileService: {
    color: theme.palette.common.black,
    width: 0, // https://stackoverflow.com/q/42421361#comment80373699_42421490
    fontSize: 14,
    fontWeight: 'bold',
    flex: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    outline: 0,
    border: 0,
  },
  mobileZip: {
    width: 0,
    flex: 2,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    outline: 0,
    border: 0,
  },
  dialog: {
    padding: 10,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  dialogField: {
    flex: 1,
    marginLeft: 10,
  },
  dialogInput: {
    height: 40,
    fontSize: 15,
    width: '100%',
  },
  verticalDivider: {
    width: 1,
    margin: '0 5px',
    height: '90%',
    background: theme.palette.grey[300],
  },
  searchIcon: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 20,
    },
  },
}))
@withRouter
export default class GlobalSearch extends React.PureComponent {
  state = {
    openDialog: false,
  }

  constructor(props) {
    super(props)
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    const globalSearch = {}
    if (query.zip) globalSearch.zip = query.zip
    const service = props.allServices.find(s => s._id === query.serviceId)
    if (service) globalSearch.service = service

    if (Object.keys(globalSearch).length) {
      props.updateGlobalSearch(globalSearch)
    }
  }

  componentDidMount() {
    this.props.loadAllServices()
  }

  componentDidUpdate(prevProps) {
    const prevQuery = qs.parse(prevProps.location.search, {ignoreQueryPrefix: true})
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    const globalSearch = {}
    if (query.zip && prevQuery.zip !== query.zip) {
      globalSearch.zip = query.zip
    }
    if (query.serviceId && prevQuery.serviceId !== query.serviceId) {
      const service = this.props.allServices.find(s => s._id === query.serviceId)
      if (service) globalSearch.service = service
    }

    if (Object.keys(globalSearch).length) {
      this.props.updateGlobalSearch(globalSearch)
    }
  }

  search = (query) => {
    return this.props.apiClient
      .get('/api/search/services', { params: { query } })
      .then(res => res.data.data)
  }

  onSelectService = service => {
    this.props.updateGlobalSearch({service})
  }

  onZipChange = e => {
    this.props.updateGlobalSearch({zip: e.target.value})
  }

  submit = e => {
    e.preventDefault()
    this.setState({openDialog: false})
    const { service, zip } = this.props.globalSearch
    if (!service) {
      return
    }

    if (service.matchMoreEnabled) {
      this.props.history.push(`/instant-results?serviceId=${service._id}&zip=${zip || ''}`)
    } else {
      this.props.history.push(`/services/${service.key}?modal=true&zip=${zip || ''}`)
    }
  }

  renderDisplayName = service => service.name
  filterIncrementalService = service => service.enabled

  render() {
    const { hide, globalSearch: { service, zip }, classes } = this.props

    const rootClass = [ classes.root ]
    const mobileRootClass = [ classes.mobileRoot ]
    if (hide) {
      rootClass.push(classes.hide)
      mobileRootClass.push(classes.hide)
    }
    const incrementalValue = service ? service.name : ''

    return (
      <NoSsr>
        <form className={rootClass.join(' ')} onSubmit={this.submit}>
          <IncrementalElasticSearchGlobal
            value={incrementalValue}
            placeholder='お探しのサービス'
            searchPromise={this.search}
            onSelect={this.onSelectService}
            displayName={this.renderDisplayName}
            filter={this.filterIncrementalService}
          />
          <TextInput
            input={{value: zip}}
            inputClass={classes.zip}
            onChange={this.onZipChange}
            placeholder='〒・地名'
          />
          <Button
            variant='contained'
            color='primary'
            type='submit'
            className={classes.button}
          >
            <SearchIcon />
          </Button>
        </form>
        <div className={mobileRootClass.join(' ')} onClick={() => this.setState({openDialog: true})}>
          <SearchIcon className={classes.searchIcon} />
          <input className={classes.mobileService} placeholder='サービス選択' value={incrementalValue} readOnly />
          <div className={classes.verticalDivider} />
          <input className={classes.mobileZip} placeholder='〒・地名' value={zip} readOnly />
        </div>
        <Dialog
          fullScreen
          open={!!this.state.openDialog}
          onClose={() => this.setState({openDialog: false})}
          classes={{paper: classes.dialog}}
        >
          <div className={classes.row}>
            <Button color='primary' onClick={() => this.setState({openDialog: false})}>
              キャンセル
            </Button>
            <Button color='primary' onClick={this.submit}>
              検索する
            </Button>
          </div>
          <div className={classes.row}>
            <SearchIcon />
            <IncrementalElasticSearchGlobalDialog
              value={incrementalValue}
              placeholder='お探しのサービス'
              searchPromise={this.search}
              onSelect={this.onSelectService}
              displayName={this.renderDisplayName}
              filter={this.filterIncrementalService}
            />
          </div>
          <div className={classes.row}>
            <LocationIcon />
            <TextInput
              rootClass={classes.dialogField}
              inputClass={classes.dialogInput}
              input={{value: zip}}
              onChange={this.onZipChange}
              placeholder='〒・地名'
            />
          </div>
        </Dialog>
      </NoSsr>
    )
  }
}
