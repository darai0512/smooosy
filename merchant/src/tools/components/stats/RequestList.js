import React from 'react'
import moment from 'moment'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { Button, FormControlLabel, IconButton, InputAdornment, LinearProgress, Switch, TextField, Typography } from '@material-ui/core'
import { Table, TableBody, TableCell, TableRow } from '@material-ui/core'
import { Menu, MenuItem, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListSubheader, ListItemText } from '@material-ui/core'
import { Dialog, DialogContent, DialogTitle } from '@material-ui/core'
import { indigo } from '@material-ui/core/colors'

import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import { addAttributionTags } from 'lib/util'

import AssessmentIcon from '@material-ui/icons/Assessment'
import AssignmentIcon from '@material-ui/icons/Assignment'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ContactPhoneIcon from '@material-ui/icons/ContactPhone'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import HighlightOffIcon from '@material-ui/icons/HighlightOff'
import NotInterestedIcon from '@material-ui/icons/NotInterested'
import RefreshIcon from '@material-ui/icons/Refresh'
import SearchIcon from '@material-ui/icons/Search'
import WarningIcon from '@material-ui/icons/Warning'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import { yellow, green } from '@material-ui/core/colors'

import { loadAll } from 'tools/modules/request'
import { open as openSnack } from 'tools/modules/snack'
import CustomChip from 'components/CustomChip'
import Filter from 'tools/components/stats/Filter'
import { payment, MeetStatusType, FlowTypes } from '@smooosy/config'

const LIMIT = 50

moment.updateLocale('en', {weekdays: ['日', '月', '火', '水', '木', '金', '土']})

