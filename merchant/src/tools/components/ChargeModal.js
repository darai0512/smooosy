import React from 'react'
import moment from 'moment'
import { Dialog, Button, IconButton } from '@material-ui/core'
import Slide from '@material-ui/core/Slide'
import CloseIcon from '@material-ui/icons/Close'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'

import { withApiClient } from 'contexts/apiClient'
import EnhancedTable from 'components/EnhancedTable'
import { relativeTime } from 'lib/date'
import { payment } from '@smooosy/config'

const Frac = (props) => (
  <span style={{display: 'inline-block', verticalAlign: '-0.5em', textAlign: 'center', ...(props.style || {})}}>
    <span style={{display: 'block', lineHeight: '1em', padding: '0.1em'}}>{props.num}</span>
    <span style={{display: 'block', lineHeight: '1em', padding: '0.1em', borderTop: '1px solid'}}>{props.denom}</span>
  </span>
)

const transition = props => <Slide direction='up' {...props} />

@withApiClient
export default class ChargeModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidUpdate(prevProps) {

    if (!prevProps.open && this.props.open) {
      const ids = []
      const users = []
      for (let profile of this.props.profiles) {
        const index = ids.indexOf(profile.pro.id)
        if (index === -1) {
          users.push({
            ...profile.pro,
            profiles: [profile],
          })
          ids.push(profile.pro.id)
        } else {
          users[index].profiles.push(profile)
        }
      }

      const body = {users: ids}
      this.props.apiClient.post('/api/admin/users/stats', body).then(({data}) => {
        const total = {
          lastname: '総計',
          profiles: [],
          stats: {
            sent: [],
            total: 0,
            hired: 0,
            price: 0,
            point: 0,
            bought: 0,
            limited: 0,
          },
        }
        for (let i in users) {
          users[i].stats = data[i]
          total.stats.total += data[i].total
          total.stats.hired += data[i].hired
          total.stats.price += data[i].price
          total.stats.point += data[i].point
          total.stats.bought += data[i].bought
          total.stats.limited += data[i].limited
        }
        users.sort((a, b) => b.stats.point - a.stats.point)
        users.unshift(total)
        this.setState({users})
      })
    }
  }

  handleDownload = (event) => {
    event.preventDefault()
    const users = this.state.users.slice(1)
    const { query, category } = this.props

    const lines = []
    for (let user of users) {
      lines.push([
        user.lastname,
        user.firstname,
        user.email,
        user.phone,
        moment(user.createdAt).format('YYYY-MM-DD'),
        user.lastAccessedAt ? moment(user.lastAccessedAt).format('YYYY-MM-DD') : '-',
        user.stats.lastMeetAt ? moment(user.stats.lastMeetAt).format('YYYY-MM-DD') : '-',
        ...[].concat(user.stats.sent.map(([meet, request]) => [
          meet, request, meet / (meet + request) || 0,
        ])),
        user.stats.total,
        user.stats.hired,
        user.stats.limited * payment.pricePerPoint.withTax,
        user.stats.bought,
        user.stats.price,
        user.stats.point * payment.pricePerPoint.withTax,
        user.stats.point * payment.pricePerPoint.withTax / user.stats.price || 0,
        user.profiles[0].name,
        user.profiles[0].mainCategory.name,
        user.profiles[0].prefecture,
        user.profiles[0].city,
        user.profiles[0].url,
      ].join(','))
      if (user.profiles.length > 1) {
        for (let i = 1; i < user.profiles.length; i++) {
          lines.push([
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            user.profiles[i].name,
            user.profiles[i].mainCategory.name,
            user.profiles[i].prefecture,
            user.profiles[i].city,
            user.profiles[i].url,
          ].join(','))
        }

      }
    }

    const thisMonth = moment().get('month') + 1
    const csv = `苗字,名前,メールアドレス,電話,登録日,最終アクセス,最終見積もり,${thisMonth-2}月の見積もり数,${thisMonth-2}月の依頼数,${thisMonth-2}月の見積もり率,${thisMonth-1}月の見積もり数,${thisMonth-1}月の依頼数,${thisMonth-1}月の見積もり率,${thisMonth}月の見積もり数,${thisMonth}月の依頼数,${thisMonth}月の見積もり率,課金見積もり数,課金成約数,無料ポイント額,課金額,成約金額,利用ポイント額,手数料,プロフィール名,メインカテゴリ,都道府県,市区町村,URL\n` + lines.join('\n')
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([ bom, csv ], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const name = moment().format('YYYY-MM-DD_HH-mm-ss')
               + (category ? `_${category}` : '') + (query ? `_${query}` : '')
               + '.csv'
    link.setAttribute('download', name)
    link.click()
  }

  render() {
    const { users } = this.state
    const { open, onClose } = this.props

    const columns = [
      {
        id: 'lastname',
        label: '名前',
        render: user => (
          <div>
            <p style={{fontWeight: 'bold'}}>{user.lastname} {user.firstname}</p>
            <p style={{fontSize: 13}}>{user.profiles.map(p => p.name).join(', ')}</p>
          </div>
        ),
      },
      {
        id: 'createdAt',
        label: '登録日',
        sort: user => new Date(user.createdAt),
        render: user => relativeTime(new Date(user.createdAt)),
      },
      {
        id: 'lastAccessedAt',
        label: '最終アクセス',
        sort: user => user.lastAccessedAt ? new Date(user.lastAccessedAt) : new Date(0),
        render: user => user.lastAccessedAt ? relativeTime(new Date(user.lastAccessedAt)) : '-',
      },
      {
        id: 'lastMeetAt',
        label: '最終見積もり',
        sort: user => user.stats.lastMeetAt ? new Date(user.stats.lastMeetAt) : new Date(0),
        render: user => user.stats.lastMeetAt ? relativeTime(new Date(user.stats.lastMeetAt)) : '-',
      },
      {
        id: 'meets',
        label: '過去3ヶ月見積もり',
        render: user => user.stats.sent.map(([meet, request], i) =>
          <Frac key={i} num={meet} denom={meet + request} style={{marginRight: 10}} />
        ),
      },
      {
        id: 'hiredRate',
        label: '成約率',
        render: user => (
          <div>
            <Frac num={user.stats.hired} denom={user.stats.total} />
            {' = '}
            {user.stats.total ? Math.round(user.stats.hired / user.stats.total * 10000) / 100 : 0}%
          </div>
        ),
      },
      {
        id: 'price',
        label: '成約金額',
        sort: user => user.stats.price,
        render: user => `${user.stats.price.toLocaleString()}円`,
      },
      {
        id: 'point',
        label: '利用ポイント',
        sort: user => user.stats.point * payment.pricePerPoint.withTax,
        render: user => `${(user.stats.point * payment.pricePerPoint.withTax).toLocaleString()}円`,
      },
      {
        id: 'limited',
        label: '無料ポイント',
        sort: user => user.stats.limited,
        render: user => `${user.stats.limited.toLocaleString()}円`,
      },
      {
        id: 'bought',
        label: '課金額',
        sort: user => user.stats.bought,
        render: user => `${user.stats.bought.toLocaleString()}円`,
      },
      {
        id: 'charge',
        label: '手数料',
        render: user => (
          <div>
            <p>{user.stats.price ? Math.round(user.stats.point * payment.pricePerPoint.withTax / user.stats.price * 10000) / 100 : 0}%</p>
            <p>{user.stats.price ? Math.round(user.stats.bought / user.stats.price * 10000) / 100 : 0}%</p>
          </div>
        ),
      },
    ]

    return (
      <Dialog
        fullScreen
        open={!!open}
        onClose={onClose}
        TransitionComponent={transition}
      >
        <EnhancedTable
          title='プロROI'
          color='primary'
          columns={columns}
          data={users}
          style={{height: '100%'}}
          header={
            <IconButton color='inherit' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          }
          footer={
            <Button variant='contained' size='small' color='secondary' onClick={this.handleDownload}>
              <CloudDownloadIcon />
              CSVダウンロード
            </Button>
          }
          rowsPerPageOptions={[100, 500, 1000]}
        />
      </Dialog>
    )
  }
}
