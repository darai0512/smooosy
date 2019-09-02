import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { Button, CircularProgress, IconButton, Menu, MenuItem } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationMoreVert from '@material-ui/icons/MoreVert'

import renderTextInput from 'components/form/renderTextInput'
import AvatarCropper from 'components/AvatarCropper'
import ThanksButton from 'components/ThanksButton'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import Notice from 'components/Notice'
import FacebookLogin from 'components/FacebookLogin'
import LineLogin from 'components/LineLogin'
import LineFriendLink from 'components/LineFriendLink'
import InquiryLink from 'components/InquiryLink'
import GoogleLogin from 'components/GoogleLogin'
import SNSNoticeLink from 'components/SNSNoticeLink'
import { emailWarn, emailValidator, passwordValidator, phoneValidator } from 'lib/validate'
import { zenhan } from 'lib/string'
import emailTypo from 'lib/emailTypo'
import { update as updateUser, checkLineFriend } from 'modules/auth'
import { open as openSnack } from 'modules/snack'

@withWidth()
@connect(
  state => ({
    user: state.auth.user,
    isLineFriend: state.auth.isLineFriend,
  }),
  { updateUser, checkLineFriend, openSnack }
)
@reduxForm({
  form: 'info',
  validate: values => ({
    ...emailValidator(values.email),
    ...passwordValidator(values.password),
    ...phoneValidator(zenhan(values.phone), values.pro),
    ...(values.lastname ? {} : {lastname: '必須項目です'}),
  }),
  warn: (values, props) => ({
    email: emailWarn(values.email) || emailTypo(values.email, (email) => props.dispatch(props.change('email', email))),
  }),
})
@withTheme
export default class AccountInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      anchorEl: null,
      open: false,
    }
  }

  componentDidMount() {
    const { user } = this.props
    this.props.initialize({
      lastname: user.lastname,
      firstname: user.firstname,
      email: user.email,
      phone: user.phone,
      pro: user.pro,
    })
    this.props.reset() // workaround
    // LINE友達追加チェック
    this.props.checkLineFriend()
  }


  handleImage = (blob) => {
    this.props.updateUser({}, blob).then(() => {
      this.props.openSnack('保存しました')
    })
  }

  handleSubmit = (values) => {
    const body = {}

    // props.userから変化のある値だけ送る
    for (let name of Object.keys(values)) {
      if (values[name] !== this.props.user[name]) {
        body[name] = values[name]
      }
    }
    if (body.phone) {
      body.phone = zenhan(body.phone).replace(/-/g, '')
    }

    return this.props.updateUser(body).then(res => {
      this.props.openSnack('保存しました')
      this.props.initialize({
        lastname: res.user.lastname,
        firstname: res.user.firstname,
        email: res.user.email,
        phone: res.user.phone,
        pro: res.user.pro,
      })
      this.props.reset()
    })
  }

  onFacebookLogin = ({facebookToken}) => {
    return this.props.updateUser({facebookToken})
  }

  onGoogleLogin = ({googleToken}) => {
    return this.props.updateUser({googleToken})
  }

  onLineLogin = ({lineCode, page}) => {
    this.props.history.replace(page)
    return this.props.updateUser({lineCode, page})
  }

  render() {
    const { user, handleSubmit, submitting, width, theme } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: common.white,
      },
      header: {
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      headerContent: {
        display: 'flex',
        alignItems: 'center',
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: 800,
        margin: '0 auto',
        height: '100%',
      },
      main: {
        padding: '20px 10px',
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: 800,
        margin: '0 auto',
      },
      avatarWrap: {
        margin: '0 10px 20px 10px',
      },
      flex: {
        display: 'flex',
        width: '100%',
        flexDirection: width === 'xs' ? 'column' : 'row',
      },
      input: {
        flex: 1,
        margin: '0 10px',
      },
      submitButton: {
        margin: '16px 0',
        width: '100%',
        height: 50,
      },
    }

    const nameFields = user.identification && user.identification.status === 'valid' ?
      <div>
        <div style={styles.flex}>
          <Field style={styles.input} name='lastname' component={renderTextInput} label='姓' type='text' readOnly disabled/>
          <Field style={styles.input} name='firstname' component={renderTextInput} label='名' type='text' readOnly disabled/>
        </div>
        <div style={{fontSize: 12, margin: '0 10px'}}>
          ※本人確認済みのため名前の変更はできません。変更は
          <InquiryLink />
          から承ります。
        </div>
      </div>
    : user.pro ?
      <div style={styles.flex}>
        <Field style={styles.input} name='lastname' component={renderTextInput} label='姓' type='text'/>
        <Field style={styles.input} name='firstname' component={renderTextInput} label='名' type='text'/>
      </div>
    :
      <div style={{padding: '0 10px'}}>
        <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>名前</div>
        <div>{user.lastname} {user.firstname}</div>
      </div>

    const connectButtons = (
      <div style={styles.input}>
        <div style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>LINEログイン・通知</div>
        {user.lineId ?
          <div>
            <Button
              variant='outlined'
              onClick={() => this.props.updateUser({lineId: null})}
              disabled={!user.email}
            >
              連携解除
            </Button>
            {!this.props.isLineFriend &&
              <div style={{margin: '10px 0'}}>
                「SMOOOSY」を友だち追加して通知を受け取りましょう。
                <LineFriendLink />
              </div>
            }
          </div>
        :
          <LineLogin label='連携する' onLogin={this.onLineLogin} page='/account/info' />
        }
        <div style={{height: 24}} />
        <div style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>Googleログイン</div>
        {user.googleId ?
          <Button
            variant='outlined'
            disabled={!user.googleId}
            onClick={() => this.props.updateUser({googleId: null})}
          >
            連携解除
          </Button>
        :
          <GoogleLogin text='連携する' style={{fontSize: 14, fontWeight: 'normal', width: 200, height: 50}} onLogin={this.onGoogleLogin} label='連携する' />
        }
        <div style={{height: 24}} />
        <div style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>Facebookログイン</div>
        {user.facebookId ?
          <Button
            variant='outlined'
            disabled={!user.facebookId}
            onClick={() => this.props.updateUser({facebookId: null})}
          >
            連携解除
          </Button>
        :
          <FacebookLogin onLogin={this.onFacebookLogin} label='連携する' />
        }
        <SNSNoticeLink />
      </div>
    )

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={styles.headerContent}>
              <div style={{flex: 1}}>
                {width === 'xs' &&
                  <Link to='/account'>
                    <Button style={{minWidth: 40}} >
                      <NavigationChevronLeft />
                    </Button>
                  </Link>
                }
              </div>
              <div>基本情報を編集</div>
              <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                <IconButton
                  onClick={(e) => this.setState({ open: true, anchorEl: e.currentTarget })}
                  aria-owns={this.state.open ? 'exit-menu' : null}
                  aria-haspopup='true'
                >
                  <NavigationMoreVert />
                </IconButton>
                <Menu
                  id='exit-menu'
                  anchorEl={this.state.anchorEl}
                  getContentAnchorEl={null}
                  anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                  transformOrigin={{horizontal: 'right', vertical: 'top'}}
                  onClose={() => this.setState({ open: false })}
                  open={this.state.open}
                >
                  <MenuItem onClick={() => this.props.history.push('/account/deactivate')} >
                    退会する
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        }
      >
        <Helmet>
          <title>基本情報を編集</title>
        </Helmet>
        <div style={styles.main}>
          <div style={{margin: '0 10px', fontSize: 13, fontWeight: 'bold', color: '#666'}}>アイコン画像</div>
          <div style={styles.avatarWrap}>
            <AvatarCropper user={user} handleImage={this.handleImage} />
          </div>
          <div style={{padding: 10}}>
            <ThanksButton user={user} />
          </div>
          <form onSubmit={handleSubmit(this.handleSubmit)}>
            {user.email && user.password ?
              <div>
                {nameFields}
                <div style={{height: 24}} />
                <div style={styles.flex}>
                  <Field style={styles.input} name='phone' component={renderTextInput} label='電話番号' type='text' />
                  <Field style={styles.input} name='email' component={renderTextInput} label='メールアドレス' type='text' normalize={s => s.trim()} />
                </div>
                <div style={{height: 24}} />
                {connectButtons}
                <div style={{height: 24}} />
                <div style={styles.input}>
                  <Field name='password' component={renderTextInput} label='確認のためパスワードを入力してください' type='password' />
                </div>
              </div>
            :
              <div>
                <Notice type='error' style={styles.input}>
                  メールアドレス・パスワードを設定しましょう
                </Notice>
                <div style={{height: 24}} />
                <div style={styles.flex}>
                  <Field style={styles.input} name='email' component={renderTextInput} label='メールアドレス' type='text' normalize={s => s.trim()} />
                  <Field style={styles.input} name='newpassword' component={renderTextInput} label='新しいパスワード' type='password' />
                </div>
              </div>
            }
            <div style={styles.input}>
              <Button variant='contained'
                type='submit'
                disabled={submitting}
                color='primary'
                style={styles.submitButton}
              >
                {submitting ? <CircularProgress size={20} color='secondary' /> : '更新する'}
              </Button>
            </div>
          </form>
        </div>
      </AutohideHeaderContainer>
    )
  }
}
