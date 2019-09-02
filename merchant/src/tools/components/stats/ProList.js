import React from 'react'
import moment from 'moment'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, FormControlLabel, IconButton, InputAdornment, LinearProgress, Menu, MenuItem, Switch, TextField } from '@material-ui/core'
import { List, ListItem, ListItemIcon, ListItemAvatar, ListItemSecondaryAction, ListItemText } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import { red, yellow } from '@material-ui/core/colors'
import SearchIcon from '@material-ui/icons/Search'
import AssessmentIcon from '@material-ui/icons/Assessment'
import WarningIcon from '@material-ui/icons//Warning'
import EmailIcon from '@material-ui/icons/Email'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import RefreshIcon from '@material-ui/icons/Refresh'

import { withApiClient } from 'contexts/apiClient'
import { loadAll } from 'tools/modules/profile'
import ChargeModal from 'tools/components/ChargeModal'
import UserAvatar from 'components/UserAvatar'
import Filter from 'tools/components/stats/Filter'
import { relativeTime } from 'lib/date'
import { webOrigin } from '@smooosy/config'

const LIMIT = 50

@withApiClient
@connect(
  state => ({
    admin: state.auth.admin,
    profiles: state.profile.profiles,
  }),
  { loadAll }
)
@withWidth()
@withTheme
@withRouter
export default class ProList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      profiles: [],
      query: '',
      pending: false,
      includeDeactive: false,
      limit: LIMIT,
      progress: 0,
      progressMode: 'indeterminate',
      selected: [],
    }
  }

  componentDidMount() {
    if (this.props.match.isExact) {
      this.load()
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.state.loaded && !prevProps.match.isExact && this.props.match.isExact) {
      this.load()
    }
  }

  load = (selected) => {
    const condition = selected || this.state.selected
    this.setState({progressMode: 'indeterminate'})
    this.props.loadAll({condition}).then(() => {
      this.setState({progressMode: 'determinate', loaded: true, selected: condition})
      this.filterLocal({})
    })
  }

  filterLocal = ({query, pending, includeDeactive}) => {
    const { profiles } = this.props
    query = query === undefined ? this.state.query : query
    pending = pending === undefined ? this.state.pending : pending
    includeDeactive = includeDeactive === undefined ? this.state.includeDeactive : includeDeactive
    this.setState({
      query,
      pending,
      includeDeactive,
      limit: LIMIT,
      profiles: profiles
        .filter(p => {
          return this.getSwitchResult(p, pending, includeDeactive) && this.getQueryResult(p, query)
        }),
    })
  }

  getSwitchResult = (profile, pending, includeDeactive) => {
    if (pending && includeDeactive) return false
    if (pending && !includeDeactive) return (!profile.deactivate && this.isPending(profile))
    if (includeDeactive) return true
    return !profile.deactivate
  }

  getQueryResult = (profile, query) => {
    const searchTargets = []
    searchTargets.push(profile.name, profile.address, profile.category, profile.pro.lastname, profile.pro.email, profile.pro.phone)
    const searchText = searchTargets.join()
    return query.split(/[\s\u3000]/).every(e => searchText.indexOf(e) !== -1)
  }

  isPending = (profile) => {
    const needCheckIdentification = (profile.pro.identification || {}).status === 'pending'
    const needCheckLicences = profile.licences && profile.licences.reduce((s, l) => s || l.status === 'pending', false)
    return needCheckIdentification || needCheckLicences
  }

  getStatusIcon = (profile) => {
    if (this.isPending(profile)) {  // pending
      return <div style={{display: 'flex', alignItems: 'start'}}>{profile.pro.identification.uploadedAt ? relativeTime(new Date(profile.pro.identification.uploadedAt)) : ''}<WarningIcon style={{color: yellow[800]}} /></div>
    } else if (profile.suspend || profile.deactivate) {  // stopped
      return <WarningIcon style={{color: red[500]}} />
    }
    return null
  }

  handleDownload = (event) => {
    event.preventDefault()

    const { profiles, query } = this.state
    const lines = []
    for (let profile of profiles) {
      lines.push(
        [
          profile.category, profile.pro.email, profile.name, profile.address, profile.pro.phone,
          profile.url, `${webOrigin}/tools/#/stats/pro/${profile.id}`, `${webOrigin}/p/${profile.shortId}`,
        ].join(',')
      )
    }
    const csv = 'メインカテゴリ,メールアドレス,名前,住所,電話,URL,toolsページ,プロフィールページ\n' + lines.join('\n')
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([ bom, csv ], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const name = moment().format('YYYY-MM-DD_HH-mm-ss')
               + (query ? `_${query}` : '')
               + '.csv'
    link.setAttribute('download', name)
    link.click()

    this.setState({menuAnchor: null})
  }

  exportSendGird = () => {
    const profiles = this.state.profiles.map(p => p.id)
    if (profiles.length === 0) return

    const result = {
      new_count: 0,
      updated_count: 0,
    }
    const post = i => {
      this.setState({progress: 100 * 100 * (i + 1) / profiles.length})
      const slice = profiles.slice(100 * i, 100 * (i + 1))
      if (slice.length === 0) {
        alert(JSON.stringify(result, null, '    '))
        this.setState({progress: 0})
        return
      }

      this.props.apiClient
        .post('/api/admin/profiles/exportSendGrid', {profiles: slice})
      .then(res => {
        result.new_count += res.data.new_count
        result.updated_count += res.data.updated_count
      }).then(() => {
        post(i + 1)
      }).catch(e => {
        alert(e.message)
      })
    }
    post(0)
    this.setState({menuAnchor: null})
  }

  handleChangeText = (event) => {
    const query = event.target.value
    this.filterLocal({query})
  }

  filter = selected => {
    this.load(selected)
    this.setState({showFilter: false})
  }

  render() {
    const { profiles, query, limit, pending, showFilter, includeDeactive } = this.state
    const { admin, children, theme, width, match: { isExact } } = this.props
    const { grey } = theme.palette

    const styles = {
      root: {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: isExact ? 'flex' : 'none',
        flex: 1,
        flexDirection: width === 'xs' ? 'column' : 'row',
        background: grey[300],
      },
      main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      },
      head: {
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        display: 'flex',
        padding: '0px 10px',
        background: '#eee',
        position: 'relative',
      },
      progress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'transparent',
        zIndex: 2,
      },
      list: {
        padding: 0,
        background: '#fff',
        borderTop: `1px solid ${grey[300]}`,
        overflowX: 'hidden',
        flex: 1,
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
      },
    }

    return [
      <div key='list' style={styles.root}>
        <LinearProgress color='secondary' style={styles.progress} variant={this.state.progressMode} value={this.state.progress} />
        {(width !== 'xs' || showFilter) &&
          <Filter onSubmit={this.filter} withConditions type='pro' />
        }
        <div style={styles.main}>
          <div style={styles.head}>
            <Button onClick={() => this.filter()}>
              <RefreshIcon />
              {profiles.length}人表示
            </Button>
            <TextField
              style={{flex: 1, margin: '0 4px'}}
              placeholder='検索ワード'
              value={query}
              onChange={this.handleChangeText}
              type='search'
              InputProps={{
                startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment>,
              }}
            />
            <FormControlLabel
              control={<Switch color='primary' checked={!!pending} onChange={() => this.filterLocal({pending: !pending})} />}
              label='要確認'
            />
            <FormControlLabel
              control={<Switch color='primary' checked={!!includeDeactive} onChange={() => this.filterLocal({includeDeactive: !includeDeactive})} />}
              label='含退会'
            />
            {admin > 1 &&
              <IconButton onClick={e => this.setState({menuAnchor: e.currentTarget})}>
                <MoreVertIcon />
              </IconButton>
            }
            <Menu
              open={!!this.state.menuAnchor}
              anchorEl={this.state.menuAnchor}
              getContentAnchorEl={null}
              anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
              onClose={() => this.setState({menuAnchor: null})}
            >
              {width === 'xs' &&
                <MenuItem onClick={() => this.setState({showFilter: !showFilter, menuAnchor: null})}>
                  <ListItemIcon><SearchIcon /></ListItemIcon>
                  <ListItemText primary='詳細検索' />
                </MenuItem>
              }
              <MenuItem onClick={this.handleDownload}>
                <ListItemIcon><CloudDownloadIcon /></ListItemIcon>
                <ListItemText primary='CSVダウンロード' />
              </MenuItem>
              <MenuItem onClick={() => profiles.length < 1000 ? this.setState({charges: profiles, menuAnchor: null}) : window.alert('1000人未満に絞り込んでください')}>
                <ListItemIcon><AssessmentIcon /></ListItemIcon>
                <ListItemText primary='ROI表示' />
              </MenuItem>
              <MenuItem onClick={this.exportSendGird}>
                <ListItemIcon><EmailIcon /></ListItemIcon>
                <ListItemText primary='SendGridに追加' />
              </MenuItem>
            </Menu>
          </div>
          <List dense style={styles.list}>
            {
              profiles.slice(0, limit).map(p =>
                <ListItem button key={`profile_${p.id}`} component={Link} to={`/stats/pros/${p.id}`}>
                  <ListItemAvatar>
                    <UserAvatar size={40} user={p.pro} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${p.name}（${p.pro.lastname}）${admin > 1 ? `<${p.pro.email}>`: ''}`}
                    primaryTypographyProps={{variant: 'body1', color: 'textPrimary'}}
                    secondary={`${p.address} ${p.category}（${p.mainScore || 0}点）`}
                  />
                  <ListItemSecondaryAction>
                    {this.getStatusIcon(p)}
                  </ListItemSecondaryAction>
                </ListItem>
              )
            }
            {profiles.length > limit &&
              <Button color='primary' style={{width: '100%', height: 50}} onClick={() => this.setState({limit: limit + LIMIT})}>
                <ExpandMoreIcon />
                もっと見る
              </Button>
            }
          </List>
        </div>
        <ChargeModal open={!!this.state.charges} profiles={this.state.charges} onClose={() => this.setState({charges: false})} />
      </div>,
      children,
    ]
  }
}
