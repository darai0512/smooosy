import React from 'react'
import { connect } from 'react-redux'
import { signup, fblogin, googlelogin } from 'modules/auth'
import { Field, reduxForm } from 'redux-form'
import { Paper, Button, CircularProgress } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import renderTextInput from 'components/form/renderTextInput'
import AgreementLinks from 'components/AgreementLinks'
import { emailWarn, emailValidator, passwordValidator } from 'lib/validate'
import emailTypo from 'lib/emailTypo'

@reduxForm({
  form: 'signup',
  validate: values => ({
    ...emailValidator(values.email),
    ...passwordValidator(values.password),
    ...(values.lastname ? {} : {lastname: '必須項目です'}),
  }),
  warn: (values, props) => ({
    email: emailWarn(values.email) || emailTypo(values.email, (email) => props.dispatch(props.change('email', email))),
  }),
})
@connect(
  null,
  { signup, fblogin, googlelogin }
)
@withWidth()
export default class SignupPage extends React.Component {
  handleSubmit = (values) => {
    return this.props.signup(values).then(() => this.props.history.push('/'))
  }

  onFacebookLogin = (values) => {
    return this.props.fblogin(values).then(() => this.props.history.push('/'))
  }

  onGoogleLogin = (values) => {
    return this.props.googlelogin(values).then(() => this.props.history.push('/'))
  }

  render() {
    const { handleSubmit, submitting, error, width } = this.props

    const styles = {
      paper: {
        padding: 32,
        width: 480,
        maxWidth: '100%',
        margin: '0px auto',
        marginTop: width === 'xs' ? 0 : 32,
      },
      submitButton: {
        margin: '16px 0px',
        height: 50,
        width: '100%',
      },
    }

    return (
      <div>
        {/*
        <Helmet>
          <title>ユーザー登録</title>
        </Helmet>
        */}
        <Paper style={styles.paper}>
          <form name='login' onSubmit={handleSubmit(this.handleSubmit)}>
            <Field classes={{input: 'signupEmail'}} name='email' component={renderTextInput} label='メールアドレス' type='email' normalize={s => s.trim()} />
            <Field classes={{input: 'signupPassword'}} name='password' component={renderTextInput} label='パスワード' type='password' />
            <AgreementLinks label='登録する' />
            <Button
              variant='contained'
              type='submit'
              className='signupSubmit'
              disabled={submitting}
              color='primary'
              style={styles.submitButton}
            >
              {submitting ? <CircularProgress size={20} color='secondary' /> : '登録する'}
            </Button>
            {error && <div style={{color: '#f00', fontSize: 13, paddingLeft: 5}}>{error}</div>}
          </form>
        </Paper>
      </div>
    )
  }
}
