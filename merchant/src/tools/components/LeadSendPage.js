import React from 'react'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { connect } from 'react-redux'
import { Button, CircularProgress, TextField, Dialog, DialogContent } from '@material-ui/core'
import { withTheme, withStyles } from '@material-ui/core/styles'
import EmailIcon from '@material-ui/icons/Email'
import MailOutlineIcon from '@material-ui/icons/MailOutline'

import { withApiClient } from 'contexts/apiClient'
import { load as loadRequest } from 'tools/modules/request'
import { loadAll, send } from 'tools/modules/lead'
import { loadAll as loadMailLogs } from 'tools/modules/maillog'
import { load as loadAllServices } from 'tools/modules/service'
import { open as openSnack } from 'tools/modules/snack'
import EnhancedTable from 'components/EnhancedTable'
import ConfirmDialog from 'components/ConfirmDialog'
import ServiceSelectorDetail from 'components/ServiceSelectorDetail'
import { webOrigin } from '@smooosy/config'

@withApiClient
@withTheme
@withStyles(() => ({
  dialog: {
    maxWidth: 600,
  },
}))
@connect(
  state => ({
    request: state.request.request,
    leads: state.lead.leads || [],
    maillogs: state.maillog.maillogs,
    services: state.service.allServices,
  }),
  { loadRequest, loadAll, send, loadMailLogs, loadAllServices, openSnack }
)
export default class LeadSendPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectService: false,
      selected: [],
      industry: '',
      services: [],
      source: '',
      address: '',
      maillogs: {},
      sentLead: [],
    }
  }

  componentDidMount() {
    this.props.loadRequest(this.props.match.params.id)
    this.props.loadAllServices()
    this.props.loadMailLogs({templateName: '^emailNewRequestForLead', ago: 3})
      .then((datas) => {
        let maillogs = {}
        datas.maillogs.map(m => maillogs[m.address] = m)
        this.setState({maillogs})
      })
    this.props.apiClient
      .get(`/api/admin/maillogs/requests/${this.props.match.params.id}`)
      .then(res => this.setState({sentLead: res.data.map(l => l.address)}))
  }

  search = () => {
    const { date, source, industry, services, address } = this.state
    if (!date && !source && !industry && !address && services.length === 0) {
      window.alert('いずれかが必須です')
      return
    }
    this.setState({searching: true})
    this.props.loadAll({cansend: true, date, source, industry, address: address.split(/\s*,\s*/), services})
      .then(() => this.setState({searching: false}))
  }

  send = () => {
    const data = {
      leads: this.state.selected,
      mailType: this.state.mailType,
    }
    this.props.send(this.props.request.id, data).then(() => {
      this.setState({
        selected: [],
        mailType: false,
      })
      this.props.openSnack('送信しました')
    }).catch(() => {
      this.setState({
        selected: [],
        mailType: false,
      })
      this.props.openSnack('送信失敗・・・・・・')
    })
  }

  requestStringify = (request) => {
    if (!request) return ''
    const title = '<<ここに名前が入ります>>様\n\n'
    const body =
      '初めまして、株式会社SMOOOSYの沢田と申します。\n東京都港区赤坂の方から結婚式写真の出張撮影カメラマンの依頼があり、お引受いただけないかと思いご連絡しております。\n弊社登録の事業者様でお受けいただける方が少ないため、この案件に関しては手数料・成約費用など完全無料とさせていただきます。\n依頼の詳細は以下の通りです。\n\n'

    const detail = request.description.map(desc => {
      const checked = desc.answers.filter(a => a.checked).length > 0
      return (
        '●' + desc.label + '\n' +
        desc.answers.map(a =>
          '　' + ((checked && a.checked) ? '◎' : '　') + (a.text ? a.text : 'なし')
        ).join('\n')
      )
    }).join('\n\n')

    const str = title + body +
      [
        {label: `----サービス名${'-'.repeat(40)}`, description: request.service.name},
        {label: `----エリア${'-'.repeat(44)}`, description: request.address},
        {label: `----依頼詳細${'-'.repeat(42)}`, description: detail},
        {label: '', description: `~~~~依頼のご確認は次のURLから~~~~\n${webOrigin}/new-requests/${request.id}?utm_source=ankenhikkake`},
      ].map(el => `${el.label}\n${el.description}\n\n`).join('')
    return str
  }

  render() {
    const { searching, selected, maillogs, sentLead } = this.state
    const { request, leads, services, theme } = this.props
    const { grey } = theme.palette

    if (!request) return null

    const styles = {
      header: {
        display: 'flex',
        padding: '10px 20px',
        borderBottom: `1px solid ${grey[300]}`,
      },
      serviceButton: {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        fontSize: 12,
      },
      field: {
        flex: 1,
        margin: '0 5px',
      },
    }

    let notSentLeads = leads
      .filter(lead => sentLead.indexOf(lead.email) === -1 && !maillogs[lead.email])
      .map(lead => {
        lead.id = lead._id
        return lead
      })

    const columns = [
      {
        id: 'date',
        label: '取得日',
        sort: row => new Date(row.date),
        render: row => moment(new Date(row.date)).format('MM/DD'),
      },
      {
        id: 'name',
        label: '名前',
        render: row => <div><p>{row.name}</p><p>{row.email}</p></div>,
      },
      {
        id: 'source',
        label: 'データ元',
      },
      {
        id: 'industry',
        label: '業種',
        render: row => row.industry ? row.industry.join(', ') : '',
      },
      {
        id: 'services',
        label: 'サービス',
        render: row => row.services ? row.services.map(s => services.find(ss => ss.id === s).name).join(', ') : '',
      },
      {
        id: 'address',
        label: '住所',
      },
    ]

    const header = (
      <div style={{display: 'flex', alignItems: 'center'}}>
        <Link to={`/stats/requests/${request.id}`}>{request.service.name} {request.customer.lastname}様</Link>
      </div>
    )

    const actions = [
      {
        icon: MailOutlineIcon,
        onClick: selected => this.setState({selected, mailType: 'text'}),
      },
      {
        icon: EmailIcon,
        onClick: selected => this.setState({selected, mailType: 'html'}),
      },
    ]

    const requestText = this.requestStringify(this.props.request)
    const selectedServiceNames = services.filter(s => this.state.services.includes(s.id)).map(s => s.name).join(',')

    return (
      <EnhancedTable
        title='あんかけ送信'
        columns={columns}
        data={notSentLeads}
        header={header}
        actions={actions}
        style={{height: '100%'}}
        rowsPerPageOptions={[100, 200, 300]}
        footer={<Button onClick={() => this.setState({ mailDialog: true })}>テキストメール表示</Button>}
      >
        <div style={styles.header}>
          <TextField placeholder='データ元' style={styles.field} value={this.state.source} onChange={(e) => this.setState({source: e.target.value})} />
          <TextField placeholder='業種(カンマ区切り)' style={styles.field} value={this.state.industry} onChange={(e) => this.setState({industry: e.target.value})} />
          <TextField placeholder='住所' style={styles.field} value={this.state.address} onChange={(e) => this.setState({address: e.target.value})} />
          <Button onClick={() => this.setState({selectService: true})} style={styles.field}>
            <div style={styles.serviceButton}>{selectedServiceNames || 'サービス選択'}</div>
          </Button>
          <Button
            variant='contained'
            size='small'
            color='primary'
            disabled={searching}
            onClick={() => this.search()}
          >
            {searching ? <CircularProgress size={18} style={{lineHeight: '18px'}} /> : null }
            {searching ? '検索中' : '検索'}
          </Button>
        </div>
        <ConfirmDialog
          open={!!this.state.mailType}
          title='本当に送信しますか？'
          onSubmit={() => this.send()}
          onClose={() => this.setState({mailType: false})}
        >
           <h3>{this.state.mailType}メールを送信</h3>
           <h4>依頼</h4>
           <div>依頼日: {moment(request.createdAt).format('MM/DD HH:mm')}</div>
           <div>サービス: {request.service.name}</div>
           <div>依頼者: {request.customer.lastname}</div>
           <div>既存プロ: 見積もり {request.meets.length}件 / 未返信 {request.sent.length}件</div>
           <h4>送信先</h4>
           {selected.length}人
        </ConfirmDialog>
        <Dialog
          classes={{paper: this.props.classes.dialog}}
          open={!!this.state.mailDialog}
          onClose={() => this.setState({ mailDialog: false })}
        >
          <DialogContent style={{maxWidth: 600, whiteSpace: 'pre-line', paddingBottom: 50}}>
            {requestText}
            <CopyToClipboard
              text={requestText}
              style={{ position: 'absolute', bottom: 20, left: '5%', width: '90%' }}
              onCopy={() => this.props.openSnack('コピーしました', {anchor: {vertical: 'bottom', horizontal: 'left'}})}>
              <Button variant='contained' color='primary'>コピー</Button>
            </CopyToClipboard>
          </DialogContent>
        </Dialog>
        <Dialog open={this.state.selectService} onClose={() => this.setState({selectService: false})}>
          <ServiceSelectorDetail
            multiple
            services={services}
            onSelect={s => this.setState({services: s.map(s => s.id), selectService: false})}
            selected={this.state.services}
          />
        </Dialog>
      </EnhancedTable>
    )
  }
}
