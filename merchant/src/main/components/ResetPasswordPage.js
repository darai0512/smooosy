import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { reset } from 'modules/auth'
import { Link } from 'react-router-dom'
import { Field, reduxForm } from 'redux-form'
import { Paper, Button, CircularProgress } from '@material-ui/core'
import renderTextInput from 'components/form/renderTextInput'
import { emailValidator } from 'lib/validate'

@reduxForm({
  form: 'reset',
  validate: values => emailValidator(values.email),
})
@connect(
  null,
  { reset }
)
export default class ResetPasswordPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      sent: false,
    }
  }

  handleSubmit = (values) => {
    return this.props.reset(values.email)
               .then(() => this.setState({sent: true}))
  }

  render() {
    const { handleSubmit, submitting } = this.props

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      paper: {
        marginTop: 20,
        padding: 32,
        width: 320,
      },
      submitButton: {
        margin: '16px 0px',
        height: 50,
        width: '100%',
      },
    }

    if (this.state.sent) {
      return (
        <div style={styles.root}>
          <Paper style={styles.paper}>
            <h3>パスワードリセットのメールが送信されました</h3>
            <div style={{marginTop: 20}}>
              <p>送信されたメールに従って新しいパスワードを設定してください。</p>
              <p>もし no-reply@smooosy.com からのメールが見つからない場合は迷惑メールフォルダを確認してください。</p>
            </div>
          </Paper>
        </div>
      )
    }

    return (
      <div style={styles.root}>
        <Helmet>
          <title>パスワードを初期化</title>
        </Helmet>
        <h2>パスワードを初期化</h2>
        <Paper style={styles.paper}>
          <form onSubmit={handleSubmit(this.handleSubmit)}>
            <Field name='email' component={renderTextInput} label='メールアドレス' type='text' normalize={s => s.trim()} />
            <div style={{fontSize: '13px'}}>
              指定したアドレスにメールを送信します。
              メールに従って新しいパスワードを設定してください。
            </div>
            <Button variant='contained'
              type='submit'
              disabled={submitting}
              color='primary'
              style={styles.submitButton}
            >
              {submitting ? <CircularProgress size={20} color='secondary' /> : 'パスワードをリセット'}
            </Button>
          </form>
        </Paper>
        <div style={{width: 320, height: 44, lineHeight: '44px', textAlign: 'center', fontSize: '13px'}}>
          <Link to='/signup'>アカウント未登録の方はこちら</Link>
        </div>
      </div>
    )
  }
}
