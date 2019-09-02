import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { withTheme, withStyles } from '@material-ui/core/styles'
import { Button, IconButton, Menu, MenuItem, ListSubheader, TextField } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import CloseIcon from '@material-ui/icons/Close'
import FilterListIcon from '@material-ui/icons/FilterList'
import { loadAll as loadServices } from 'modules/service'
import { loadAll as loadCategories } from 'tools/modules/category'
import { loadAll as loadTemplates } from 'tools/modules/meetTemplate'
import EnhancedTable from 'components/EnhancedTable'
import { sections, templateFormat } from '@smooosy/config'

@withWidth()
@withTheme
@withStyles(theme => ({
  dialogContent: {
    minHeight: 300,
    padding: 0,
  },
  textField: {
    width: '95%',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: '2.5%',
    marginRight: '2.5%',
  },
  textFieldRoot: {
    padding: 0,
    'label + &': {
      marginTop: theme.spacing(3),
    },
  },
  textFieldInput: {
    borderRadius: 4,
    backgroundColor: theme.palette.common.white,
    border: '1px solid #ced4da',
    fontSize: 16,
    padding: '10px 12px',
    width: 'calc(100% - 24px)',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
  textarea: {
    minHeight: 250,
    color: theme.palette.common.black,
  },
}))
@connect(
  state => ({
    services: state.service.services,
    templates: state.meetTemplate.templates,
    categories: state.category.categories,
  }),
  { loadServices, loadCategories, loadTemplates }
)
export default class MeetTemplates extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      tag: 'all',
      templates: [],
    }
  }

  async componentDidMount() {
    const [services, templates] = await Promise.all([
      this.props.loadServices().then(res => res.services),
      this.props.loadTemplates().then(res => res.templates),
      this.props.loadCategories(),
    ])
    const serviceObjs = {}
    services.map(s => serviceObjs[s.id] = s)
    this.setState({templates: templates.map(t => ({...t, service: serviceObjs[t.service]}))})
  }

  selectTag = tag => {
    this.setState({
      tag,
      anchor: null,
    })
  }

  render() {
    const { tag, templates } = this.state
    const { theme, classes, categories } = this.props
    const { common, primary } = theme.palette

    const categoryTemplates = tag === 'all' ? templates : templates.filter(t => t.service.tags.indexOf(tag) !== -1)

    const columns = [
      {
        id: 'title',
        label: 'タイトル',
        sort: row => row.title,
        render: row => (
          <div style={{fontSize: 10}}>
            <a onClick={() => this.setState({preview: row})}>{row.title}</a>
          </div>
        ),
      },
      {
        id: 'body',
        label: '本文',
        sort: row => row.body,
        render: row => <div style={{fontSize: 10, maxWidth: 100, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{row.body}</div>,
      },
      {
        id: 'service',
        label: 'サービス',
        sort: row => row.service.name,
        render: row => <div style={{fontSize: 10}}>{row.service.name}</div>,
      },
      {
        id: 'published',
        label: '公開状態',
        sort: row => row.isPublished ? 0 : 1,
        render: row => <div style={{fontSize: 10, color: row.isPublished ? primary.main : common.black}}>{row.isPublished ? '公開中' : '未公開'}</div>,
      },
      {
        id: 'usedCount',
        label: 'プロ使用回数',
        sort: row => row.usedCount,
        render: row => <div style={{fontSize: 10}}>{row.usedCount}</div>,
      },
      {
        id: 'edit',
        label: ' ',
        render: row => <Button size='small' color='secondary' component={Link} to={`/meetTemplates/${row.id}`}>編集</Button>,
      },
    ]

    const styles = {
      subheader: {
        background: common.white,
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
    }


    return (
      <EnhancedTable
        title='応募テンプレート一覧'
        columns={columns}
        data={categoryTemplates}
        style={{height: '100%'}}
        header={
          <div style={{display: 'flex', flex: 50}}>
            <Button size='small' onClick={e => this.setState({anchor: e.currentTarget})}>
              <FilterListIcon />
              <div>{tag === 'all' ? 'すべて' : tag}</div>
            </Button>
            <Menu
              open={!!this.state.anchor}
              anchorEl={this.state.anchor}
              onClose={() => this.setState({anchor: null})}
            >
              <MenuItem key={'all'} selected={tag === 'all'} onClick={() => this.selectTag('all')}>すべて</MenuItem>
              {sections.map(sec =>
                <div key={sec.key} style={{outline: 'none'}}>
                  <ListSubheader style={styles.subheader}>{sec.name}</ListSubheader>
                  {categories.filter(c => c.parent === sec.key).map(c =>
                    <MenuItem key={c.key} selected={tag === c.name} onClick={() => this.selectTag(c.name)}>{c.name}</MenuItem>
                  )}
                </div>
              )}
            </Menu>
            <div style={{flex: 1}} />
            <Button variant='contained' color='secondary' component={Link} to='/meetTemplates/new'>新規追加</Button>
          </div>
        }
      >
        <Dialog
          open={!!this.state.preview}
          onClose={() => this.setState({preview: false})}
        >
          <DialogTitle>
            {this.state.preview && this.state.preview.title}
            <IconButton style={{position: 'absolute', top: 10, right: 10}} onClick={() => this.setState({preview: false})}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent classes={{root: classes.dialogContent}}>
          {
            this.state.preview &&
            <TextField
              classes={{root: classes.textField}}
              InputProps={{
                disableUnderline: true,
                classes: {
                  root: classes.textFieldRoot,
                  input: classes.textFieldInput + ' ' + classes.textarea,
                },
              }}
              multiline
              placeholder={'本文'}
              disabled
              value={
                this.state.preview.body
                  .replace(templateFormat.name, '【ユーザー名】')
                  .replace(templateFormat.proname, '【事業者名】')
              }
            />
          }
          </DialogContent>
          <DialogActions classes={{root: classes.dialogActions}}>
            <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({preview: false})}>閉じる</Button>
          </DialogActions>
        </Dialog>
      </EnhancedTable>
    )
  }
}


