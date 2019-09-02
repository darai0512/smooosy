import React from 'react'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Typography, Button, Checkbox, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemSecondaryAction } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import AddIcon from '@material-ui/icons/Add'
import FunctionIcon from '@material-ui/icons/DeveloperBoard'
import DeleteIcon from '@material-ui/icons/Delete'
import ReloadIcon from '@material-ui/icons/Refresh'
import { purple } from '@material-ui/core/colors'

import {
  loadCrawls, createCrawl, removeCrawl,
  loadCrawlTemplates, createCrawlTemplate, removeCrawlTemplate,
  pauseCrawl, restartCrawl, status as crawlStatus, reset as resetCrawl,
  saveAsLead, updateMany,
} from 'tools/modules/crawl'
import Pagination from 'components/Pagination'
import CustomChip from 'components/CustomChip'
import ConfirmDialog from 'components/ConfirmDialog'
import { CrawlForm } from 'tools/components/CrawlDetail'

@connect(
  state => ({
    total: state.crawl.total,
    crawls: state.crawl.crawls,
    templates: state.crawl.templates,
    status: state.crawl.status,
  }),
  { loadCrawls, createCrawl, removeCrawl, loadCrawlTemplates, createCrawlTemplate, removeCrawlTemplate, pauseCrawl, restartCrawl, crawlStatus, resetCrawl, saveAsLead, updateMany }
)
@withStyles(theme => ({
  button: {
    marginRight: 10,
  },
  root: {
    padding: 10,
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  section: {
    flex: 1,
    padding: 10,
  },
  titlebar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  list: {
    marginBottom: 30,
    padding: 0,
    borderStyle: 'solid',
    borderWidth: '1px 1px 0',
    borderColor: theme.palette.grey[300],
  },
  chip: {
    marginRight: 10,
  },
}), {withTheme: true})
export default class CrawlPage extends React.Component {
  constructor(props) {
    super(props)

    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    const page = parseInt(query.page || 1, 10) || 1

    this.state = {
      page,
      create: false,
      reset: false,
      checkedCrawl: [],
    }
  }

  componentDidMount() {
    this.loadCrawls()
    this.props.loadCrawlTemplates()
    this.props.crawlStatus()
  }

  loadCrawls = page => {
    page = page || this.state.page
    this.setState({page})
    this.props.history.push(`${this.props.location.pathname}?${qs.stringify({page})}`)
    this.props.loadCrawls({page})
  }

  createCrawl = values => {
    this.props.createCrawl(values)
      .then(() => {
        this.loadCrawls(1)
        this.setState({page: 1, create: false})
      })
  }

  createCrawlTemplate = () => {
    this.props.createCrawlTemplate()
      .then(res => res.data)
      .then(template => this.props.history.push(`/crawlTemplates/${template.id}`))
  }

  removeCrawl = (id) => {
    this.props.removeCrawl(id)
    this.setState({deleteConfirm: false})
  }

  removeCrawlTemplate = (id) => {
    this.props.removeCrawlTemplate(id)
    this.setState({deleteConfirm: false})
  }

  pause = () => {
    const { status: { pause } } = this.props
    if (pause) {
      this.props.restartCrawl()
    } else {
      this.props.pauseCrawl()
    }
  }

  reset = () => {
    this.props.resetCrawl().then(() => this.setState({reset: false}))
  }

  selectCrawl = e => {
    const { checkedCrawl } = this.state
    if (e.target.checked) {
      checkedCrawl.push(e.target.value)
      this.setState({checkedCrawl})
    } else {
      this.setState({checkedCrawl: checkedCrawl.filter(c => c !== e.target.value)})
    }
  }

  selectAllCrawl = () => {
    if (this.state.checkedCrawl.length) {
      this.setState({checkedCrawl: []})
    } else {
      this.setState({checkedCrawl: this.props.crawls.map(c => c.id)})
    }
  }

  saveAsLeads = () => {
    const { checkedCrawl } = this.state
    const { crawls } = this.props
    this.setState({saving: true})
    this.props.saveAsLead(checkedCrawl.filter(crawl =>
      crawls.some(c => c.id === crawl && c.status === 'done')
    ))
      .finally(() => {
        this.loadCrawls()
        this.setState({saving: false, checkedCrawl: []})
      })
  }

  execute = () => {
    const { checkedCrawl } = this.state
    this.props.updateMany(checkedCrawl, {status: 'waiting'})
      .then(() => this.loadCrawls())
  }

  render() {
    const { crawls, templates, status, classes, theme } = this.props
    const { deleteConfirm, deleteTemplate, reset, checkedCrawl, saving } = this.state

    const { grey, primary, blue, red } = theme.palette

    const chipColors = {
      draft: grey[400],
      waiting: primary.main,
      progress: primary.main,
      done: blue[300],
      error: red[300],
      inserted: purple[300],
    }

    return (
      <div className={classes.root}>
        <div className={classes.section}>
          <div className={classes.titlebar}>
            <Typography variant='h5'>実行ジョブ</Typography>
            <div style={{display: 'flex'}}>
              <Button className={classes.button} size='small' variant='contained' color='primary' onClick={() => this.setState({create: true})}>
                <AddIcon />
                追加
              </Button>
              <Button className={classes.button} size='small' variant='contained' color='secondary' onClick={() => this.pause()}>{status.pause ? '再開' : '一時停止'}</Button>
              <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({reset: true})}>リセット</Button>
            </div>
          </div>
          <div style={{display: 'flex', margin: '10px 0', alignItems: 'center'}}>
            <IconButton style={{width: 30, height: 30}} onClick={this.loadCrawls}><ReloadIcon /></IconButton>
            <Button style={{marginLeft: 'auto'}} variant='outlined' size='small' color='primary'  onClick={this.saveAsLeads} disabled={!checkedCrawl.length}>{saving ? <CircularProgress style={{width: 20, height: 20}} /> : 'LEADに登録'}</Button>
            <Button style={{marginLeft: 10}} variant='outlined' size='small' color='secondary'  onClick={this.execute} disabled={!checkedCrawl.length}>実行</Button>
          </div>
          <List className={classes.list}>
            <div style={{display: 'flex', alignItems: 'center'}} onClick={this.selectAllCrawl}>
              <Checkbox checked={checkedCrawl.length > 0} style={{height: 40, width: 40}} />
              <ListItem button dense divider style={{flex: 1}}>
                全件選択
              </ListItem>
            </div>
            {crawls.map(c =>
              <div key={c.id} style={{display: 'flex', alignItems: 'center'}}>
                <Checkbox checked={checkedCrawl.includes(c.id)} value={c.id} onChange={this.selectCrawl} style={{height: 40, width: 40}} />
                <ListItem button dense divider component={Link} to={`/crawls/${c.id}`} ContainerProps={{style: {flex: 1}}}>
                  <CustomChip label={c.status} className={classes.chip} style={{background: chipColors[c.status]}} />
                  {c.name}
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => this.setState({deleteConfirm: c.id, deleteTemplate: false})}><DeleteIcon /></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </div>
            )}
          </List>
          <Pagination
            total={this.props.total}
            current={this.state.page}
            perpage={50}
            onChange={page => this.loadCrawls(page)}
          />
        </div>
        <div className={classes.section}>
          <div className={classes.titlebar}>
            <Typography variant='h5'>クロールの雛形</Typography>
            <Button size='small' variant='contained' color='primary' onClick={() => this.createCrawlTemplate()}>
              <AddIcon />
              追加
            </Button>
          </div>
          <List className={classes.list}>
            {templates.map(t =>
              <ListItem button dense divider key={t.id} component={Link} to={`/crawlTemplates/${t.id}`}>
                {t.name}
                {!t.actions && <FunctionIcon />}
                <ListItemSecondaryAction>
                  <IconButton onClick={() => this.setState({deleteConfirm: t.id, deleteTemplate: true})}><DeleteIcon /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}
          </List>
        </div>
        <ConfirmDialog
          open={deleteConfirm}
          title='本当に削除しますか？'
          onSubmit={deleteTemplate ? () => this.removeCrawlTemplate(deleteConfirm) : () => this.removeCrawl(deleteConfirm)}
          onClose={() => this.setState({deleteConfirm: false})}
        />
        <Dialog open={this.state.create} onClose={() => this.setState({create: false})}>
          <DialogTitle>クロール新規作成</DialogTitle>
          <DialogContent>
            <CrawlForm onSubmit={this.createCrawl} templates={templates} initialValues={{services: [], inputType: 'url', inputUrls: []}} />
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={reset}
          title='リセットしていいですか？'
          onSubmit={() => this.reset()}
          onClose={() => this.setState({reset: false})}
        >リセットすると現在実行中のジョブはエラーになります。</ConfirmDialog>
      </div>
    )
  }
}
