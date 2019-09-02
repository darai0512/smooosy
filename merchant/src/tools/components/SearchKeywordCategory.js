import React from 'react'
import XLSX from 'xlsx'
import moment from 'moment'
import { Line as LineChart } from 'react-chartjs-2'
import { connect } from 'react-redux'
import { Button, IconButton, CircularProgress } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'

import { create, download, output, loadCategories, categoryVolume } from 'tools/modules/searchKeyword'
import EnhancedTable from 'components/EnhancedTable'

@connect(
  state => ({
    categories: state.searchKeyword.categories,
  }),
  { create, download, output, loadCategories, categoryVolume }
)
@withTheme
export default class SearchKeywordCategory extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      submitting: false,
      showGraph: false,
      chartData: null,
      graph: null,
    }
  }

  componentDidMount() {
    this.props.loadCategories()
  }

  upload = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = e => {
      const workbook = XLSX.read(e.target.result, {type: 'binary'})
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      sheet.A1.w = 'service'
      sheet.B1.w = 'keyword'
      sheet.C1.w = 'searchVolume'
      let data = XLSX.utils.sheet_to_json(sheet)
      this.setState({submitting: true})
      this.props.create(data)
        .then(() => this.setState({submitting: false}))
        .then(() => this.props.loadCategories())
    }
    reader.readAsBinaryString(file)
    e.target.value = null
  }

  export = () => {
    this.props.output()
      .then(res => {
        const data = res.output.map(o => [o.location === '' ? o.keyword : o.keyword + ' ' + o.location, moment(o.date).format('YYYY/MM/DD'), o.rank], {header: null})
        const sheet = XLSX.utils.aoa_to_sheet(data)
        const csv = XLSX.utils.sheet_to_csv(sheet)
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
        const blob = new Blob([ bom, csv ], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Keywords_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`)
        link.click()
      })
  }

  grcExport = () => {
    this.props.download()
      .then(res => {
        const data = res.download.map(searchKeyword => ['SMOOOSY', 'https://smooosy.com', searchKeyword.keyword], {header: null})
        const sheet = XLSX.utils.aoa_to_sheet(data)
        const csv = XLSX.utils.sheet_to_csv(sheet)
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
        const blob = new Blob([ bom, csv ], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `GRC_Keywords_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`)
        link.click()
      })
  }

  drawChart = (label, datas) => {
    if (!datas) return
    const chartData = {
      labels: datas.map(d => moment(d.date).format('YYYY/MM/DD')),
      datasets: [{
        label,
        backgroundColor: 'rgba(144,193,50,1)',
        borderColor: 'rgba(144,193,50,1)',
        fill: false,
        data: datas.map(d => d.clickVolume),
      }],
    }

    const graph = {
      scales: {
        yAxes: [
          {
            type: 'linear',
          },
        ],
      },
    }

    this.setState({showGraph: true, chartData, graph})
  }

  onOpen = (name, key) => {
    this.props.categoryVolume(key)
      .then(res => {
        this.drawChart(name, res.categoryVolume)
      })
  }

  onClose = () => {
    this.setState({showGraph: false})
  }

  render() {
    const { submitting } = this.state
    const { categories, theme } = this.props
    const { grey } = theme.palette

    const columns = [
      {
        id: 'category',
        label: 'カテゴリ',
        sort: row => row.name,
        render: row => <a onClick={() => this.props.history.push(`/searchKeyword/${row.key}`)}>{row.name}</a>,
      },
      {
        id: 'searchVolume',
        label: '合計検索ボリューム',
        sort: row => row.searchVolume,
        render: row => <div>{row.searchVolume}</div>,
      },
      {
        id: 'clickVolume',
        label: '推定クリック数',
        sort: row => row.clickVolume,
        render: row => <a onClick={() => this.onOpen(row.name, row.key)}>{row.clickVolume}</a>,
      },
    ]

    const total = Math.floor(categories.reduce((sum, current) => {
      return sum + current.clickVolume
    }, 0))

    return (
      <EnhancedTable
        title={<div style={{display: 'flex', alignItems: 'flex-end'}}><div>キーワード順位</div><div style={{fontSize: 12, fontWeight: 'normal', marginBottom: 5}}>(推定クリック合計数：<a onClick={() => this.onOpen('推定クリック合計数', 'all')}>{total}</a>)</div></div>}
        columns={columns}
        data={categories}
        style={{height: '100%'}}
        header={
          <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
            <Button size='small' variant='contained' disabled={submitting} color='secondary' onClick={() => this.uploadButton && this.uploadButton.click()} style={{marginRight: 10}}>
              {submitting ? <CircularProgress size={20} color='secondary' /> : 'インポート'}
            </Button>
            <input type='file' ref={(e) => this.uploadButton = e} style={{display: 'none'}} onChange={this.upload} />
            <Button size='small' variant='contained' color='secondary' onClick={() => this.export()} style={{marginRight: 10}}>エクスポート</Button>
            <Button size='small' variant='contained' color='secondary' onClick={() => this.grcExport()} style={{marginRight: 10}}>GRC用エクスポート</Button>
          </div>
        }
      >
        <Dialog
          open={!!this.state.showGraph}
          onClose={() => this.onClose()}
        >
          <DialogTitle>
            推定クリック数推移
            <IconButton style={{position: 'absolute', top: 10, right: 10}} onClick={() => this.onClose()}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent style={{background: grey[100], paddingTop: 24}}>
            { this.state.showGraph && <LineChart data={this.state.chartData} options={this.state.graph} width={600} height={250} /> }
          </DialogContent>
        </Dialog>
      </EnhancedTable>
    )
  }
}
