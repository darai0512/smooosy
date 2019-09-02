import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { withTheme } from '@material-ui/core'
import { Button, TextField } from '@material-ui/core'
import { red } from '@material-ui/core/colors'

import AlertWarning from '@material-ui/icons/Warning'

import ConfirmDialog from 'components/ConfirmDialog'
import renderTextInput from 'components/form/renderTextInput'
import renderSwitch from 'components/form/renderSwitch'

import { load, update } from 'tools/modules/licence'

import postLicence from 'lib/postLicence'

@connect(state => {
  const licence = Object.assign({}, state.licence.licence)
  if (licence.fields) {
    licence.fields = Object.keys(licence.fields).map(key => ({
      key,
      value: licence.fields[key],
    }))
  }
  return { licence }
}, { load, update })
export default class LicenceEdit extends React.Component {
  state = {
    values: null,
  }

  componentDidMount() {
    this.props.load(this.props.match.params.id)
  }

  submit = () => {
    const { values } = this.state
    if (values.fields) {
      const fields = {}
      values.fields.forEach(f => {
        if (f.key) {
          fields[f.key] = f.value
        }
      })
      values.fields = fields
    }

    return this.props.update(this.props.licence.id, values)
      .then(() => this.setState({values: null}))
  }

  render() {
    const { licence } = this.props
    const { values } = this.state
    if (!licence) return null

    const styles = {
      root: {
        padding: 50,
      },
    }

    return (
      <div style={styles.root}>
        <h3>{licence.name}</h3>
        <LicenceForm onSubmit={values => this.setState({values})} initialValues={licence} />
        <ConfirmDialog open={!!values} title='更新しますか?' onSubmit={this.submit} onClose={() => this.setState({values: null})} />
      </div>
    )
  }
}

export const LicenceForm = reduxForm({
  form: 'licence',
  enableReinitialize: true,
  validate: values => {
    const errors = {}
    if (!values.key) {
      errors.key = '必須項目です'
    }
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (!values.needText && !values.needImage) {
      errors._error = '画像認証か番号認証のどちらかが必要です'
    }
    return errors
  },
})(({handleSubmit, onSubmit, submitting, isNew, initialValues, error, dirty}) => (
  <div>
    <form style={{marginBottom: 10}} onSubmit={handleSubmit(onSubmit)}>
      <div style={{padding: 10}}>
        <span>表示用</span>
        <Field name='name' label='資格・免許名' component={renderTextInput} />
        <Field name='key' label='key' component={renderTextInput} />
        <Field name='infoLabel' label='入力項目' component={renderTextInput} />
        <Field name='needImage' label='画像認証' component={renderSwitch} />
        <Field name='needText' label='番号認証' component={renderSwitch} />
        {error && dirty && <p style={{display: 'flex', alignItems: 'center', color: red[500], fontSize: 12}}><AlertWarning style={{width: 18, height: 18}} />{error}</p>}
      </div>
      <div style={{padding: 10}}>
        <span>検索用</span>
        <Field name='search' label='ユーザー検索用URL' component={renderTextInput} />
        <Field name='url' label='tools確認用URL' component={renderTextInput} />
        <Field name='field' label='field' component={renderTextInput} />
        <FieldArray name='fields' label='fields' component={renderFields} />
        <Field name='method' label='method' component={renderTextInput} />
        <Field name='convert' label='convert' component={renderTextInput} />
      </div>
      <Button type='submit' disabled={submitting} variant='contained' color='primary'>{isNew ? '作成' : '更新'}</Button>
    </form>
    <LicenceTest licence={initialValues} />
  </div>
))

const renderFields = withTheme(({fields, label, theme}) => (
  <div>
    <div style={{fontSize: 13, fontWeight: 'bold', color: theme.palette.grey[700]}}>{label}</div>
    {fields.map((field, idx) => {
      return (
        <div key={idx} style={{display: 'flex', alignItems: 'center'}}>
          <Field name={`${field}.key`} style={{marginRight: 10}} label='key' component={renderTextInput}/>
          <Field name={`${field}.value`} label='value' component={renderTextInput}/>
          <Button onClick={() => fields.remove(idx)} style={{height: 35}}>削除</Button>
        </div>
      )
    })}
    <Button onClick={() => fields.push({key: '', value: ''})} variant='outlined' size='small'>追加</Button>
  </div>
))

class LicenceTest extends React.Component {
  state = {
    info: '',
  }

  onClick = () => {
    const { info } = this.state
    const licence = Object.assign({}, this.props.licence)
    if (licence.fields) {
      const fields = {}
      licence.fields.forEach(f => {
        if (f.key) {
          fields[f.key] = f.value
        }
      })
      licence.fields = fields
    }
    postLicence({licence, info})
  }

  render() {
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
        <TextField label='テスト値' type='text' onChange={e => this.setState({info: e.target.value})} style={{marginRight: 20}} />
        <Button variant='outlined' color='primary' onClick={this.onClick}>検索テスト</Button>
      </div>
    )
  }
}
