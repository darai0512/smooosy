import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { reduxForm, Field, FieldArray, formValueSelector } from 'redux-form'
import { Button, IconButton, CircularProgress, MenuItem, Radio, FormControlLabel, Dialog } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'
import FunctionIcon from '@material-ui/icons/DeveloperBoard'
import { purple } from '@material-ui/core/colors'

import { load as loadServices } from 'tools/modules/service'
import { loadCrawl, createCrawl, updateCrawl, loadCrawlTemplates, saveAsLead } from 'tools/modules/crawl'
import { open as openSnack } from 'tools/modules/snack'
import CustomChip from 'components/CustomChip'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderRadioGroup from 'components/form/renderRadioGroup'
import renderArrayField from 'components/form/renderArrayField'
import renderSelect from 'components/form/renderSelect'
import ServiceSelectorWithChip from 'components/ServiceSelectorWithChip'
import EnhancedTable from 'components/EnhancedTable'

@withStyles(theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  back: {
    minWidth: 60,
    marginRight: 10,
  },
  title: {
    flex: 1,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  tabs: {
    margin: '0 10px',
    alignSelf: 'flex-end',
  },
  code: {
    width: '100%',
    padding: 10,
    background: theme.palette.grey[100],
    whiteSpace: 'pre-wrap',
  },
}), {withTheme: true})
@connect(
  state => ({
    crawl: state.crawl.crawl,
    templates: state.crawl.templates,
    services: state.service.allServices,
  }),
  { loadCrawl, createCrawl, updateCrawl, loadCrawlTemplates, saveAsLead, loadServices, openSnack }
)
export default class CrawlDetail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
    }
  }

  componentDidMount() {
    this.props.loadCrawl(this.props.match.params.id).then(() => {
      this.setState({loaded: true})
    })
    this.props.loadCrawlTemplates()
    this.props.loadServices()
  }

  trigger = () => {
    this.props.updateCrawl({
      id: this.props.crawl.id,
      status: 'waiting',
    })
  }

  onSubmit = values => {
    return this.props.updateCrawl({
      ...values,
      id: this.props.crawl.id,
    }).then(() => this.props.openSnack('保存しました'))
  }

  saveAsLead = () => {
    this.setState({saving: true})
    this.props.saveAsLead(this.props.crawl.id)
      .then(() => this.props.loadCrawl(this.props.match.params.id))
      .then(data => this.props.openSnack(`${data.crawl.counters.insertCount}件保存しました`))
      .catch(() => this.props.openSnack('エラー'))
      .finally(() => this.setState({saving: false}))
  }

  removeRow = index => {
    let result = this.props.crawl.result.slice()
    result.splice(index, 1)
    this.props.updateCrawl({
      id: this.props.crawl.id,
      result,
    })
  }

  copy = () => {
    const copy = {
      name: this.props.crawl.name + '（コピー）',
      inputType: this.props.crawl.inputType,
      inputUrls: this.props.crawl.inputUrls,
      inputTemplate: this.props.crawl.inputTemplate,
      template: this.props.crawl.template,
      services: this.props.crawl.services,
    }
    this.props.createCrawl(copy)
      .then(() => this.props.history.push('/crawls'))
  }

  render() {
    const { crawl, services, classes, theme, ...rest } = this.props
    const { loaded, resultDialog, saving } = this.state

    if (!loaded || !crawl) return null

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
        <div className={classes.header}>
          <Button component={Link} to='/crawls' className={classes.back}>戻る</Button>
          <CustomChip label={crawl.status} style={{marginRight: 10, background: chipColors[crawl.status]}} />
          <h3 className={classes.title}>{crawl.name}</h3>
          <Button onClick={() => this.setState({resultDialog: true})}>
            結果表示
          </Button>
          <Button
            variant='contained'
            color='primary'
            disabled={['waiting', 'progress'].includes(crawl.status)}
            onClick={() => this.trigger()}
          >
            {['waiting', 'progress'].includes(crawl.status) ?
              <CircularProgress size={20} color='secondary' />
            : crawl.status === 'draft' ? '実行する' : '再実行する'}
          </Button>
        </div>
        <CrawlForm initialValues={crawl} {...rest} onSubmit={this.onSubmit} onCopy={this.copy} edit />
        <Dialog
          fullScreen={['done', 'inserted'].includes(crawl.status) && crawl.result.length !== 0}
          open={!!resultDialog}
          onClose={() => this.setState({resultDialog: false})}
        >
          {crawl.result.length === 0 ?
            <div style={{margin: 40}}>なし</div>
          : ['done', 'inserted'].includes(crawl.status) ?
            <CrawlResultTable
              onSubmit={this.onSubmit}
              result={crawl.result.map((r, id) => ({...r, id}))}
              save={this.saveAsLead}
              saving={saving}
              remove={this.removeRow}
              close={() => this.setState({resultDialog: false})}
              services={services}
            />
          : crawl.status === 'error' ?
            <div style={{margin: 40}}>
              <div className={classes.code}>{JSON.stringify(crawl.result, null, '\t')}</div>
            </div>
          : <div />}
        </Dialog>
      </div>
    )
  }
}

const selector = formValueSelector('crawl')

