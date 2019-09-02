import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { Button, Dialog, Chip, ListSubheader, Menu, MenuItem } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import FilterListIcon from '@material-ui/icons/FilterList'

import { withApiClient } from 'contexts/apiClient'
import { loadAll as loadCategories } from 'tools/modules/category'
import { load as loadServices } from 'tools/modules/service'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderSwitch from 'components/form/renderSwitch'
import renderSelect from 'components/form/renderSelect'
import Prompt from 'components/Prompt'
import EnhancedTable from 'components/EnhancedTable'
import { sections } from '@smooosy/config'

@withApiClient
@withTheme
@reduxForm({
  form: 'keywords',
  initialValues: {
    path: [],
    word: '',
    prefecture: true,
  },
  validate: values => {
    const errors = {}
    if (!values.word) {
      errors.word = '必須項目です'
    }

    return errors
  },
})
@connect(
  state => ({
    categories: state.category.categories,
    services: state.service.services,
  }),
  { loadCategories, loadServices },
)
export default class KeywordList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tag: 'カメラマン',
      keywords: [],
    }
  }

  componentDidMount() {
    this.props.loadServices()
    this.props.loadCategories()
    this.load()
  }

  load = () => {
    this.props.apiClient.get('/api/admin/keywords')
      .then(res => res.data)
      .then((keywords) => this.setState({keywords}))
  }

  selectTag = tag => {
    this.setState({
      tag,
      anchor: null,
    })
  }

  startEdit = (e, row) => {
    e.stopPropagation()
    this.props.initialize({
      prefecture: true,
      ...row,
      service: row ? row.service.id : '',
      path: row ? row.path.split(',') : [],
    })
    this.setState({editModal: true})
  }

  closeModal = () => {
    this.setState({editModal: false})
  }

  editKeyword = values => {
    if (values.path.length === 0) {
      return alert('階層を指定してください')
    }
    if (values.id) {
      return this.props.apiClient.put(`/api/admin/keywords/${values.id}`, values).then(() => {
        this.load()
        this.closeModal()
      })
    }

    return this.props.apiClient.post('/api/admin/keywords', values)
      .catch(() => alert('すでに追加されています'))
      .then(() => {
        this.load()
        this.closeModal()
      })
  }

  deleteKeywords = ids => {
    this.props.apiClient.delete('/api/admin/keywords', {data: {ids}}).then(this.load)
  }

  render() {
    const { tag } = this.state
    const { handleSubmit, theme, categories } = this.props
    const { common, primary, grey } = theme.palette

    const keywords = this.state.keywords.filter(k => k.service.tags.indexOf(tag) !== -1)
    const services = this.props.services.filter(s => s.tags.indexOf(tag) !== -1)

    const styles = {
      table: {
        height: '100%',
      },
      form: {
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
      },
      subheader: {
        background: common.white,
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
      label: {
        fontWeight: 'bold',
        fontSize: 13,
        color: grey[700],
      },
    }

    const columns = [
      {
        id: 'service',
        label: '階層',
        sort: row => [row.service.name, row.path].join(','),
        render: row => [row.service.name, ...row.path.split(',')].join(' » '),
      },
      {
        id: 'word',
        label: '検索ワード',
        render: row => <a href={`/services/${row.service.key}/path/${row.path}`} target='_blank' rel='noopener noreferrer'>{row.word} ({row.count})</a>,
      },
      {
        id: 'prefecture',
        label: '都道府県',
        sort: row => `${row.prefecture}`,
        render: row => {
          return row.prefecture ?
            <div>
              <a href={`/services/${row.service.key}/path/${row.path}?location=東京都`} target='_blank' rel='noopener noreferrer'>T</a>
              <span>{', '}</span>
              <a href={`/services/${row.service.key}/path/${row.path}?location=大阪府`} target='_blank' rel='noopener noreferrer'>O</a>
              <span>{', '}</span>
              <a href={`/services/${row.service.key}/path/${row.path}?location=愛知県`} target='_blank' rel='noopener noreferrer'>A</a>
            </div>
          : 'OFF'
        },
      },
      {
        id: 'title',
        label: 'ページタイトル',
      },
      {
        id: 'edit',
        label: ' ',
        render: row => <Button size='small' color='secondary' onClick={e => this.startEdit(e, row)}>編集</Button>,
      },
    ]

    const actions = [
      {
        icon: DeleteIcon,
        onClick: this.deleteKeywords,
        reset: true,
      },
    ]

    return (
      <EnhancedTable
        title='検索ワード'
        columns={columns}
        data={keywords}
        actions={actions}
        style={styles.table}
        rowsPerPageOptions={[50, 100, 200]}
        header={
          <div style={{display: 'flex', flex: 3}}>
            <Button size='small' onClick={e => this.setState({anchor: e.currentTarget})}>
              <FilterListIcon />
              <div>{tag}</div>
            </Button>
            <Menu
              open={!!this.state.anchor}
              anchorEl={this.state.anchor}
              onClose={() => this.setState({anchor: null})}
            >
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
            <Button size='small' variant='contained' color='secondary' onClick={e => this.startEdit(e)}>追加</Button>
          </div>
        }
      >
        <Dialog
          open={!!this.state.editModal}
          onClose={() => this.closeModal()}
        >
          <form style={{padding: 20}} onSubmit={handleSubmit(this.editKeyword)}>
            <div style={styles.label}>階層</div>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 10}}>
              <Field name='service' component={renderSelect} style={{margin: '5px 0'}}>
                {services.map(s =>
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                )}
              </Field>
              <FieldArray name='path' component={({fields}) => [
                ...fields.map((f, i) =>
                  <Field key={f} name={f} component={({input}) => [
                    <div key='arrow' style={{margin: '0 5px'}}>»</div>,
                    <Chip key='chip' style={{margin: '5px 0'}} label={input.value} onDelete={() => fields.remove(i)} />,
                  ]} />
                ),
                <div key='arrow' style={{margin: '0 5px'}}>»</div>,
                <Button key='button' size='small' variant='contained' color='primary' onClick={() => this.setState({pathFormOpen: true})}>階層追加</Button>,
                <Prompt
                  key='prompt'
                  title='階層入力（スペース区切り）'
                  open={!!this.state.pathFormOpen}
                  onClose={() => this.setState({pathFormOpen: false})}
                  onSubmit={(path) => {
                    path.split(/[\s\u3000]+/).map(p => fields.push(p))
                    this.setState({pathFormOpen: false})
                  }}
                />,
              ]} />
            </div>
            <Field name='word' label='検索ワード' component={renderTextInput} />
            <Field name='title' label='ページタイトル' component={renderTextInput} />
            <Field name='description' label='ページ説明文' component={renderTextArea} />
            <Field name='prefecture' label='都道府県' component={renderSwitch} />
            <div>
              <Button variant='contained' color='primary' type='submit'>更新</Button>
            </div>
          </form>
        </Dialog>
      </EnhancedTable>
    )
  }
}
