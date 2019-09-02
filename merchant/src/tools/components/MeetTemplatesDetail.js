import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, SubmissionError } from 'redux-form'
import { Button, Typography, Dialog, DialogContent, DialogTitle } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import { load, update, create, remove } from 'tools/modules/meetTemplate'
import ConfirmDialog from 'components/ConfirmDialog'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderSwitch from 'components/form/renderSwitch'
import ServiceSelectorDetail from 'components/ServiceSelectorDetail'

@withApiClient
@withTheme
@reduxForm({
  form: 'meetTemplate',
  validate: values => {
    const errors = {}
    if (!values.title) {
      errors.title = '必須項目です'
    }
    if (!values.body) {
      errors.body = '必須項目です'
    }
    return errors
  },
})
@connect(
  state => ({
    template: state.meetTemplate.template,
    values: state.form.meetTemplate.values || {},
  }),
  { load, update, create, remove }
)
export default class MeetTemplateDetail extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      services: [],
      service: null,
    }
  }

  async componentDidMount() {
    const id = this.props.match.params.id

    if (id !== 'new') {
      const template = await this.props.load(id).then(res => res.template)
      this.props.initialize({
        id,
        title: template.title,
        body: template.body,
        service: template.service.name,
        isPublished: template.isPublished,
      })
      this.setState({service: template.service})
    }

    this.props.apiClient
      .get('/api/services')
      .then(res => res.data)
      .then(services => {
        this.setState({services})
      })
  }

  upsert = values => {
    if (!values.service) {
      throw new SubmissionError({service: '必須項目です'})
    }
    const { service } = this.state
    const datas = {...values, service: service.id}
    if (datas.id) {
      this.props.update(datas.id, datas)
        .then(() => this.props.history.push('/meetTemplates'))
    } else {
      this.props.create(datas)
        .then(() => this.props.history.push('/meetTemplates'))
    }
  }

  remove = () => {
    this.props.remove(this.props.values.id)
      .then(() => this.props.history.push('/meetTemplates'))
  }

  selectService = (service) => {
    this.props.initialize({...this.props.values, service: service.name})
    this.setState({open: false, service})
  }

  render() {
    const { handleSubmit, values, theme } = this.props
    const { services } = this.state
    const { primary, grey } = theme.palette

    const styles = {
      root: {
        minHeight: '100%',
        background: grey[100],
        padding: 20,
      },
      chip: {
        margin: 5,
      },
      search: {
        marginTop: 10,
      },
      subheader: {
        background: 'rgba(255, 255, 255, .8)',
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
    }


    return (
      <div style={styles.root}>
        <Typography variant='h6' style={{margin: '20px 0'}}>
          応募テンプレート編集
        </Typography>
        <form onSubmit={handleSubmit(this.upsert)}>
          <Field name='service' label='サービス' component={renderTextInput} onClick={() => this.setState({open: true})} readOnly />
          <Field name='title' label='タイトル' placeholder='タイトル' component={renderTextInput} />
          <Field name='body' label='本文' component={renderTextArea} textareaStyle={{height: 250}} />
          <div style={{fontSize: 13, color: grey[700]}}>
            <p>{'{{name}}'}は自動的に依頼者の名前に変換されます</p>
            <p>{'{{proname}}'}は自動的に事業者名に変換されます</p>
          </div>
          <Field name='isPublished' label='公開' component={renderSwitch} disabled={!values.id} style={{display: !values.id ? 'none' : ''}} />
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button variant='contained' color='primary' type='submit'>{values.id ? '更新' : '作成'}</Button>
            {values.id && <div style={{margin: '0 10px'}}>{values.isPublished && '公開中'}</div>}
            <div style={{flex: 1}} />
            {values.id && <Button variant='contained' color='secondary' onClick={() => this.setState({removeOpen: true})}>削除</Button>}
          </div>
        </form>
        <Dialog open={!!this.state.open} onClose={() => this.setState({open: false})}>
          <DialogTitle>サービス選択</DialogTitle>
          <DialogContent>
            <ServiceSelectorDetail services={services} onSelect={this.selectService} />
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={!!this.state.removeOpen}
          title='この応募テンプレートを削除しますか？'
          onSubmit={() => this.remove()}
          onClose={() => this.setState({removeOpen: false})}
        >
          {this.state.removeOpen && <div>削除対象の応募テンプレート：{values.title}</div>}
        </ConfirmDialog>
      </div>
    )
  }
}
