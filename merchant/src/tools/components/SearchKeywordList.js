import React from 'react'
import moment from 'moment'
import { Line as LineChart } from 'react-chartjs-2'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, IconButton } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'

import { loadAll, create, ranking } from 'tools/modules/searchKeyword'
import EnhancedTable from 'components/EnhancedTable'
import { ctr } from '@smooosy/config'


@connect(
  state => ({
    searchKeywords: state.searchKeyword.searchKeywords,
  }),
  { loadAll, create, ranking }
)
@withTheme
export default class SearchKeywordList extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      showRanking: false,
      chartData: null,
      graph: null,
      locations: null,
      select: null,
    }
  }

  componentDidMount() {
    const key = this.props.match.params.key
    this.props.loadAll(key)
  }

  drawChart = (keyword, datas) => {
    if (!datas) return
    const chartData = {
      labels: datas.map(d => moment(d.date).format('YYYY/MM/DD')),
      datasets: [{
        label: keyword,
        backgroundColor: 'rgba(144,193,50,1)',
        borderColor: 'rgba(144,193,50,1)',
        fill: false,
        data: datas.map(d => d.rank === '-' || d.rank === '' ? null : d.rank),
      }],
    }

    let max = 1

    datas.map(d => {
      if (d.rank === '-' || d.rank === '') return
      if (max < parseInt(d.rank) && parseInt(d.rank) < 100) max = parseInt(d.rank)
    })

    max = Math.ceil(max / 10) * 10

    const graph = {
      scales: {
        yAxes: [
          {
            type: 'linear',
            ticks: {
              min: 1,
              max,
              stepSize: 10,
              reverse: true,
            },
          },
        ],
      },
    }

    this.setState({showRanking: true, chartData, graph})
  }

  onOpenRanking = (id, keyword, location) => {
    this.props.ranking(id)
      .then(res => {
        const locationLatestRank = {}
        const locations = res.ranking.filter(r => {
          if (locationLatestRank[r.location]) {
            if (moment(r.date).diff(moment(locationLatestRank[r.location].date), 'days') > 0) {
              locationLatestRank[r.location] = {location: r.location, date: r.date, rank: r.rank}
            }
            return false
          }
          locationLatestRank[r.location] = {location: r.location, date: r.date, rank: r.rank}
          return true
        })
        .map(r => locationLatestRank[r.location])

        this.setState({select: {id, keyword}, locations})
        this.drawChart(keyword, res.ranking.filter(r => r.location === location).sort((a, b) => a.date > b.date))
      })
  }

  onClose = () => {
    this.setState({showRanking: false})
  }

  urlCategory(url) {
    let pattern = ''

    if (url) {
      pattern = '未分類'
      const urlPattern = {
        'https://smooosy.com': 'トップ',
        'https://smooosy.com/pro': 'プロページ',
        'https://smooosy.com/services': 'サービス一覧ページ',
        'https://smooosy.com/search-requests': '見積もり一覧',
        'https://smooosy.com/t/': 'カテゴリページ',
        'https://smooosy.com/p/': 'プロフィールページ',
        'https://smooosy.com/media/': 'メディア',
        'https://smooosy.com/service/': 'サービスページ',
      }
      Object.keys(urlPattern).forEach(key => {
        if (url.indexOf(key) !== -1) {
          pattern = urlPattern[key]
        }
      })
    }

    return pattern
  }

  render() {
    const { searchKeywords, theme, match } = this.props
    const { grey } = theme.palette
    const key = match.params.key

    const columns = [
      {
        id: 'service',
        label: 'サービス',
        sort: row => row.service.name,
        render: row => <div>{row.service.name}</div>,
      },
      {
        id: 'keyword',
        label: '登録キーワード',
        sort: row => row.keyword,
        render: row => <div>{row.keyword}</div>,
      },
      {
        id: 'searchVolume',
        label: '検索ボリューム',
        sort: row => row.searchVolume,
        render: row => <div>{row.searchVolume}</div>,
      },
      {
        id: 'ranking',
        label: '検索順位',
        sort: row => row.rank && row.rank !== '-' ? row.rank : 999,
        render: row => <a onClick={() => this.onOpenRanking(row.id, row.keyword, '')}>{row.rank}</a>,
      },
      {
        id: 'clickVolume',
        label: '推定クリック数',
        sort: row => row.rank && (row.rank !== '-' && row.rank <= 20) ? row.rank * ctr[row.rank]: 0,
        render: row => <div>{row.rank && (row.rank !== '-' && row.rank <= 20) && Math.floor(row.searchVolume * ctr[row.rank])}</div>,
      },
      {
        id: 'date',
        label: '最終計測日',
        sort: row => row.date ? row.date : moment().subtract(1, 'years').toDate(),
        render: row => <div>{row.date && moment(row.date).format('YYYY/MM/DD')}</div>,
      },
      {
        id: 'url',
        label: '抽出されたURL',
        sort: row => row.url,
        render: row => <a href={row.url} target='_blank' rel='noopener noreferrer'>{this.urlCategory(row.url)}</a>,
      },
      {
        id: 'edit',
        label: ' ',
        render: row => <Button size='small' color='secondary' component={Link} to={`/searchKeyword/${key}/${row.id}`}>編集</Button>,
      },
    ]

    const total = Math.floor(searchKeywords.reduce((sum, current) => {
      if (current.rank !== '-' && current.rank <= 20) {
        return sum + current.searchVolume * ctr[current.rank]
      }
      return sum
    }, 0))

    return (
      <EnhancedTable
        title={<div style={{display: 'flex', alignItems: 'flex-end'}}><div>キーワード順位</div><div style={{fontSize: 12, fontWeight: 'normal', marginBottom: 5}}>{`(推定クリック合計数：${total})`}</div></div>}
        columns={columns}
        data={searchKeywords}
        style={{height: '100%'}}
        header={
          <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
            <Button size='small' variant='contained' color='secondary' component={Link} to={`/searchKeyword/${key}/new`}>新規追加</Button>
          </div>
        }
      >
        <Dialog
          open={!!this.state.showRanking}
          onClose={() => this.onClose()}
        >
          <DialogTitle>
            検索順位推移
            <IconButton style={{position: 'absolute', top: 10, right: 10}} onClick={() => this.onClose()}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent style={{background: grey[100], paddingTop: 24}}>
            { this.state.showRanking && <LineChart data={this.state.chartData} options={this.state.graph} width={600} height={250} /> }
            <div style={{display: 'flex'}}>
              {
                this.state.locations &&
                  this.state.locations.map(l => {
                    if (l.location === '') return null
                    return <div style={{marginRight: 10}} key={l.location}>{`${l.location}:`}<a onClick={() => this.onOpenRanking(this.state.select.id, this.state.select.keyword, l.location)}>{l.rank}</a></div>
                  })
              }
            </div>
          </DialogContent>
        </Dialog>
      </EnhancedTable>
    )
  }
}
