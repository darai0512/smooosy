import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { update as updateUser } from 'modules/auth'
import { Field, reduxForm } from 'redux-form'
import { Button, CircularProgress } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import withWidth from '@material-ui/core/withWidth'
import renderTextInput from 'components/form/renderTextInput'
import { withTheme } from '@material-ui/core/styles'
import { passwordValidator } from 'lib/validate'

@withWidth()
@reduxForm({
  form: 'newpassword',
  validate: values => passwordValidator(values.newpassword, 'newpassword'),
})
@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateUser }
)
@withTheme
export default class NewPassword extends React.Component {
  handleSubmit = ({ newpassword }) => {
    return this.props.updateUser({ newpassword })
      .then(() => this.props.history.push(this.props.user.pro ? '/pros' : '/requests'))
  }

  render() {
    const { user, handleSubmit, submitting, width, theme } = this.props
    const { common, grey } = theme.palette

    if (!user.email) this.props.history.replace('/account/info')

    const styles = {
      root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        padding: 20,
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: width === 'xs' ? 'initial': 640,
        margin: '30px auto',
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
      },
      submitButton: {
        margin: '16px 0px',
        width: '100%',
        height: 50,
      },
    }

    return (
      <div style={styles.root}>
        <Helmet>
          <title>パスワードを編集</title>
        </Helmet>
        <div style={styles.header}>
          <div style={{flex: 1}}>
            {width === 'xs' &&
              <Button component={Link} to='/account' style={{minWidth: 40}}>
                <NavigationChevronLeft />
              </Button>
            }
          </div>
          <div>パスワードを編集</div>
          <div style={{flex: 1}} />
        </div>
        <div style={styles.main}>
          <form onSubmit={handleSubmit(this.handleSubmit)}>
            <Field autoFocus name='newpassword' component={renderTextInput} label='新しいパスワード' type='password' />
            <Button variant='contained'
              type='submit'
              disabled={submitting}
              color='primary'
              style={styles.submitButton}
            >
              {submitting ? <CircularProgress size={20} color='secondary' /> : 'パスワードを設定する'}
            </Button>
          </form>
        </div>
      </div>
    )
  }
}
