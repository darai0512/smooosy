import React from 'react'
import { connect } from 'react-redux'
import { update as updateProfile } from 'modules/profile'
import { Field, reduxForm } from 'redux-form'
import { Button, CircularProgress } from '@material-ui/core'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderNumberInput from 'components/form/renderNumberInput'
import isURL from 'validator/lib/isURL'
import { profileValidator } from 'lib/validate'

@reduxForm({
  form: 'profile',
  validate: values => {
    const errors = {}
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (values.url && !isURL(values.url)) {
      errors.url = '正しいURLを入力してください'
    }
    const e = profileValidator(values)
    return {...errors, ...e}
  },
})
@connect(
  () => ({
  }),
  { updateProfile }
)
export default class AboutEdit extends React.Component {

  componentDidMount() {
    const { profile, initialize, reset } = this.props
    initialize({
      url: profile.url,
      description: profile.description,
      accomplishment: profile.accomplishment,
      advantage: profile.advantage,
      experience: profile.experience,
      employees: profile.employees,
    })
    reset() // workaround
  }

  submitProfile = (values) => {
    const { profile } = this.props
    const body = {}
    // 変化のある値だけ送る
    for (let name of Object.keys(values)) {
      if (values[name] !== profile[name]) {
        body[name] = values[name]
      }
    }

    return this.props.updateProfile(profile.id, body).then(() => {
      return this.props.onSubmit()
    })
  }

  render() {
    const { profile, handleSubmit, submitting } = this.props

    if (!profile) {
      return null
    }

    const styles = {
      root: {
        padding: 20,
      },
      textAreaField: {
        marginBottom: 15,
      },
    }

    return (
      <form onSubmit={handleSubmit(this.submitProfile)} style={styles.root}>
        <Field textareaStyle={{height: 150}} style={styles.textAreaField} name='description' component={renderTextArea} showCounter showProgress targetCount={200} label='自己紹介（事業内容・提供するサービスをご説明ください）' type='text' />
        <Field textareaStyle={{height: 100}} style={styles.textAreaField} name='accomplishment' component={renderTextArea} showCounter showProgress targetCount={70} label='これまでの実績をご記入ください' type='text' />
        <Field textareaStyle={{height: 100}} style={styles.textAreaField} name='advantage' component={renderTextArea} showCounter showProgress targetCount={50} label='アピールポイント・意気込みをご記入ください' type='text' />
        <div style={{display: 'flex'}}>
          <Field style={{width: 150}} inputStyle={{width: 100, marginRight: 5}} afterLabel='年' name='experience' component={renderNumberInput} label='経験年数' placeholder='5' />
          <Field style={{width: 150}} inputStyle={{width: 100, marginRight: 5}} afterLabel='人' name='employees' component={renderNumberInput} label='従業員数' placeholder='10' />
        </div>
        <Field name='url' component={renderTextInput} label='ウェブサイト' type='text' />
        <Button variant='contained'
          type='submit'
          disabled={submitting}
          color='primary'
          style={{width: '100%', marginTop: 10, height: 50}}
        >
          {submitting ? <CircularProgress size={20} color='secondary' /> : '更新する'}
        </Button>
      </form>
    )
  }
}
