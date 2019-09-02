import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { FormControlLabel, Radio, Button } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'

import renderRadioGroup from 'components/form/renderRadioGroup'
import { payment } from '@smooosy/config'

@withWidth()
@reduxForm({
  form: 'netbank',
  initialValues: {
    netbank: Object.keys(payment.netbankTypes)[0],
  },
  validate: values => {
    const errors = {}
    if (!values.netbank) {
      errors.conveni = '必須項目です'
    }
    return errors
  },
})
export default class NetbankInput extends React.Component {

  onSubmit = values => {
    this.props.onSubmit({
      netbank: values.netbank,
    })
  }

  render() {
    const { width, handleSubmit } = this.props

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
      notice: {
        fontSize: 13,
      },
    }

    return (
      <form onSubmit={handleSubmit(this.onSubmit)}>
        <Field
          name='netbank'
          style={styles.select}
          component={renderRadioGroup}
          label='銀行を選択'
        >
          {Object.entries(payment.netbankTypes).map(([key, netbank]) =>
            <FormControlLabel
              key={key}
              control={<Radio color='primary' />}
              value={key}
              label={
                <span style={{display: 'flex', alignItems: 'center'}}>
                  <img src={netbank.image} style={styles.image} />
                  <span>{netbank.name}</span>
                </span>
              }
            />
          )}
        </Field>
        <div style={styles.notice}>
          <p>ペイジーは<a href='http://www.pay-easy.jp/where/list.php?c=1#list' target='_blank' rel='noopener noreferrer'>全国ほぼ全ての金融機関</a>でご利用できます。</p>
          <p>楽天銀行、ジャパンネット銀行は即座にポイントが付与されますが、ペイジーはお支払いから1-4時間程度かかります。</p>
        </div>
        <div style={styles.space} />
        <Button fullWidth variant='contained' color='primary' type='submit'>
          購入する
        </Button>
      </form>
    )
  }
}
