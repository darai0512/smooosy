import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { TextField, Button } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core'
import { ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { load as loadServices } from 'tools/modules/service'
import { loadAll, update, copyPrioritizedRequests } from 'tools/modules/formattedRequest'
import EnhancedTable from 'components/EnhancedTable'
import ServiceSelectorDetail from 'components/ServiceSelectorDetail'

@connect(
  state => ({
    formattedRequests: state.formattedRequest.formattedRequests,
    services: state.service.services,
  }),
  { loadAll, update, loadServices, copyPrioritizedRequests }
)
@withTheme
export default class FormattedRequestList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.loadServices()
  }

  onChange = (e, row) => {
    this.setState({
      [row.id]: e.target.value,
    })
  }

  onSubmit = (e, row) => {
    e.preventDefault()
    if (!this.state[row.id]) return

    this.props.update({
      id: row.id,
      title: this.state[row.id],
    }).then(() => this.props.loadAll({service: this.state.service.id}))
  }

  selectService = service => {
    this.setState({service, open: false})
    this.props.loadAll({service: service.id})
  }

  copy = () => {
    this.props.copyPrioritizedRequests(this.state.service.id)
      .then(() => {
        this.props.loadAll({service: this.state.service.id})
      })
  }

  render() {
    const { formattedRequests, services, theme } = this.props
    const { service, open } = this.state
    const { primary } = theme.palette

    const styles = {
      panel: {
        borderRadius: 0,
        boxShadow: 'none',
      },
    }

    const columns = [
      {
        id: 'public',
        label: '公開',
        sort: row => row.public ? 1 : -1,
        render: row => row.public ? <CheckCircleIcon style={{color: primary.main}} /> : null,
      },
      {
        id: 'createdAt',
        label: '日付',
        sort: row => new Date(row.createdAt),
        render: row => new Date(row.createdAt).toLocaleDateString(),
      },
      {
        id: 'address',
        label: '場所',
        sort: row => row.prefecture + row.city || '',
        render: row => row.prefecture + row.city || '',
      },
      {
        id: 'title',
        label: '内容',
        render: row => (
          <ExpansionPanel style={styles.panel}>
            <ExpansionPanelSummary style={{paddingLeft: 0}} expandIcon={<ExpandMoreIcon />}>
              <div style={{flex: 1, fontWeight: 'bold'}}>
                <Link to={`/formattedRequests/${row.id}`}>{row.searchTitle}</Link>
              </div>
              <div>{row.searchTitle.length}文字</div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{padding: '8px 0'}}>
              <div>
                <div style={{fontWeight: 'bold'}}>タイトル</div>
                <form onSubmit={e => this.onSubmit(e, row)}>
                  <TextField
                    fullWidth
                    placeholder='{{locationでの}}XXが{{price}}'
                    defaultValue={row.title}
                    onChange={e => this.onChange(e, row)}
                  />
                </form>
                <div style={{fontWeight: 'bold'}}>依頼サービス</div>
                <div>{row.service.name}</div>
                <div style={{fontWeight: 'bold'}}>依頼内容</div>
                <div>{row.description.map(d => `${d.label}: ${d.answers.map(a => a.text).join(', ')}`).join('／')}</div>
                {row.meets.map((m, i) =>
                  <div key={i}>
                    <div style={{fontWeight: 'bold'}}>応募{i + 1}</div>
                    <div>{m.chats[0] && m.chats[0].text}</div>
                  </div>
                )}
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        ),
      },
    ]

    const header = (
      <div>
        <Button size='small' onClick={() => this.setState({open: true})}>
          {service ? service.name : 'サービスを選択する'}
          <ExpandMoreIcon />
        </Button>
        <Button
          style={{marginLeft: 10}}
          size='small'
          variant='contained'
          color='secondary'
          disabled={!service}
          onClick={this.copy}
        >
          依頼を掲載用に取得する
        </Button>
      </div>
    )

    return [
      <EnhancedTable
        key='table'
        title='掲載用の依頼'
        columns={columns}
        data={formattedRequests || []}
        style={{height: '100%'}}
        rowsPerPageOptions={[50, 100, 200]}
        header={header}
      />,
      <Dialog key='dialog' open={!!open} onClose={() => this.setState({open: false})}>
        <DialogTitle>サービス選択</DialogTitle>
        <DialogContent>
          <ServiceSelectorDetail services={services} onSelect={this.selectService} />
        </DialogContent>
      </Dialog>,
    ]
  }
}
