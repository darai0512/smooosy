import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, Form } from 'redux-form'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import renderTextInput from 'components/form/renderTextInput'
import Editor from 'components/Editor'

import { sendEmail } from 'tools/modules/profile'

@withStyles({
  root: {
    padding: 20,
  },
})
@reduxForm({
  form: 'csEmailTemplateForm',
  initialValues: {
    profileId: '',
    from: '',
    email: '',
    template: '',
    subject: '',
    html: '',
  },
})
@connect(
  null, {sendEmail}
)
export default class CsEmailTemplateForm extends React.Component {

  constructor(props) {
    super(props)
    this.props.change('from', 'info@smooosy.biz')
  }

  send = (values) => {
    const { onSend, onError } = this.props

    return this.props.sendEmail(values.profileId, values)
      .then(() => {
        if (onSend) onSend()
      })
      .catch(err => {
        if (onError) onError(err)
      })
  }

  render() {
    const { handleSubmit, submitting, classes } = this.props

    return (
      <Form className={classes.root} onSubmit={handleSubmit(this.send)}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <Field name='from' label='From' disabled component={renderTextInput} />
          <Field name='email' label='To'disabled component={renderTextInput} />
          <Field name='subject' label='件名'component={renderTextInput} />
          <Field name='html' label='本文' component={Editor} toolbarButtons={['bold', 'anchor']} ready />
          <Button variant='contained' color='primary' type='submit' disabled={submitting}>送信する</Button>
        </div>
      </Form>
    )
  }
}
