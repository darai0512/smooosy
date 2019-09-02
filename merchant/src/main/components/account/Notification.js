import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Field, reduxForm } from 'redux-form'
import { Button, CircularProgress, Tabs, Tab } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import { update as updateUser, checkLineFriend } from 'modules/auth'
import { open as openSnack } from 'modules/snack'
import renderCheckbox from 'components/form/renderCheckbox'
import LineConnect from 'components/LineConnect'
import LineFriendLink from 'components/LineFriendLink'
import { notificationTypes } from '@smooosy/config'

@withWidth()
@connect(
  state => ({
    user: state.auth.user,
    isLineFriend: state.auth.isLineFriend,
  }),
  { updateUser, checkLineFriend, openSnack }
)
@reduxForm({
  form: 'notification',
})
@withTheme
export default class Notification extends React.Component {
  state = {}

  static defaultProps = {
    onSubmit: () => {},
  }

  componentDidMount() {
    this.props.initialize(this.props.user.notification)
    this.props.reset() // workaround

    // LINE友達追加チェック
    this.props.checkLineFriend()
  }

  handleSubmit = (notification) => {
    return this.props.updateUser({notification}).then(() => {
      this.props.openSnack('保存しました')
      this.props.onSubmit()
    })
  }

  render() {
    const { user, handleSubmit, submitting, width, theme, style } = this.props
    const { common, grey } = theme.palette

    const styles = {
      main: {
        padding: 20,
        maxWidth: width === 'xs' ? 'initial': 640,
        margin: '30px auto',
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
        ...style,
      },
      submitButton: {
        width: '100%',
        height: 50,
      },
      notificationLabel:  {
        borderBottom: `1px solid ${grey[200]}`,
        margin: 0,
      },
    }

    const type = this.props.type || this.state.type || (user.email ? 'email' : 'line')
    const onTabChange = this.props.history ? (e, value) => this.props.history.push(`/account/notification/${value}`) : (_, type) => this.setState({type})

    const notificationKeys = Object.keys(notificationTypes).filter(k => {
      const n = notificationTypes[k]
      if (n.isMatchMore && !user.isMatchMore) return false
      return n.target.includes(user.pro ? 'pro' : 'user')
    })

    return (
      <div style={styles.main}>
        <form onSubmit={handleSubmit(this.handleSubmit)}>
          <Tabs
            value={type}
            onChange={onTabChange}
            variant='fullWidth'
            >
            <Tab value='email' label='メール通知' style={{maxWidth: 'none', minWidth: 'auto'}} />
            <Tab value='line' label='LINE通知' style={{maxWidth: 'none', minWidth: 'auto'}} />
          </Tabs>
          {
            type === 'line' && !user.lineId ?
              <div style={{borderTop: `1px solid ${grey[200]}`, padding: '40px 0px', textAlign: 'center'}}>
                <LineConnect helperText='連携するとLINEで通知を受け取れます' />
              </div>
            : type === 'line' && !this.props.isLineFriend ?
              <div style={{borderTop: `1px solid ${grey[200]}`, padding: '40px 0px', textAlign: 'center'}}>
                <div>「SMOOOSY」を友だち追加して通知を受け取りましょう</div>
                <LineFriendLink />
              </div>
            : type === 'email' && !user.email ?
              <div style={{borderTop: `1px solid ${grey[200]}`, padding: '40px 0px', textAlign: 'center'}}>
                <Button color='primary' variant='contained' component={Link} to='/account/info'>
                  メールアドレスを設定しましょう
                </Button>
              </div>
            :
              <div>
                <div style={{borderTop: `1px solid ${grey[200]}`, marginBottom: 40, display: 'flex', flexDirection: 'column'}}>
                  {notificationKeys.map(k =>
                    <Field
                      key={k}
                      name={`${k}.${type}`}
                      labelStyle={styles.notificationLabel}
                      component={renderCheckbox}
                      label={notificationTypes[k].label}
                    />
                  )}
                </div>
                <Button variant='contained'
                  type='submit'
                  disabled={submitting}
                  color='primary'
                  style={styles.submitButton}
                >
                  {submitting ? <CircularProgress size={20} color='secondary' /> : '更新する'}
                </Button>
              </div>
          }
        </form>
      </div>
    )
  }
}
