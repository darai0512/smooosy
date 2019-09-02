import React from 'react'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { FormControlLabel, Switch, Avatar, Typography, Button } from '@material-ui/core'
import { List, ListSubheader, ListItem, ListItemText, ListItemAvatar } from '@material-ui/core'
import { red, blue, brown, purple } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/core/styles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { withApiClient } from 'contexts/apiClient'
import { MeetStatusType } from '@smooosy/config'

const getMeetAvatar = (meet, theme) => {
  const { primary, secondary } = theme.palette
  const status = {
    [MeetStatusType.DELETED]: { color: red[500], text: '削除' },
    [MeetStatusType.CANCELED]: { color: red[500], text: 'Cancel' },
    [MeetStatusType.HIRED]: { color: primary.main, text: '成約' },
    [MeetStatusType.EXCLUDED]: { color: secondary.main, text: '除外' },
    [MeetStatusType.CLOSED]: { color: secondary.main, text: '他プロ' },
    [MeetStatusType.UNREAD]: { color: brown[600], text: '未読' },
    [MeetStatusType.RESPONDED]: { color: blue[400], text: '交渉中' },
    [MeetStatusType.READ]: { color: purple[500], text: 'スルー'  },
  }
  return status[MeetStatusType.getMeetStatus(meet)]
}

const LIMIT = 50

@withApiClient
@withStyles(theme => ({
  subheader: {
    background: 'rgba(255, 255, 255, .8)',
    height: 40,
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    padding: '0 10px',
  },
  grey: {
    color: theme.palette.grey[600],
  },
}), { withTheme: true })
export default class ReceiveRequestsTab extends React.Component {
  state = {
    avatarCount: {},
    limit: LIMIT,
    receiveGroup: {},
    showRequests: true,
    showMeets: true,
  }

  constructor(props) {
    super(props)
    this.loadReceive()
  }

  loadReceive = () => {
    if (this.state.receive) return
    this.props.apiClient.get(`/api/admin/profiles/${this.props.profile.id}/receive`)
      .then(res => res.data)
      .then(receive => this.filter({receive}))
  }

  filter = ({receive, showRequests, showMeets, limit}) => {
    showRequests = showRequests !== undefined ? showRequests : this.state.showRequests
    showMeets = showMeets !== undefined ? showMeets : this.state.showMeets
    receive = receive || this.state.receive || []
    limit = limit || this.state.limit

    const receiveGroup = {}
    const groupCount = {}
    const avatarCount = {
      '未返信': 0,
      '成約': 0,
      '交渉中': 0,
      'スルー': 0,
      '他プロ': 0,
      '除外': 0,
      '未読': 0,
      '削除': 0,
      'Cancel': 0,
    }
    let i = 0
    for (let r of receive) {
      r.avatar = this.chooseAvatar(r)
      avatarCount[r.avatar.key || r.avatar.text] += 1
      if (!showRequests && !r.chats) continue
      if (!showMeets && r.chats) continue
      const key = moment(r.createdAt).format('YYYY年MM月')
      groupCount[key] = (groupCount[key] || 0) + 1
      if (i < limit) {
        if (!receiveGroup[key]) receiveGroup[key] = []
        receiveGroup[key].push(r)
      }
      i++
    }

    this.setState({
      receive,
      receiveGroup,
      groupCount,
      avatarCount,
      showRequests,
      showMeets,
      limit,
    })
  }

  showMoreReceives = () => {
    this.filter({limit: this.state.limit + LIMIT})
  }

  chooseAvatar = r => {
    const { grey } = this.props.theme.palette

    if (!r.chats) {
      const res = { color: grey[400], key: '未返信' }
      if (r.deleted) {
        res.text = '削除'
      } else if (r.status === 'close') {
        res.text = '成約'
      } else if (r.status === 'suspend') {
        res.text = 'Cancel'
      } else if (moment().diff(r.createdAt, 'day') >= 4) {
        res.text = '期限切'
      } else {
        res.text = '募集中'
      }
      return res
    }

    return getMeetAvatar(r, this.props.theme)
  }

  render() {
    const { classes } = this.props
    const { receive, receiveGroup, groupCount, avatarCount, showRequests, showMeets, limit } = this.state

    if (!receive) return null

    return (
      <div>
        <div style={{display: 'flex', padding: '0 10px'}}>
          <FormControlLabel
            label={`未返信(${avatarCount['未返信']})`}
            control={<Switch color='primary' checked={showRequests} onChange={(e, showRequests) => this.filter({showRequests})} />}
          />
          <FormControlLabel
            label={`見積もり(${receive.length - avatarCount['未返信']})`}
            control={<Switch color='primary' checked={showMeets} onChange={(e, showMeets) => this.filter({showMeets})} />}
          />
        </div>
        <div style={{fontSize: 13, display: 'flex', flexWrap: 'wrap', alignItems: 'center', padding: '0 10px'}}>
          {Object.keys(avatarCount).map((key, i) =>
            key === '未返信' ? null : <div key={i} style={{marginRight: 10}}>{key}{avatarCount[key]}({Math.round(avatarCount[key] / (receive.length - avatarCount['未返信']) * 1000) / 10}%)</div>
          )}
        </div>
        <List style={{padding: 0}}>
          {Object.keys(receiveGroup).map((month, i) =>
            <div key={i}>
              <ListSubheader className={classes.subheader}>{month} ({groupCount[month]})</ListSubheader>
              {receiveGroup[month].map((r, j) =>
                <ListItem key={j} button style={{diapley: 'flex', padding: '5px 10px'}} component={Link} to={`/stats/requests/${r.id}`}>
                  <ListItemAvatar>
                    <Avatar style={{fontSize: 13, background: r.avatar.color}}>{r.avatar.text}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <div>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <div>{r.customer.lastname} {r.point}pt{r.refund && '(返還)'}</div>
                          <div>{moment(r.createdAt).format('MM/DD (dddd) HH:mm')}</div>
                        </div>
                        <Typography variant='body1' className={classes.grey}>{r.service.name} {r.address}</Typography>
                      </div>
                    }
                  />
                </ListItem>
              )}
            </div>
          )}
          {receive && receive.length > limit &&
            <Button color='primary' style={{width: '100%', height: 50}} onClick={() => this.showMoreReceives()}>
              <ExpandMoreIcon />
              もっと見る
            </Button>
          }
        </List>
      </div>
    )
  }
}
