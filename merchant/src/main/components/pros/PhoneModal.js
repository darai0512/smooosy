import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { update as updateUser } from 'modules/auth'
import ConfirmDialog from 'components/ConfirmDialog'
import renderTextInput from 'components/form/renderTextInput'
import { phoneValidator } from 'lib/validate'
import { zenhan } from 'lib/string'

@reduxForm({
  form: 'phonemodal',
  validate: (values) => phoneValidator(zenhan(values.phone), true),
})
@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateUser }
)
export default class PhoneModal extends React.PureComponent {
  submit = values => {
    return this.props.updateUser({phone: zenhan(values.phone)})
  }

  render() {
    return (
      <ConfirmDialog
        open={!this.props.user.phone}
        title='電話番号が未登録です'
        forceSubmit={true}
        alert={true}
        onSubmit={this.props.handleSubmit(this.submit)}
      >
        <p>皆様に安心してサービスをご利用いただくため、事業者様に電話番号の入力をお願いしております。電話番号は応募している依頼主様にのみ公開されます。</p>
        <form style={{marginTop: 20}} onSubmit={this.props.handleSubmit(this.submit)}>
          <Field name='phone' label='電話番号' component={renderTextInput} />
        </form>
      </ConfirmDialog>
    )
  }
}