@withWidth()
@connect(
  state => ({
    requests: state.request.requests,
    admin: state.auth.admin,
  }),
  { loadAll, openSnack }
)
@withTheme
@withRouter
export default class RequestList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      requests: [],
      limit: LIMIT,
      conditions: [
        {
          name: 'createdAt',
          data: [
            moment().subtract(2, 'week').format('YYYY-MM-DD'),
            moment().format('YYYY-MM-DD'),
          ],
        },
      ],
      cond: {
        hired: false,
        corporation: false,
        truthy: false,
        warning: false,
        deactivate: false,
        mostValuable: false,
      },
      services: [],
      progressMode: 'indeterminate',
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

  load = (conditions) => {
    this.setState({progressMode: 'indeterminate'})
    conditions = conditions || this.state.conditions
    this.props.loadAll(conditions).then(datas => {
      this.setState({
        loaded: true,
        progressMode: 'determinate',
        conditions,
        showFilter: false,
      })
      this.needSupport(datas.requests)
      this.addAttributionTags(datas.requests)
      this.filter()
    })
    .catch(err => {
      this.setState({
        requests: [],
        progressMode: 'determinate',
      })
      this.props.openSnack(err.message ? err.message : 'エラーが発生しました')
    })
  }

  filter = (newCond) => {
    const cond = {...this.state.cond, ...newCond}

    let requests =
      this.props.requests.filter(r => {
        const searchTargets = [
          r._id, r.customer.lastname, r.customer.firstname, r.address, r.service.name, r.phone,
          r.customer.email, ...r.service.tags, ...r.meets.map(m => m._id), ...r.meets.map(m => m.profile ? m.profile.name : ''),
        ]
        const searchText = searchTargets.join()
        return (
          (!cond.hired || this.isHired(r)) &&
          (!cond.corporation || r.customer.corporation) &&
          (!cond.truthy || (!r.interview.length && !r.deleted)) &&
          (!cond.warning || (r.needSupport && r.supportStatus !== 'supported')) &&
          (!cond.deactivate || r.customer.requestDeactivate) &&
          (!cond.query || cond.query.split(/[\s\u3000]/).every(e => searchText.includes(e)))
        )
      })

    if (cond.mostValuable) {
      // only keep open, unexpired requests with phone numbers that have
      // unread meets
      requests = requests.filter(r => {
        return r.status == 'open' &&
          r.phone &&
          moment(r.createdAt).isAfter(moment().subtract(4, 'days')) &&
          this.requestValue(r)
      })

      // Sort by newest, then by those with highest value
      requests = requests.sort((a, b) => {
        if (
          moment(a.createdAt).startOf('day') >
          moment(b.createdAt).startOf('day')
        ) {
          return -1
        }

        return this.requestValue(b) - this.requestValue(a)
      })
    }

    this.setState({
      requests,
      limit: LIMIT,
      cond,
    })
  }

  isHired = r => r.status === 'close' || r.additionalStatus === 'hired'

  requestValue = r => r.meets.reduce((sum, m) => {
    return sum + (m.read ? 0 : m.point) * payment.pricePerPoint.profit
  }, 0)

  showStats = () => {
    let services = []
    for (let r of this.state.requests) {
      const i = services.map(s => s._id).indexOf(r.service._id)
      if (i === -1) {
        services.push({
          ...r.service,
          count: 1,
          active: r.meets.length > 0 ? 1 : 0,
          hired: this.isHired(r) ? 1 : 0,
        })
      } else {
        services[i].count += 1
        if (r.meets.length > 0) services[i].active += 1
        if (this.isHired(r)) services[i].hired += 1
      }
    }
    services.sort((a, b) => b.count - a.count)

    this.setState({
      services,
      stats: true,
    })
  }

  needSupport = (requests) => {
    for (const r of requests) {
      const today = moment()
      const isLimit = r.limitDate ? moment(r.limitDate).diff(today, 'days') < 0 : true

      // フォローが必要(電話番号ありのみ)
      // 締め切り過ぎたものは含まない
      if (!r.phone || r.status !== 'open' || isLimit) continue

      for (const m of r.meets) {
        if (m.chatStatus === MeetStatusType.RESPONDED) {
          continue
        }
        // 初回の未読・既読になって3日以上たつ依頼
        if (moment().diff(m.createdAt, 'days') >= 3) {
          r.needSupport = true
          break
        }
      }

      // 日時締め切りのある場合は、未成約で3日前を切っている依頼
      if (r.limitDate && moment(r.limitDate).diff(today, 'days') <= 3) {
        r.needSupport = true
      }
    }
  }

  addAttributionTags = (requests) => {
    for (const r of requests) {
      addAttributionTags(r)
    }
  }

  render() {
    const { requests, limit, conditions, cond, services, showFilter } = this.state
    const { admin, children, theme, width, match: { isExact } } = this.props

    const { grey, primary, secondary, red } = theme.palette

    const styles = {
      root: {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: isExact ? 'flex' : 'none',
        flexDirection: width === 'xs' ? 'column' : 'row',
        flex: 1,
        background: theme.palette.grey[300],
      },
      head: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '5px 10px',
        background: grey[200],
        borderBottom: `1px solid ${grey[300]}`,
      },
      progress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'transparent',
      },
      control: {
        margin: '0px 5px',
      },
      subheader: {
        background: 'rgba(255, 255, 255, .8)',
        lineHeight: 2,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
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
      main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      },
      column: {
        height: 'initial',
        overflow: 'initial',
        whiteSpace: 'initial',
        textOverflow: 'initial',
      },
      matchmore: {
        background: indigo[500],
        color: theme.palette.common.white,
        marginRight: 5,
        verticalAlign: 'bottom',
      },
    }


    const group = {}
    const groupCount = {}
    let i = 0
    for (let r of requests) {
      const key = moment(r.createdAt).format('YYYY年MM月DD日 (dddd)')
      groupCount[key] = (groupCount[key] || 0) + 1
      if (i < limit) {
        if (!group[key]) group[key] = []
        group[key].push(r)
      }
      i++
    }

    return [
      <div key='list' style={styles.root}>
        {(width !== 'xs' || showFilter) &&
          <Filter initialValues={conditions} onSubmit={conditions => this.load(conditions)} style={{border: '1px solid #ddd'}} type='request' withConditions />
        }
        <div style={styles.main}>
          <div style={styles.head}>
            <LinearProgress color='secondary' style={styles.progress} variant={this.state.progressMode} value={0} />
            <Button onClick={() => this.load()}>
              <RefreshIcon />
              {requests.length}件表示
            </Button>
            <TextField
              style={{width: 250, margin: '0 5px'}}
              placeholder='検索ワード'
              onChange={e => this.filter({query: e.target.value})}
              type='search'
              InputProps={{
                startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment>,
              }}
            />
            <FormControlLabel
              label='成約(?)'
              style={styles.control}
              control={<Switch color='primary' checked={cond.hired} onChange={(e, hired) => this.filter({hired})} />}
            />
            <FormControlLabel
              label='法人'
              style={styles.control}
              control={<Switch color='primary' checked={cond.corporation} onChange={(e, corporation) => this.filter({corporation})} />}
            />
            <FormControlLabel
              label='真正'
              style={styles.control}
              control={<Switch color='primary' checked={cond.truthy} onChange={(e, truthy) => this.filter({truthy})} />}
            />
            <FormControlLabel
              label='要聞き取り'
              style={styles.control}
              control={<Switch color='primary' checked={cond.warning} onChange={(e, warning) => this.filter({warning})} />}
            />
            <FormControlLabel
              label='退会要請'
              style={styles.control}
              control={<Switch color='primary' checked={cond.deactivate} onChange={(e, deactivate) => this.filter({deactivate})} />}
            />
            <FormControlLabel
              label='未読売上'
              style={styles.control}
              control={<Switch color='primary' checked={cond.mostValuable} onChange={(e, mostValuable) => this.filter({mostValuable})} />}
            />
            <IconButton onClick={e => this.setState({menuAnchor: e.currentTarget})}>
              <MoreVertIcon />
            </IconButton>
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
              {admin > 1 &&
                <MenuItem onClick={() => this.showStats()}>
                  <ListItemIcon><AssessmentIcon /></ListItemIcon>
                  <ListItemText primary='成約率表示' />
                </MenuItem>
              }
            </Menu>
          </div>
          <List style={styles.list}>
            {Object.keys(group).map((month, i) =>
              <div key={i}>
                <ListSubheader style={styles.subheader}>{month} {groupCount[month]}件</ListSubheader>
                {group[month].map(r =>
                  <ListItem button style={{diapley: 'flex', flexDirection: 'column', alignItems: 'stretch'}} key={`request_${r._id}`} value={r._id} component={Link} to={`/stats/requests/${r._id}`}>
                    <ListItemText
                      primary={
                        <>
                          <Typography variant='body1' style={{color: grey[900], display: 'flex', justifyContent: 'space-between'}}>
                            <div>
                              {r.flowType === FlowTypes.PPC && <CustomChip style={styles.matchmore} label='ご指名' />}
                              {r.customer.lastname} {r.customer.firstname}{r.customer.corporation ? '【法人】' : ''}
                              {r.service.name} {r.point}pt
                              <span style={{fontWeight: 'bold', marginLeft: 5}}>
                                {this.requestValue(r) ? `${this.requestValue(r).toLocaleString()}円` : ''}
                              </span>
                              {(r.tags && r.tags.length) ? r.tags.map(t =>
                                <CustomChip
                                key={t}
                                style={{background: '#FFB500'}}
                                label={t} />
                              ) : ''}
                            </div>
                            <div>{moment(r.createdAt).format('HH:mm')}</div>
                          </Typography>
                          <Typography variant='body2' style={{color: grey[600]}}>
                            {r.address} {r.customer.email} {r.phone}
                          </Typography>
                          <Typography style={{display: 'block', color: grey[800]}}>
                            {r.meets.length ? r.meets.map(m =>
                              <CustomChip key={m._id} style={{background: m.hiredAt ? primary.main : m.status === 'exclude' ? secondary.main : grey[400], marginRight: 5}} label={m.profile.name} />
                            ) : '応募なし'}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction style={{display: 'flex', flexDirection: 'column'}}>
                      {r.deleted ?
                        <HighlightOffIcon style={{color: red[500]}} />
                      : r.status === 'close' ?
                        <CheckCircleIcon style={{color: primary.main}} />
                      : r.additionalStatus === 'hired' ?
                        <CheckCircleIcon style={{color: grey[600]}} />
                      : r.customer.requestDeactivate ?
                        <AccountBoxIcon style={{color: red[500]}} />
                      : r.status === 'suspend' ?
                        <NotInterestedIcon style={{color: red[500]}} />
                      : r.interview.length ?
                        <AssignmentIcon style={{color: red[500]}} />
                      : null}
                      {r.needSupport &&
                        <WarningIcon style={{color: yellow[800]}} />
                      }
                      {r.supportStatus === 'supported' &&
                        <ContactPhoneIcon style={{color: green[500]}} />
                      }
                    </ListItemSecondaryAction>
                  </ListItem>
                )}
              </div>
            )}
            {requests.length > limit &&
              <Button color='primary' style={{width: '100%', height: 50}} onClick={() => this.setState({limit: limit + LIMIT})}>
                <ExpandMoreIcon />
                もっと見る
              </Button>
            }
          </List>
          <Dialog
            open={!!this.state.stats}
            onClose={() => this.setState({stats: false})}
          >
            <DialogTitle>サービスごとの成約率</DialogTitle>
            <DialogContent>
              <div style={{marginBottom: 10, fontSize: 13}}>*: 見積もり0を除く</div>
              <Table>
                <TableBody>
                  <TableRow style={{height: 'initial'}}>
                    <TableCell style={{...styles.column, width: 250}} />
                    <TableCell style={styles.column}>依頼数</TableCell>
                    <TableCell style={styles.column}>依頼数*</TableCell>
                    <TableCell style={styles.column}>成約数</TableCell>
                    <TableCell style={styles.column}>成約率</TableCell>
                    <TableCell style={styles.column}>成約率*</TableCell>
                  </TableRow>
                  <TableRow style={{height: 'initial'}}>
                    <TableCell style={styles.column}>合計</TableCell>
                    <TableCell style={styles.column}>{requests.length}</TableCell>
                    <TableCell style={styles.column}>{requests.filter(r => r.meets.length > 0).length}</TableCell>
                    <TableCell style={styles.column}>{requests.filter(r => this.isHired(r)).length}</TableCell>
                    <TableCell style={styles.column}>{(Math.round(requests.filter(r => this.isHired(r)).length / requests.length * 1000) / 10).toString()}</TableCell>
                    <TableCell style={styles.column}>{(Math.round(requests.filter(r => this.isHired(r)).length / requests.filter(r => r.meets.length > 0).length * 1000) / 10).toString()}</TableCell>
                  </TableRow>
                  {services.map(s =>
                    <TableRow key={s._id} style={{height: 'initial'}}>
                      <TableCell style={styles.column}>{s.name}</TableCell>
                      <TableCell style={styles.column}>{s.count}</TableCell>
                      <TableCell style={styles.column}>{s.active}</TableCell>
                      <TableCell style={styles.column}>{s.hired}</TableCell>
                      <TableCell style={styles.column}>{(Math.round(s.hired / s.count * 1000) / 10).toString()}</TableCell>
                      <TableCell style={styles.column}>{(Math.round(s.hired / s.active * 1000) / 10).toString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
        </div>
      </div>,
      children,
    ]
  }
}
