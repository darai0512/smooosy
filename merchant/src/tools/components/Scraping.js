import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { FormControl, InputLabel, Select, Button, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, Table, TableCell, TableBody, TableHead, TableRow } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Close'
import LogIcon from '@material-ui/icons/List'
import EnhancedTable from 'components/EnhancedTable'
import { prefectures as prefs } from '@smooosy/config'
import { scraping, scrapingStatus, loadAllScrapingLog, loadTownpageInfo } from 'tools/modules/lead'

@withTheme
@connect(
  state => ({
    stack: state.lead.stack,
    logs: state.lead.scrapingLogs,
    townpage: state.lead.townpage,
  }),
  { scraping, scrapingStatus, loadAllScrapingLog, loadTownpageInfo }
)
export default class Scraping extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedCategory: '',
      selectedPrefectures: [],
      subCategories: [],
      selectedSubCategory: '',
      selected: [],
      id: 0,
    }
  }

  componentDidMount() {
    this.props.scrapingStatus()
    this.props.loadAllScrapingLog()
    this.props.loadTownpageInfo()
  }

  handleCategory = event => {
    const { townpage } = this.props
    const category = event.target.value
    const subCategories = townpage.filter(town => town.category === category).map(town => town.subCategory)
    this.setState({ selectedCategory: category, subCategories })
  }

  handleSubCategory = event => {
    this.setState({ selectedSubCategory: event.target.value })
  }

  handlePrefecture = event => {
    this.setState({ selectedPrefectures: event.target.value })
  }

  execute = () => {
    const { selected } = this.state

    this.props.scraping(selected).then(() => {
      this.setState({ selected: [], selectedCategory: '', selectedPrefectures: [], selectedSubCategory: '', subCategories: [] })
    })
  }

  select = () => {
    const { selected, selectedCategory, selectedPrefectures, selectedSubCategory } = this.state
    let id = this.state.id
    for (let prefecture of selectedPrefectures) {
      selected.push({ category: selectedCategory, subCategory: selectedSubCategory, prefecture, id })
      id ++
    }
    this.setState({ selected, selectedCategory: '', selectedPrefectures: [], selectedSubCategory: '', subCategories: [], id })
  }

  stableSort = (array, fn) => {
    const defaultFn = (a, b) => a - b
    if (!fn) fn = defaultFn

    array.forEach((value, idx) => {
      array[idx] = { value, idx }
    })
    array.sort((a, b) => fn(a.value, b.value) || a.idx - b.idx)
    array.forEach((data, idx) => {
      array[idx] = data.value
    })
    return array
  }

  cancelSelect = id => {
    const { selected } = this.state
    const newSelected = selected.filter(sel => sel.id !== id)
    this.setState({ selected: newSelected })
  }

  showLog = id => {
    const { logs } = this.props
    const { selected } = this.state
    const target = selected.find(el => el.id === id)
    const log = logs.filter(l => l.category === target.category && l.subCategory === target.subCategory).sort((a, b) => b.createdAt - a.createdAt)
    log.forEach(l => l.createdAt = moment(l.createdAt).format('YYYY/MM/DD'))
    this.stableSort(log, (a, b) => a.prefecture < b.prefecture ? 1 : a.prefecture > b.prefecture ? -1 : 0)
    this.setState({ logDialog: log })
  }

  render() {
    const { theme, townpage } = this.props
    const { grey } = theme.palette
    const { selectedCategory, selectedPrefectures, selected, subCategories, selectedSubCategory, logDialog } = this.state

    const columns = [
      {
        id: 'category',
        label: 'カテゴリ',
      },
      {
        id: 'subCategory',
        label: 'サブカテゴリ',
      },
      {
        id: 'prefecture',
        label: '都道府県',
      },
      {
        id: ' ',
        render: row => (
          <div style={{display: 'flex'}}>
            <IconButton style={{flex: 1}} onClick={() => this.cancelSelect(row.id)}><DeleteIcon /></IconButton>
            <IconButton onClick={() => this.showLog(row.id)}><LogIcon /></IconButton>
          </div>
        ),
      },
    ]

    const header = (
      <div style={{marginLeft: 'auto'}}>現在進行中：あと{this.props.stack}件</div>
    )

    const footer = (
      <Button variant='contained' color='secondary' onClick={() => this.execute()} disabled={selected.length === 0} style={{width: 80, height: 30, alignSelf: 'center'}} >
        実行
      </Button>
    )

    const categories = townpage.map(town => town.category).filter((cat, idx, array) => array.indexOf(cat) === idx)
    const prefectures = Object.keys(prefs)

    return (
      <div style={{height: '100%'}}>
        <EnhancedTable
          title='スクレイピング'
          columns={columns}
          data={selected.map(a => a)}
          footer={footer}
          header={header}
          style={{height: '100%'}}
          rowsPerPageOptions={[50, 100, 200]}
        >
          <div style={{display: 'flex', padding: '10px 20px', borderBottom: `1px solid ${grey[300]}`}}>
            <FormControl style={{flex: 1, margin: '0 5px'}}>
              <InputLabel htmlFor='category'>カテゴリ</InputLabel>
              <Select
                value={selectedCategory}
                onChange={this.handleCategory}
                inputProps={{ id: 'category' }}
              >
                {categories.map(cat => (
                  <MenuItem
                    key={cat}
                    value={cat}
                    style={{
                      fontWeight:
                        selectedCategory === cat
                          ? theme.typography.fontWeightRegular
                          : theme.typography.fontWeightMedium,
                    }}
                  >
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl style={{flex: 1, margin: '0 5px'}}>
              <InputLabel htmlFor='sub-category'>サブカテゴリ</InputLabel>
              <Select
                value={selectedSubCategory}
                onChange={this.handleSubCategory}
                inputProps={{ id: 'sub-category' }}
              >
                {subCategories.map(cat => (
                  <MenuItem
                    key={cat}
                    value={cat}
                    style={{
                      fontWeight:
                        selectedCategory === cat
                          ? theme.typography.fontWeightRegular
                          : theme.typography.fontWeightMedium,
                    }}
                  >
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl style={{flex: 1, margin: '0 5px'}}>
              <InputLabel htmlFor='prefecture'>都道府県</InputLabel>
              <Select
                multiple
                value={selectedPrefectures}
                onChange={this.handlePrefecture}
                inputProps={{ id: 'prefecture' }}
              >
                {prefectures.map(pref => (
                  <MenuItem
                    key={pref}
                    value={pref}
                    style={{
                      fontWeight:
                        selectedPrefectures.indexOf(pref) === -1
                          ? theme.typography.fontWeightRegular
                          : theme.typography.fontWeightMedium,
                    }}
                  >
                    {pref}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant='contained'
              color='primary'
              disabled={!selectedCategory || !selectedPrefectures.length > 0}
              onClick={this.select}
              style={{width: 50, height: 40, alignSelf: 'center'}}
            >
              追加
            </Button>
          </div>
        </EnhancedTable>
        <Dialog
          open={!!logDialog}
          onClose={() => this.setState({logDialog: null})}
        >
          <DialogTitle>
            スクレイピング履歴
            <span style={{color: grey[600], fontSize: 18}}>{logDialog && logDialog.length > 0 && ('  ' + logDialog[0].category + '/' + logDialog[0].subCategory)}</span>
          </DialogTitle>
          <DialogContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>都道府県</TableCell>
                  <TableCell>スクレイピング日</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logDialog && logDialog.length > 0 ? logDialog.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell style={{fontSize: 16}}>{log.prefecture}</TableCell>
                    <TableCell style={{fontSize: 16}}>{log.createdAt}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell>なし</TableCell></TableRow>}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}
