import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { update as updateUser } from 'modules/auth'
import { withWidth } from '@material-ui/core'
import ConfirmDialog from 'components/ConfirmDialog'
import renderTextInput from 'components/form/renderTextInput'
import { emailWarn, emailValidator, passwordValidator } from 'lib/validate'
import emailTypo from 'lib/emailTypo'

@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateUser }
)
@reduxForm({
  form: 'user',
  validate: values => ({
    ...emailValidator(values.email),
    ...passwordValidator(values.newpassword, 'newpassword'),
  }),
  warn: (values, props) => ({
    email: emailWarn(values.email) || emailTypo(values.email, (email) => props.dispatch(props.change('email', email))),
  }),
})
@withWidth({withTheme: true})
export default class EmailModal extends React.Component {
  state = {
    close: false,
  }

  submit = (values) => {
    const body = {
      bounce: false,
      email: values.email,
    }
    if (values.newpassword) body.newpassword = values.newpassword

    return this.props.updateUser(body)
  }

  render() {
    const { user, theme, width } = this.props
    const { close } = this.state

    return (
      <ConfirmDialog
        open={!!user.bounce && !close}
        title='SMOOOSYからのメールをお届けできませんでした'
        alert={true}
        onClose={() => this.setState({close: true})}
        onSubmit={this.props.handleSubmit(this.submit)}
      >
        <div style={{color: theme.palette.grey[700], fontSize: 14, marginBottom: 10}}>
          <p>メールアドレスの記入間違いや受信設定が原因の可能性があります。</p>
          <p>携帯以外のメールアドレスなどに変更をお願いします。</p>
        </div>
        <p style={{fontSize: 14, display: 'flex', flexDirection: width === 'xs' ? 'column' : 'row'}}>お客様のメールアドレス：<span style={{fontSize: 18, wordBreak: 'break-all'}}>{user.email}</span></p>
        <form style={{marginTop: 20}} onSubmit={this.props.handleSubmit(this.submit)}>
          <Field name='email' label='新しいメールアドレス' component={renderTextInput} normalize={s => s.trim()} />
          {user.password && !user.isIdBase &&
            <Field name='newpassword' label='新しいパスワード' component={renderTextInput} type='password' />
          }
        </form>
      </ConfirmDialog>
    )
  }
}
