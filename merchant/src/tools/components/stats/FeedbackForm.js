import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { Button, MenuItem } from '@material-ui/core'

import { withApiClient } from 'contexts/apiClient'
import renderSelect from 'components/form/renderSelect'
import renderTextArea from 'components/form/renderTextArea'


@withApiClient
@reduxForm({
  form: 'feedback',
  validate: values => {
    const errors = {}
    if (!values.text) {
      errors.text = '必須項目です'
    }
    return errors
  },
})
export default class FeedbackForm extends React.Component {
  static defaultProps = {
    profile: null,
    style: {},
    didSubmit: () => {},
  }

  componentDidMount() {
    const { profile } = this.props

    this.props.initialize({
      service: profile.services[0].id,
      profile: profile.id,
      pro: profile.pro.id || profile.pro,
      type: '電話',
      text: '',
    })
  }

  submit = values => {
    this.props.apiClient.post('/api/admin/feedbacks', values)
      .then(() => {
        this.props.didSubmit()
        this.props.reset()
      })
  }

  render() {
    const { profile, style, handleSubmit } = this.props

    const styles = {
      root: {
        ...style,
      },
      flex: {
        display: 'flex',
        paddingBottom: 10,
      },
      select: {
        marginRight: 10,
      },
    }

    return (
      <form style={styles.root} onSubmit={handleSubmit(this.submit)}>
        <div style={styles.flex}>
          <Field name='service' label='サービス' component={renderSelect} style={styles.select}>
            {profile.services.map(s =>
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            )}
          </Field>
          <Field name='type' label='タイプ' component={renderSelect} style={styles.select}>
            <MenuItem value='電話'>電話</MenuItem>
            <MenuItem value='メール'>メール</MenuItem>
            <MenuItem value='Intercom'>Intercom</MenuItem>
          </Field>
        </div>
        <Field name='text' component={renderTextArea} />
        <Button
          variant='contained'
          color='primary'
          type='submit'
        >
          追加する
        </Button>
      </form>
    )
  }
}
