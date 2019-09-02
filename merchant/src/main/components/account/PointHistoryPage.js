import React from 'react'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dialog, AppBar, Toolbar, DialogContent, Typography, IconButton } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import Slide from '@material-ui/core/Slide'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import CloseIcon from '@material-ui/icons/Close'
import withWidth from '@material-ui/core/withWidth'

import { withApiClient } from 'contexts/apiClient'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import PointTable from 'components/PointTable'
import renderTextInput from 'components/form/renderTextInput'
import platform from 'platform'

const TextInput = renderTextInput
const isIEorEdge = /IE|Edge/.test(platform.name)

const transition = props => <Slide direction='up' {...props} />

@withApiClient
@withWidth()
@withTheme
@connect(
  state => ({
    user: state.auth.user,
  })
)
export default class PointPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      transactions: [],
      name: props.user.lastname + (props.user.firstname ? ` ${props.user.firstname}` : ''),
      month: moment(),
    }
  }

  componentDidMount() {
    this.props.apiClient
      .get('/api/points/history')
      .then(res => res.data)
      .then(transactions => this.setState({transactions}))
      .then(() => this.filter())
  }

  filter = (month) => {
    month = month || this.state.month
    const { transactions } = this.state
    const filtered = transactions.filter(t => month.isSame(t.createdAt, 'month'))

    this.setState({
      month,
      filtered,
    })
  }

  openReceiptDialog = () => {
    this.updateReceipt()
    this.setState({receipt: true})
  }


  nameChange = e => {
    const name = e.target.value
    this.setState({name})
    clearTimeout(this.timer)
    this.timer = setTimeout(this.updateReceipt, 1000)
  }

  updateReceipt = () => {
    const { name, month } = this.state
    this.setState({updated: false})
    this.props.apiClient
      .get(`/api/points/receipt_${month.format('YYYY_MM')}.pdf?name=${encodeURIComponent(name)}`, {responseType: 'arraybuffer'})
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const pdfURL = window.URL.createObjectURL(blob)
        this.setState({blob, pdfURL, updated: true})
      })
  }

  downloadReceipt = () => {
    const { month, pdfURL, blob } = this.state
    const name = `smooosy_receipt_${month.format('YYYY_MM')}.pdf`
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, name)
    } else {
      const link = document.createElement('a')
      link.href = pdfURL
      link.setAttribute('download', name)
      link.click()
    }
  }

  render() {
    const { filtered, month, name } = this.state
    const { width, theme } = this.props
    const { common, grey } = theme.palette

    if (!filtered) return null

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        padding: '20px 0',
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: width === 'xs' ? 'initial' : 500,
        margin: '0 auto',
      },
      block: {
        marginBottom: 40,
      },
      subheader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        margin: '10px 0',
      },
      table: {
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0 0' : '1px 1px 0',
        borderCollapse: 'initial',
      },
      dialog: {
        display: 'flex',
        padding: 24,
        flexDirection: width === 'xs' ? 'column' : 'row',
      },
    }

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              <Button component={Link} to='/account/points' style={{minWidth: 40}} ><ChevronLeftIcon /></Button>
            </div>
            <div>ポイント履歴</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>ポイント履歴</title>
        </Helmet>
        <div style={styles.main}>
          <div style={styles.block}>
            <div style={styles.subheader}>
              <Button color='primary' onClick={() => this.filter(month.subtract(1, 'month'))}>
                <ChevronLeftIcon />
                前月
              </Button>
              <div>{month.format('YYYY年MM月')}</div>
              <Button color='primary' disabled={month.isSame(moment(), 'month')} onClick={() => this.filter(month.add(1, 'month'))}>
                翌月
                <ChevronRightIcon />
              </Button>
            </div>
            <div style={{display: 'flex', paddingBottom: 10}}>
              <div style={{flex: 1}} />
              <Button variant='contained' color='secondary' disabled={filtered.filter(t => ['bought', 'autoCharge'].indexOf(t.type) !== -1).length === 0} onClick={() => this.openReceiptDialog()}>領収書を発行</Button>
            </div>
            <PointTable transactions={filtered} style={styles.table} />
          </div>
        </div>
        <Dialog
          fullScreen
          open={!!this.state.receipt}
          onClose={() => this.setState({receipt: false})}
          TransitionComponent={transition}
        >
          <AppBar color='secondary' style={{position: 'relative'}}>
            <Toolbar>
              <Typography variant='h6' color='inherit' style={{flex: 1}}>
                {month.format('YYYY年MM月')}の領収書を発行
              </Typography>
              <IconButton color='inherit' onClick={() => this.setState({receipt: false})}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <DialogContent style={styles.dialog}>
            <div style={{flex: width === 'xs' ? 0 : 1, margin: width === 'xs' ? '0 0 20px' : '0 20px 0 0'}}>
              <TextInput label='お名前' input={{name: 'name', value: name, onChange: this.nameChange}} meta={{}} />
              <Button variant='contained' color='primary' onClick={this.downloadReceipt} disabled={!this.state.updated}>
                {this.state.updated ?  'ダウンロード' : '作成中・・・'}
              </Button>
            </div>
            {!isIEorEdge &&
              <object data={this.state.pdfURL} width='100%' type='application/pdf' style={width === 'xs' ? {} : {flex: 1}} />
            }
          </DialogContent>
        </Dialog>
      </AutohideHeaderContainer>
    )
  }
}
