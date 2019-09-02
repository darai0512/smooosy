import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { reduxForm, Field, FieldArray } from 'redux-form'
import moment from 'moment'
import { Button, IconButton, withTheme } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import DateTimePicker from 'components/DateTimePicker'
import renderTextArea from 'components/form/renderTextArea'
import renderTextInput from 'components/form/renderTextInput'
import renderNumberInput from 'components/form/renderNumberInput'
import renderCheckbox from 'components/form/renderCheckbox'
import { load, create, update } from 'tools/modules/experiment'


const Buckets = withTheme(({fields, meta: {error}, theme}) => {
  return (
    <div>
      <label style={{fontSize: 13, fontWeight: 'bold', color: theme.palette.grey[700]}}>バケット(0-100を分割)</label>
      <ul style={{listStyleType: 'none', margin: 0}}>
        {fields.map((bucket, index) => (
          <li key={index} style={{display: 'flex'}}>
            <Field name={`${bucket}.name`} label='名前' type='text' component={renderTextInput} disabled={index === 0} />
            <div style={{width: 20}} />
            <Field name={`${bucket}.start`} label='開始' component={renderNumberInput} type='number' min={0} max={100} style={{flex: 1}} />
            <div style={{width: 20}} />
            <Field name={`${bucket}.end`} label='終了' component={renderNumberInput} type='number' min={0} max={100} style={{flex: 1}} />
            {index !== 0 && <IconButton size='small' color='secondary' onClick={() => fields.remove(index)}><DeleteIcon/></IconButton>}
          </li>
        ))}
        <li>
          <Button size='small' variant='contained' color='primary' onClick={() => fields.push({})}>テストパターン追加</Button>
        </li>
        {error && <li className='error'>{error}</li>}
      </ul>
    </div>
  )
})

@withTheme
@connect(
  state => ({
    experiment: state.experiment.experiment,
  }),
  { load, create, update }
)
@reduxForm({
  form: 'experiments',
  initialValues: {
    name: '',
    startAt: moment().startOf('day').toDate(),
    endAt: moment().startOf('day').add(1, 'week').toDate(),
    rollout: { start: 0, end: 100 },
    buckets: [ { name: 'control', start: 0, end: 100 } ],
    isActive: true,
    paths: [],
    constraints: JSON.stringify({
      type: 'value',
      value: {
        type: 'Browser',
        value: 'Safari',
      },
    }, null, '\t'),
  },
  validate: values => {
    const errors = {}
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (!values.startAt) {
      errors.startAt = '必須項目です'
    }
    if (!values.endAt) {
      errors.endAt = '必須項目です'
    }
    const errorBuckets = []
    for (let i = 0; i < values.buckets.length; ++i) {
      const b = values.buckets[i]

      if (!b.name || isNaN(b.start) || isNaN(b.end)) {
        errorBuckets[i] = '必須項目です'
      }
    }
    if (errorBuckets.length > 0) {
      errors.buckets = errorBuckets
    }

    try {
      JSON.parse(values.constraints || '{}')
    } catch (e) {
      errors.constraints = '不正なJSONです'
    }

    return errors
  },
})
@withRouter
export default class ExperimentDetail extends React.Component {

  submit = (values) => {
    values.paths = (values.paths || []).filter(p => p)
    values.constraints = values.constraints ? JSON.parse(values.constraints) : null
    if (this.props.match.params.id === 'new') {
      this.props.create(values)
        .then(() => this.props.history.push('/experiments'))
      return
    }
    this.props.update(this.props.match.params.id, values)
      .then(() => this.props.history.push('/experiments'))
  }

  componentDidMount () {
    const id = this.props.match.params.id
    if (id !== 'new') {
      this.props.load(id)
        .then((experiment) => {
          experiment.constraints = JSON.stringify(experiment.constraints, null, '\t')
          this.props.initialize(experiment)
        })
    }
  }

  render () {
    const { handleSubmit, theme } = this.props

    const styles = {
      root: {
        padding: 30,
      },
      name: {
        width: 300,
      },
      date: {
        width: 200,
        marginLeft: 20,
      },
      number: {
        width: 150,
        marginRight: 20,
      },
    }

    return (
      <div style={styles.root}>
        <form onSubmit={handleSubmit(this.submit)}>
          <h3 style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>{this.props.match.params.id === 'new' ? 'ABテスト新規作成' : 'ABテスト更新'}<Button type='submit' style={{height: 20, marginTop: 5}} size='small' variant='contained' color='primary' >保存</Button></h3>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Field name='name' label='テスト名' component={renderTextInput} inputStyle={styles.name} />
            <Field
              name='startAt'
              label='開始日'
              component={DateTimePicker}
              type='date'
              style={styles.date}
              format={d => moment(d).format('YYYY-MM-DD')}
              parse={s => new Date(s + 't00:00')}
            />
            <Field
              name='endAt'
              label='終了日'
              component={DateTimePicker}
              type='date'
              style={styles.date}
              format={d => moment(d).format('YYYY-MM-DD')}
              parse={s => new Date(s + 'T00:00')}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Field name='isActive' label='アクティブ' component={renderCheckbox}  />
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Field name='rollout.start' label='ロールアウト開始' component={renderNumberInput} type='number' min={0} max={100} style={styles.number} />
            <Field name='rollout.end' label='ロールアウト終了' component={renderNumberInput} type='number' min={0} max={100} style={styles.number} />
          </div>
          <label style={{fontSize: 13, fontWeight: 'bold', color: theme.palette.grey[700]}}>URLに含まれる文字で制限</label>
          <FieldArray name='paths' component={({fields}) =>
            <div style={{marginBottom: 10}}>
              {fields.map((field, i) =>
                <div key={i} style={{display: 'flex'}}>
                  <Field name={field} component={renderTextInput} />
                  <DeleteIcon onClick={() => fields.remove(i)} />
                </div>
              )}
              <Button size='small' variant='outlined' onClick={() => fields.push('')}>追加</Button>
            </div>
          } />
          <Field name='constraints' label='ブラウザ制限' component={renderTextArea} type='text' textareaStyle={{height: 200}} />
          <FieldArray name='buckets' component={Buckets} />
        </form>
      </div>
    )
  }
}
