import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { withApiClient } from 'contexts/apiClient'
import { withStyles } from '@material-ui/core'
import { Button, CircularProgress, Chip, Avatar, ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary } from '@material-ui/core'

import LeftIcon from '@material-ui/icons/ChevronLeft'
import AddIcon from '@material-ui/icons/Add'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import SearchIcon from '@material-ui/icons/Search'

import { loadAll as loadServices } from 'modules/service'
import { load as loadProfile, loadAll as loadProfiles, update as updateProfile } from 'modules/profile'
import { open as openSnack } from 'modules/snack'

import { IncrementalElasticSearchProServiceAddService as IncrementalElasticSearch } from 'components/IncrementalElasticSearch'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ConfirmDialog from 'components/ConfirmDialog'
import { red } from '@material-ui/core/colors'

@withApiClient
@withStyles((theme) => ({
  loading: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  root: {
    height: '100%',
    background: theme.palette.grey[100],
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 50,
    padding: '0 20px',
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      padding: '0 10px',
    },
  },
  headerItem: {
    flex: 1,
  },
  backButton: {
    minWidth: 40,
  },
  wrap: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.grey[100],
    margin: '20px auto',
    maxWidth: 600,
    width: '90%',
  },
  main: {
    maxWidth: 800,
    marginBottom: '20px',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  subheader: {
    fontWeight: 'bold',
    fontSize: 17,
    margin: 10,
  },
  paper: {
    margin: 0,
    padding: 20,
    marginBottom: 30,
    background: theme.palette.common.white,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
    [theme.breakpoints.down('xs')]: {
      padding: 10,
      borderWidth: '1px 0',
    },
  },
  subtitle: {
    fontWeight: 'bold',
  },
  chip: {
    margin: 3,
    fontSize: 13,
    maxWidth: '80vw',
    overflowX: 'auto',
  },
  list: {
    fontSize: 13,
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
  },
  summary: {
    minHeight: 48,
  },
  currentServices: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  recommendServices: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  restServices: {
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      padding: 8,
      fontSize: '80%',
    },
  },
  add: {
    color: theme.palette.grey[100],
  },
  error: {
    color: red[500],
  },
  button: {
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
    height: 50,
    display: 'block',
  },
  searchHeader: {
    margin: '10px 0px',
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    top: 16,
    right: 10,
    color: theme.palette.grey[700],
  },
}))
@connect(
  state => ({
    services: state.service.services,
    profiles: state.profile.profiles,
    profile: state.profile.profile,
  }),
  { loadServices, loadProfile, loadProfiles, updateProfile, openSnack }
)
export default class ProServiceAddService extends React.Component {


  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
      currentServices: [],
      recommendServices: [],
    }
  }

  componentDidMount() {
    this.props.loadProfiles()
    this.props.loadServices()
    this.props.loadProfile(this.props.match.params.id)
      .then(({profile}) => {
        this.setState({currentServices: profile.services})
        this.search(profile.services)
      })
  }

  search = (currentServices) => {
    const tags = Array.from(new Set([].concat(...currentServices.map(s => s.tags)))).slice(0, 50)
    this.props.apiClient
      .get('/api/search/services', {params: {query: tags.join(' '), limit: 50}})
      .then(res => res.data.data)
      .then(recommends => {
        const currentIds = currentServices.map(s => s.id)
        this.setState({
          recommendServices: recommends.filter(s => !currentIds.includes(s.id)).slice(0, 10),
          loaded: true,
        })
      })
  }

  addService = (service) => {
    const { profiles, profile } = this.props
    const currentServices = this.state.currentServices
    const idList = currentServices.map(s => s.id)
    if (idList.indexOf(service.id) !== -1) return

    if (!this.state.dialogService) {
      for (let p of profiles) {
        if (p.id === profile.id) continue

        if (p.services.map(s => s.id).indexOf(service.id) !== -1) {
          this.setState({
            dialogService: service,
            dialogProfile: p,
          })
          return
        }
      }
    }

    currentServices.push(service)
    const body = {
      services: currentServices.map(s => s.id),
    }
    const id = this.props.profile.id
    return this.props.updateProfile(id, body).then(() => {
      this.props.openSnack('追加しました')
      this.props.history.push(`/account/services/${service.id}`)
    })
  }

  searchKeyword = (query) => {
    const { currentServices } = this.state
    return this.props.apiClient
      .get('/api/search/services', { params: { query } })
      .then(res => res.data.data)
      .then(services => {
        const currentIds = currentServices.map(s => s.id)
        return services.filter(s => !currentIds.includes(s.id))
      })
  }

  render () {
    const { classes } = this.props
    const { loaded, recommendServices, dialogService, dialogProfile } = this.state

    return (
      <AutohideHeaderContainer
        className={classes.root}
        header={
          <div className={classes.header}>
            <div className={classes.headerItem}>
              <Link to='/account/services'>
                <Button className={classes.backButton} ><LeftIcon /></Button>
              </Link>
            </div>
            <div>サービス追加</div>
            <div className={classes.headerItem} />
          </div>
        }
      >
        <div className={classes.wrap}>
          <div className={classes.main}>
            <div className={classes.searchHeader}>サービス名から検索</div>
            <div className={classes.searchWrap}>
              <IncrementalElasticSearch
                placeholder='例）写真・税理士・車'
                searchPromise={this.searchKeyword}
                onSelect={this.addService}
                displayName={service => service.name}
              />
              <SearchIcon className={classes.searchIcon} />
            </div>
            <ExpansionPanel defaultExpanded={true} classes={{root: classes.base, expanded: classes.expandedPanel}}>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} className={classes.summary}>おすすめから追加</ExpansionPanelSummary>
              <ExpansionPanelDetails className={classes.recommendServices}>
                {
                  !loaded ?
                    <div className={classes.loading}>
                      <CircularProgress />
                    </div>
                  : recommendServices.length === 0 ? 'なし' :
                  recommendServices.map(s => (
                    <Chip
                      key={`service_${s.id}`}
                      className={classes.chip}
                      onClick={() => this.addService(s)}
                      label={s.name}
                      classes={{label: classes.chipLabel}}
                      avatar={
                        <Avatar alt='追加' className={classes.add}>
                          <AddIcon />
                        </Avatar>
                      }
                      />
                  ))
                }
              </ExpansionPanelDetails>
            </ExpansionPanel>
          </div>
          <ConfirmDialog
            title='このサービスは別のプロフィールに含まれています'
            open={!!dialogService}
            onSubmit={() => this.addService(dialogService)}
            onClose={() => this.setState({dialogService: false, dialogProfile: false})}
          >
            「{dialogProfile ? dialogProfile.name : ''}」から削除してこちらに追加しますか？
          </ConfirmDialog>
        </div>
      </AutohideHeaderContainer>

    )
  }
}
