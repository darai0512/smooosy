import React from 'react'
import XLSX from 'xlsx'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { AppBar, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, Radio, RadioGroup, TextField, Toolbar, Typography, Divider } from '@material-ui/core'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import { List, ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import ActionSearch from '@material-ui/icons/Search'
import AutorenewIcon from '@material-ui/icons/Autorenew'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import CloseIcon from '@material-ui/icons/Close'
import NavigationExpandMore from '@material-ui/icons/ExpandMore'
import SearchIcon from '@material-ui/icons/Search'
import WarningIcon from '@material-ui/icons/Warning'

import ConfirmDialog from 'components/ConfirmDialog'
import InquiryDialog from 'tools/components/InquiryDialog'
import { getInfo, loadAll, unloadAll, create, update, loadAllErrors, remove } from 'tools/modules/lead'
import LeadDuplicate from 'tools/components/LeadDuplicate'
import Filter from 'tools/components/stats/Filter'
import { withApiClient } from 'contexts/apiClient'

const LIMIT = 50

export const heads = [
  {
    label: 'フルネーム',
    name: 'name',
    type: 'string',
  },
  {
    label: '苗字',
    name: 'lastname',
    type: 'string',
  },
  {
    label: '名前',
    name: 'firstname',
    type: 'string',
  },
  {
    label: 'メールアドレス',
    name: 'email',
    type: 'string',
  },
  {
    label: '電話番号',
    name: 'phone',
    type: 'string',
  },
  {
    label: 'FAX',
    name: 'fax',
    type: 'string',
  },
  {
    label: '住所',
    name: 'address',
    type: 'string',
  },
  {
    label: 'URL',
    name: 'url',
    type: 'string',
  },
  {
    label: 'formURL',
    name: 'formUrl',
    type: 'string',
  },
  {
    label: '郵便番号',
    name: 'zipcode',
    type: 'string',
  },
  {
    label: 'ソース',
    name: 'source',
    type: 'string',
  },
  {
    label: 'サービス',
    name: 'services',
    type: 'service',
  },
  {
    label: '登録済',
    name: 'registered',
    type: 'boolean',
  },
  {
    label: 'お問い合わせ済み',
    name: 'posted',
    type: 'boolean',
  },
  {
    label: '業種',
    name: 'industry',
    type: 'array',
  },
]

@withApiClient
@withTheme
@connect(
  state => ({
    info: state.lead.info,
    leads: state.lead.leads,
    errorLeads: state.lead.errorLeads,
  }),
  { getInfo, loadAll, unloadAll, create, update, loadAllErrors, remove }
)
export default class LeadPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      limit: LIMIT,
      filteredLeads: [],
      checked: [],
      dupDialogValue: 'name',
      allSelect: false,
      formEmail: false,
    }
  }

  componentDidMount() {
    this.props.getInfo()
    this.filter()
  }

  handleUpload = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = e => {
      const workbook = XLSX.read(e.target.result, {type: 'binary'})
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (sheet.A1.w === '会社名') {
        sheet.A1.w = 'name'
        sheet.B1.w = 'zipcode'
        sheet.C1.w = 'address'
        sheet.D1.w = 'phone'
        sheet.F1.w = 'email'
        sheet.G1.w = 'url'
        sheet.H1.w = 'source'
        sheet.I1.w = 'industry'
        sheet.K1.w = 'date'
        sheet.L1.w = 'fax'
      }
      const data = XLSX.utils.sheet_to_json(sheet)
      this.setState({submitting: true})
      this.props.create(data)
        .then(res => window.alert(`${res.insertCount}件インポートしました`))
        .then(() => this.setState({submitting: false}))
        .then(this.props.getInfo)
    }
    reader.readAsBinaryString(file)
    e.target.value = null
  }

  handleToggle = id => {
    const { checked } = this.state
    let newChecked
    if (checked.includes(id)) {
      newChecked = checked.filter(c => c !== id)
    } else {
      newChecked = [...checked, id]
    }
    this.setState({checked: newChecked})
  }

  selectAll = () => {
    const { allSelect, filteredLeads, limit } = this.state
    if (allSelect) {
      this.setState({allSelect: false, checked: []})
    } else {
      this.setState({allSelect: true, checked: filteredLeads.map(f => f._id).slice(0, limit)})
    }
  }

  handleChangeText = event => {
    const query = event.target.value
    this.setState({query})
    this.filter(query)
  }

  indexError = type => {
    this.setState({searching: true, dupDialog: false})
    this.props.loadAllErrors(type)
      .then(() => {
        this.setState({searching: false, query: '', errorLeadDetail: !!this.props.errorLeads.length})
        this.filter()
      })
  }

  update = (newLeads) => {
    this.props.update(newLeads)
    this.setState({duplicate: false, checked: []})
  }

  remove = (leads) => {
    let promise = Promise.resolve()
    leads.forEach(l => {
      promise = promise.then(() => this.props.remove(l._id))
    })
    promise
      .then(() => this.filter())
    this.setState({checked: []})
  }

  filter = query => {
    const { leads } = this.props
    query = query === undefined ? this.state.query : query
    this.setState({
      filteredLeads: leads.filter(l => {
        if (!query) return true

        const searchTargets = []
        searchTargets.push(l.name, l.address, l.category, l.email, l.phone, l.fax)
        const searchText = searchTargets.join()
        return query.split(/[\s\u3000]/).every(e => searchText.indexOf(e) !== -1)
      }),
    })
  }

  search = (selected) => {
    const data = {}
    selected.forEach(s => {
      if (s.type === 'service') {
        data[s.name] = s.data
      } else if (s.type === 'checkbox') {
        s.data.forEach(d => data[d] = true)
      } else {
        if (s.name === 'address') {
          data[s.name] = s.data[0].split(/\s*,\s*/)
        } else {
          data[s.name] = s.data[0]
        }
      }
    })
    if (!Object.keys(data).length) {
      window.alert('全件表示はできません。条件を指定してください。')
      return
    }
    this.setState({searching: true})
    this.props.loadAll(data)
      .then(() => {
        this.setState({searching: false})
        this.filter()
      })
  }

  handleFormEmail = () => {
    const { checked } = this.state
    for (let id of checked) {
      this.props.apiClient.put(`/api/admin/leads/${id}/formEmail`)
    }
    this.setState({formEmail: false})
  }

  export = () => {
    const sheet = XLSX.utils.json_to_sheet(this.state.filteredLeads.map(l => ({...l, industry: l.industry.join(', ')})))
    const csv = XLSX.utils.sheet_to_csv(sheet)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([ bom, csv ], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`)
    link.click()
  }

  render() {
    const { submitting, searching, query, limit, filteredLeads, duplicate, inquiry } = this.state
    const { info, theme, leads } = this.props
    const { grey } = theme.palette

    const styles = {
      cond: {
        marginBottom: 5,
        borderRadius: 3,
        padding: 5,
        background: grey[300],
      },
      head: {
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        display: 'flex',
        padding: '0px 24px',
        background: '#eee',
        position: 'relative',
      },
      list: {
        background: '#fff',
        borderTop: `1px solid ${grey[300]}`,
        overflowX: 'hidden',
        flex: 1,
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
      },
    }

    const header = (
      <div style={{display: 'flex', alignItems: 'center', padding: 10, justifyContent: 'flex-end'}}>
        <CheckCircleIcon />
        <span style={{marginRight: 20}}>{(info.normal || 0).toLocaleString()}</span>
        <WarningIcon />
        <span style={{marginRight: 20}}>{(info.bounce || 0).toLocaleString()}</span>
        <AutorenewIcon />
        <span style={{marginRight: 20}}>{(info.unchecked || 0).toLocaleString()}</span>
        <Button variant='contained' color='secondary' size='small' disabled={submitting} style={{marginRight: 10}} onClick={() => this.uploadButton && this.uploadButton.click()}>
          {submitting ? <CircularProgress size={20} color='secondary' /> : 'Urizoインポート'}
        </Button>
        <Button variant='contained' color='primary' size='small' disabled={searching} onClick={() => this.indexError('garbled')} style={{marginRight: 10}}>
          文字化け検索
        </Button>
        <Button variant='contained' color='primary' size='small' disabled={searching} onClick={() => this.setState({dupDialog: true})}>
          重複検索
        </Button>
        <input type='file' ref={(e) => this.uploadButton = e} style={{display: 'none'}} onChange={this.handleUpload} />
      </div>
    )

    const footer = (
      <div style={{padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
        <Button variant='contained' size='small' color='primary' onClick={this.export} disabled={filteredLeads.length === 0} >
          csv出力
        </Button>
      </div>
    )

    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%', background: '#fff'}}>
        {header}
        <div style={{background: grey[300], display: 'flex', flex: 1}}>
          <Filter type='lead' onSubmit={this.search} style={{border: '1px solid #ddd'}} />
          <div style={{display: 'flex', flex: 1, flexDirection: 'column', border: '1px solid #ddd', margin: '0 -1px'}}>
            <div style={styles.head}>
              <div style={{height: 60, position: 'relative', flex: 1, display: 'flex', alignItems: 'center', marginRight: 10}}>
                <ActionSearch style={{width: 21, height: 21, color: '#999'}} />
                <TextField name='search' placeholder='検索ワード' style={{flex: 1}} value={query || ''} onChange={this.handleChangeText} type='search' />
              </div>
              <Button variant='contained' color='primary' size='small' disabled={!this.state.checked.length} onClick={() => this.setState({formEmail: true})} style={{marginRight: 5}}>form・email取得</Button>
              <Button variant='contained' color='primary' size='small' disabled={!this.state.checked.length} onClick={() => this.setState({inquiry: true})} style={{marginRight: 5}}>フォーム投稿</Button>
              <Button variant='contained' color='primary' size='small' disabled={this.state.checked.length < 2} onClick={() => this.setState({duplicate: true})}>重複編集</Button>
              <div style={{marginLeft: 10}}>{filteredLeads.length}件</div>
              <Checkbox color='primary' onChange={() => this.selectAll()} checked={this.state.allSelect} />
            </div>
            <List style={styles.list}>
              {filteredLeads.slice(0, limit).map(l =>
                <ListItem button key={l._id} component={Link} to={`/leads/${l._id}`}>
                  <ListItemText
                    primary={`${l.name} ${`<${l.email}>`}`}
                    secondary={<span style={{wordBreak: 'break-word'}}>{l.address} {l.industry.join(',')}</span>}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      color='primary'
                      onChange={() => this.handleToggle(l._id)}
                      checked={this.state.checked.includes(l._id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              )}
              {filteredLeads.length > limit &&
                <Button color='primary' style={{width: '100%', height: 50}} onClick={() => this.setState({limit: limit + LIMIT})}>
                  <NavigationExpandMore />
                  もっと見る
                </Button>
              }
            </List>
          </div>
        </div>
        {footer}
        <InquiryDialog open={!!inquiry} leads={leads.filter(l => this.state.checked.includes(l._id) && l.formUrl && !l.posted)} onClose={() => this.setState({inquiry: false})}>
          <div style={{marginTop: 10, display: 'flex', justifyContent: 'flex-end'}}>
            <Button type='submit' variant='contained' color='primary'>投稿</Button>
            <Button onClick={() => this.setState({inquiry: false})} style={{marginLeft: 10}}>キャンセル</Button>
          </div>
        </InquiryDialog>
        <LeadDuplicate open={!!duplicate} leads={leads.filter(l => this.state.checked.includes(l._id))} update={this.update} onClose={() => this.setState({duplicate: false})} remove={this.remove} />
        <Dialog open={!!this.state.dupDialog} onClose={() => this.setState({dupDialog: false})}>
          <DialogTitle>重複検索</DialogTitle>
          <DialogContent>
            <RadioGroup
              value={this.state.dupDialogValue}
              onChange={e => this.setState({dupDialogValue: e.target.value})}
            >
              <FormControlLabel value='name' control={<Radio color='primary' />} label='名前' />
              <FormControlLabel value='domain' control={<Radio color='primary' />} label='メールアドレスのドメイン部' />
              <FormControlLabel value='local' control={<Radio color='primary' />} label='メールアドレスのローカル部' />
            </RadioGroup>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({dupDialog: false})} >キャンセル</Button>
            <Button variant='contained' color='primary' onClick={() => this.indexError(`duplicate/${this.state.dupDialogValue}`)}><SearchIcon />検索</Button>
          </DialogActions>
        </Dialog>
        <Dialog fullScreen open={!!this.state.errorLeadDetail} onClose={() => this.setState({errorLeadDetail: false})}>
          <AppBar position='static' style={{zIndex: 0}}>
            <Toolbar>
              <Typography variant='h6' color='inherit' style={{flex: 1}}>
                重複/文字化け一覧（{this.props.errorLeads.length}）
              </Typography>
              <IconButton color='inherit' onClick={() => this.setState({errorLeadDetail: false})}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <DialogContent style={{padding: 0, zIndex: 1, background: '#fff'}}>
            {this.props.errorLeads.map(l =>
              <div key={l.key}>
                <details>
                  <summary style={{padding: 10}}>{`${l.key} (${l.leads.length}件)`}</summary>
                  <div style={{margin: '0 30px'}}>
                    <Table>
                      <TableHead>
                        <TableRow style={{height: 30}}>
                          <TableCell>名前</TableCell>
                          <TableCell>住所</TableCell>
                          <TableCell>メールアドレス</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {l.leads.map(ll =>
                          <TableRow key={ll._id}>
                            <TableCell>{ll.name}</TableCell>
                            <TableCell>{ll.address}</TableCell>
                            <TableCell>{ll.email}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <div style={{display: 'flex', margin: '10px 0'}}>
                      <Button style={{marginLeft: 'auto', width: 100}} variant='contained' size='small' color='primary' onClick={() => this.handleSelect(l.leads)}>編集</Button>
                    </div>
                  </div>
                </details>
                <Divider />
              </div>
            )}
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={this.state.formEmail}
          title='実行しますか'
          label='はい'
          cancelLabel='いいえ'
          onSubmit={this.handleFormEmail}
          onClose={() => this.setState({formEmail: false})}
        />
      </div>
    )
  }
}
