import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, formValueSelector } from 'redux-form'
import { FormControlLabel, Radio, Button } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'

import renderTextInput from 'components/form/renderTextInput'
import renderRadioGroup from 'components/form/renderRadioGroup'
import { phoneValidator } from 'lib/validate'
import { zenhan } from 'lib/string'
import { payment } from '@smooosy/config'

const formSelector = formValueSelector('conveni')

@withWidth()
@connect(
  state => ({
    initialValues: {
      conveni: Object.keys(payment.conveniTypes)[0],
      phone: state.auth.user.phone || '',
    },
    conveni: formSelector(state, 'conveni'),
  })
)
@reduxForm({
  form: 'conveni',
  validate: values => {
    const errors = {}
    if (!values.conveni) {
      errors.conveni = '必須項目です'
    } else {
      const phoneRequired = payment.conveniTypes[values.conveni].phoneRequired
      errors.phone = phoneValidator(zenhan(values.phone), phoneRequired).phone
    }
    return errors
  },
})
export default class ConveniInput extends React.Component {

  onSubmit = values => {
    this.props.onSubmit({
      conveni: values.conveni,
      phone: zenhan(values.phone).replace(/[^0-9]/g, ''),
    })
  }

  render() {
    const { conveni, width, handleSubmit } = this.props

    const styles = {
      select: {
        maxWidth: width=== 'xs' ? '100%' : 600,
      },
      image: {
        height: 30,
        margin: 2,
      },
      space: {
        height: 10,
      },
    }

    return (
      <form onSubmit={handleSubmit(this.onSubmit)}>
        <Field
          row={width !== 'xs'}
          name='conveni'
          style={styles.select}
          component={renderRadioGroup}
          label='コンビニを選択'
        >
          {Object.entries(payment.conveniTypes).map(([key, conveni]) =>
            <FormControlLabel
              key={key}
              control={<Radio color='primary' />}
              value={key}
              label={
                <span style={{display: 'flex', alignItems: 'center'}}>
                  <img src={conveni.image} style={styles.image} />
                  <span>{conveni.name}</span>
                </span>
              }
            />
          )}
        </Field>
        <div style={styles.space} />
        {conveni && payment.conveniTypes[conveni].phoneRequired &&
          <Field name='phone' component={renderTextInput} label='電話番号' />
        }
        <div style={styles.space} />
        <Button fullWidth variant='contained' color='primary' type='submit'>
          購入する
        </Button>
      </form>
    )
  }
}
