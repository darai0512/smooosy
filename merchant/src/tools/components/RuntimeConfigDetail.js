import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { Button, withTheme } from '@material-ui/core'

import moment from 'moment'

import SelectServiceChip from 'tools/components/SelectServiceChip'
import DateTimePicker from 'components/DateTimePicker'
import renderTextInput from 'components/form/renderTextInput'
import renderNumberInput from 'components/form/renderNumberInput'
import renderCheckbox from 'components/form/renderCheckbox'
import { load, create, update } from 'tools/modules/runtimeConfig'
import { loadAll as loadServices } from 'tools/modules/service'
import { open as openSnack } from 'tools/modules/snack'

@withTheme
@connect(
  state => ({
    runtimeConfig: state.runtimeConfig.runtimeConfig,
    services: state.service.allServices,
  }),
  { load, create, update, loadServices, openSnack },
)
@reduxForm({
  form: 'runtimeConfigs',
  initialValues: {
    name: '',
    isEnabled: true,
    admin: false,
    value: {},
    priority: 0,
    rollout: { start: 0, end: 100 },
    services: [],
  },
  validate: values => {
    const errors = {
      rollout: {},
    }
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (values.priority === undefined) {
      errors.priority = '必須項目です'
    }
    if (values.rollout.start === undefined) {
      errors.rollout.start = '必須項目です'
    }
    if (!values.rollout.end) {
      errors.rollout.end = '必須項目です'
    }

    return errors
  },
})
@withRouter
export default class RuntimeConfigDetail extends React.Component {
  submit = (values) => {
    const submittableValues = {
      ...values,
      services: values.services.map(s => s._id),
    }

    if (this.props.match.params.id === 'new') {
      this.props.create(submittableValues)
        .then(() => this.props.history.push('/runtimeConfigs'))
        .catch(e => {
          if (e.status === 409) {
            this.props.openSnack('Already exists')
          }
        })
      return
    }
    this.props.update(this.props.match.params.id, submittableValues)
      .then(() => this.props.history.push('/runtimeConfigs'))
  }

  componentDidMount () {
    this.props.loadServices('')

    const id = this.props.match.params.id
    if (id !== 'new') {
      this.props.load(id)
      .then((runtimeConfig) => {
        this.props.initialize(runtimeConfig)
      })
    }
  }

  render () {
    const { services, handleSubmit } = this.props

    const styles = {
      root: {
        padding: 30,
      },
      isEnabled: {
        marginBottom: 20,
      },
      name: {
        width: 300,
      },
      number: {
        width: 150,
        marginBottom: 20,
      },
      chip: {
        margin: 5,
      },
    }

    return (
      <div style={styles.root}>
        <form onSubmit={handleSubmit(this.submit)}>
          <h3 style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>{this.props.match.params.id === 'new' ? 'Runtime Config 新規作成' : 'Runtime Config 更新'}<Button type='submit' style={{height: 20, marginTop: 5}} size='small' variant='contained' color='primary' >保存</Button></h3>
          <div style={{display: 'flex', alignItems: 'flex-start', flexDirection: 'column'}}>
            <Field name='name' label='Name' component={renderTextInput} inputStyle={styles.name} />
            <Field name='value.bool' label='Bool value' component={renderCheckbox} inputStyle={styles.isEnabled} />
            <Field name='isEnabled' label='Is enabled' component={renderCheckbox} inputStyle={styles.isEnabled} />
            <Field name='admin' label='Admin feature' color='secondary' component={renderCheckbox} inputStyle={styles.isEnabled} />
            <Field name='priority' label='Priority' component={renderNumberInput} type='number' inputStyle={styles.number} />
            <Field
              name='startAt'
              label='開始日'
              component={DateTimePicker}
              type='datetime-local'
              parse={d => {
                return moment(d).utc().format()
              }}
              format={d => {
                return d && moment(d).local().format('YYYY-MM-DDTHH:mm')
              }}
            />
            <Field
              name='endAt'
              label='終了日'
              component={DateTimePicker}
              type='datetime-local'
              parse={d => {
                return moment(d).utc().format()
              }}
              format={d => {
                return d && moment(d).local().format('YYYY-MM-DDTHH:mm')
              }}
            />
            <Field name='rollout.start' label='Rollout start' component={renderNumberInput}  type='number' min={0} max={100} inputStyle={styles.number} />
            <Field name='rollout.end' label='Rollout end' component={renderNumberInput} type='number' min={0} max={100} inputStyle={styles.number} />
            <FieldArray
              name='services'
              component={SelectServiceChip}
              title='Services'
              style={styles.chip}
              services={services}
            />
          </div>
        </form>
      </div>
    )
  }
}