@connect(
  state => ({
    inputType: selector(state, 'inputType'),
  }),
)
@reduxForm({
  form: 'crawl',
})
export class CrawlForm extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { templates, inputType, handleSubmit, onSubmit, onCopy, edit } = this.props

    return (
      <form style={{padding: 20}} onSubmit={handleSubmit(onSubmit)}>
        <Field name='name' label='名前' component={renderTextInput} />
        <Field row name='inputType' label='入力タイプ' component={renderRadioGroup}>
          <FormControlLabel value='url' label='手動でURL入力' control={<Radio />} />
          <FormControlLabel value='template' label='テンプレからURL入力' control={<Radio />} />
        </Field>
        {inputType === 'url' ?
          <div>
            <FieldArray
              name='inputUrls'
              addLabel='URL追加'
              placeholder='https://sample.com/'
              width={500}
              component={renderArrayField}
            />
            <div>{'{{start:end:step}}でURLのページングが可能です'}</div>
            <div>{'例: "?p={{1:5:2}}" => "?p=1", "?p=3", "?p=5"'}</div>
            {!edit && <div>URLが1つでページングを行う場合、100件ごとに自動でジョブが生成されます</div>}
          </div>
        : inputType === 'template' ?
          <Field name='inputTemplate' label='入力テンプレ' component={renderSelect}>
            {templates.map(t =>
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            )}
          </Field>
        : null}
        <div style={{padding: '20px 0'}}>
          <Field name='template' label='実行テンプレ' component={renderSelect}>
            {templates.map(t =>
              <MenuItem key={t.id} value={t.id}>
                {t.name}{!t.actions ? <FunctionIcon /> : ''}
              </MenuItem>
            )}
          </Field>
        </div>
        <div style={{padding: '20px 0'}}>
          <div>サービス</div>
          <FieldArray name='services' component={ServiceSelectorWithChip} />
        </div>
        <div style={{display: 'flex'}}>
          <Button variant='contained' color='secondary' type='submit'>{edit ? '保存する' : '作成する'}</Button>
          <div style={{flex: 1}} />
          {onCopy && <Button variant='outlined' color='secondary' onClick={onCopy}>コピーする</Button>}
        </div>
      </form>
    )
  }
}

class CrawlResultTable extends React.Component {
  state = {}

  remove = () => {
    const index = this.state.editIndex

    this.setState({editIndex: -1})
    this.props.remove(index)
  }

  onSubmit = values => {
    this.setState({editIndex: -1})
    return this.props.onSubmit(values)
  }

  render() {
    const { result, save, saving, close, services } = this.props
    const { editIndex } = this.state

    const columns = [
      {
        id: 'edit',
        label: '編集',
        render: row => <Button size='small' color='secondary' onClick={() => this.setState({editIndex: row.defaultIndex})}>編集</Button>,
        style: { minWidth: 0 },
      },
      {
        id: 'name',
        label: '名前',
      },
      {
        id: 'email',
        label: 'メールアドレス',
      },
      {
        id: 'formUrl',
        label: '問い合わせフォーム',
      },
      {
        id: 'phone',
        label: '電話番号',
      },
      {
        id: 'fax',
        label: 'FAX',
      },
      {
        id: 'zipcode',
        label: '郵便番号',
      },
      {
        id: 'address',
        label: '住所',
        style: { minWidth: 300 },
      },
      {
        id: 'url',
        label: 'URL',
      },
      {
        id: 'services',
        label: 'サービス',
        render: row => (row.services || []).map(s => (services.find(service => service.id === s) || {}).name).join(', '),
      },
      {
        id: 'source',
        label: 'データ元',
      },
      {
        id: 'industry',
        label: '業種',
        style: { minWidth: 400 },
      },
    ]

    return (
      <div style={{height: '100%'}}>
        <EnhancedTable
          title='スクレイピング結果'
          header={<IconButton onClick={close}><CloseIcon /></IconButton>}
          columns={columns}
          data={result || []}
          style={{height: '100%'}}
          rowsPerPageOptions={[100, 200, 500]}
          cellStyle={{padding: 5, fontSize: 13, minWidth: 100}}
          footer={
            <Button variant='contained' color='secondary' onClick={save} disabled={saving}>
              {saving ? <CircularProgress size={20} color='secondary' /> : 'Leadに登録'}
            </Button>
          }
        />
        <Dialog
          open={editIndex >= 0}
          onClose={() => this.setState({editIndex: -1})}
        >
          {editIndex >= 0 &&
            <EditResult index={editIndex} onSubmit={this.onSubmit} initialValues={{result}} remove={this.remove} services={services} />
          }
        </Dialog>
      </div>
    )
  }
}

let EditResult = reduxForm({
  form: 'resultRow',
})(EditResult = ({index, handleSubmit, onSubmit, remove}) =>
  <form onSubmit={handleSubmit(onSubmit)} style={{padding: 20}}>
    <Field name={`result[${index}].name`} label='name' component={renderTextInput} />
    <Field name={`result[${index}].email`} label='email' component={renderTextInput} />
    <Field name={`result[${index}].formUrl`} label='formUrl' component={renderTextInput} />
    <Field name={`result[${index}].phone`} label='phone' component={renderTextInput} />
    <Field name={`result[${index}].fax`} label='fax' component={renderTextInput} />
    <Field name={`result[${index}].zipcode`} label='zipcode' component={renderTextInput} />
    <Field name={`result[${index}].address`} label='address' component={renderTextInput} />
    <Field name={`result[${index}].url`} label='url' component={renderTextInput} />
    <Field name={`result[${index}].source`} label='source' component={renderTextInput} />
    <Field name={`result[${index}].industry`} label='industry' component={renderTextArea} />
    <div>サービス</div>
    <FieldArray name={`result[${index}].services`} component={ServiceSelectorWithChip} />
    <div style={{display: 'flex'}}>
      <Button color='secondary' onClick={remove}>削除する</Button>
      <div style={{flex: 1}} />
      <Button variant='contained' color='primary' type='submit'>保存する</Button>
    </div>
  </form>
)
