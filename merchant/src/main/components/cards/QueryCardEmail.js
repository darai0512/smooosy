import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { Button, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import LockIcon from '@material-ui/icons/Lock'

import { withApiClient } from 'contexts/apiClient'
import renderTextInput from 'components/form/renderTextInput'
import AgreementLinks from 'components/AgreementLinks'
import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import FindingPro from 'components/cards/FindingPro'
import GoogleLogin from 'components/GoogleLogin'
import FacebookLogin from 'components/FacebookLogin'
import { login, signup, fblogin, googlelogin, linelogin, update as updateUser, reset as resetPassword, sendLog } from 'modules/auth'
import { emailWarn, emailValidator, passwordValidator, phoneValidator, requestValidateAnonymousName } from 'lib/validate'
import emailTypo from 'lib/emailTypo'
import { zenhan } from 'lib/string'
import { getBoolValue } from 'lib/runtimeConfig'
import { BQEventTypes } from '@smooosy/config'

@withApiClient
@connect(
  state => ({
    user: state.auth.user,
    authFailed: state.auth.failed,
    expSNSLogin: state.experiment.experiments.sns_login || 'control', // DEADCODE: SNSログイン
    mustPhone: getBoolValue(
      'mustPhone',
      state.runtimeConfig.runtimeConfigs
    ),
  }),
  { login, signup, fblogin, googlelogin, linelogin, updateUser, resetPassword, sendLog }
)
@reduxForm({
  destroyOnUnmount: false,
  form: 'email',
  validate: values => ({
    ...emailValidator(values.email),
    ...passwordValidator(values.password),
    ...(values.firstname && Object.keys(requestValidateAnonymousName(values.firstname)).length > 0 ? {firstname: '正しい名前を入力してください。'} : {}),
    ...(values.lastname ? Object.keys(requestValidateAnonymousName(values.lastname)).length === 0 ? {} : {lastname: '正しい名前を入力してください。'} : {lastname: '必須項目です'}),
    ...phoneValidator(zenhan(values.phone), true),
  }),
  warn: (values, props) => ({
    email: emailWarn(values.email) || emailTypo(values.email, (email) => props.dispatch(props.change('email', email))),
  }),
})
@withStyles(theme => ({
  root: {
    overflow: 'hidden',
    background: '#fafafa',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    height: 600,
    [theme.breakpoints.down('xs')]: {
      height: '100%',
    },
  },
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    padding: '0 24px 24px',
    [theme.breakpoints.down('xs')]: {
      padding: '0 16px 16px',
    },
  },
  name: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
  },
  comments: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  mobileComments: {
    display: 'flex',
    color: theme.palette.grey[500],
    fontSize: 13,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  secureIcon: {
    width: 24,
    height: 24,
    color: orange[500],
    marginRight: 5,
  },
  mobileSecureIcon: {
    width: 32,
    height: 32,
    color: orange[500],
    marginRight: 10,
  },
  segment: {
    display: 'flex',
    flexDirection: 'row',
  },
  radius: {
    borderRadius: 4,
  },
  inputWidth: {
    flex: 1,
  },
  agreement: {
    color: theme.palette.grey[500],
    padding: 5,
  },
  email: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
  },
  checkEmail: {
    fontSize: 24,
    margin: '5px 0 15px',
    wordBreak: 'break-all',
  },
  reset: {
    textAlign: 'center',
    fontSize: 12,
  },
  announce: {
    marginBottom: 10,
  },
  sns: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 40,
    fontWeight: 'bold',
    fontSize: 20,
    '&:before, &:after': {
      content: '\'\'',
      flexGrow: '1',
      height: '1px',
      background: theme.palette.grey[800],
      display: 'block',
    },
    '&:before': {
      marginRight: 10,
    },
    '&:after': {
      marginLeft: 10,
    },
  },
  next: {
    height: 50,
    width: 150,
    marginLeft: 10,
    marginTop: 21,
    [theme.breakpoints.down('xs')]: {
      width: 50,
    },
  },
}))
export default class QueryCardEmail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      emailStatus: props.user.needSocialRename ? 'afterSocialLogin' : null,
      corporation: 'personal',
      findingPro: props.shouldShowFindingPro,
      isSocialLoggedIn: props.user.needSocialRename ? true : false,
    }
    this.checkedList = {}
    this.dialogType = {
      email: 'email',
      name: 'name',
      phone: 'phone',
    }
    if (props.user) {
      props.initialize({lastname: props.user.lastname, firstname: props.user.firstname, phone: /^[0-9\-]+$/.test(props.phone) ? props.phone : ''})
    }
  }

  componentDidMount() {
    if (this.state.findingPro) {
      setTimeout(() => this.setState({findingPro: false}), 2500)
    }
  }

  sendTrackLog = (key) => {
    const { emailStatus, corporation } = this.state
    const { service, uuid } = this.props

    if (!this.checkedList[key]) {
      this.props.sendLog(BQEventTypes.web.MUST_PHONE, {
        action_type: 'next',
        id: uuid,
        service_id: service.id,
        key,
        emailStatus,
        corporation,
      })
      this.checkedList[key] = true
    }
  }

  emailKeyPress = (e) => {
    const { handleSubmit, dispatch } = this.props
    // Enter
    if (e.charCode === 13) {
      dispatch(handleSubmit(this.checkEmail))
    }
  }

  checkEmail = (values) => {
    return this.props.apiClient
      .get('/api/checkEmail', {params: values})
      .then(res => res.data.status)
      .then(emailStatus => {
        this.setState({emailStatus, checkedEmail: values.email})
        if (emailStatus === 'nopass') {
          // XXX TODO: 一定時間に遅れる回数を制限したほうが良さげ
          // XXX TODO: いきなりメール送らずに
          return this.props.resetPassword(values.email)
        }
        this.sendTrackLog(this.dialogType.email)
      })
  }

  loginAndNext = (values) => {
    const { password }  = values
    const { googleToken, facebookToken } = this.state
    return this.props.login({email: this.state.checkedEmail, password, googleToken, facebookToken})
      .then(() => {
        this.props.next()
      })
  }

  // 新規ユーザ登録処理
  signupAndNext = (values) => {
    const { emailStatus } = this.state
    const data = {
      email: values.email,
      firstname: values.firstname,
      lastname: values.lastname,
      phone: values.phone,
    }

    const { corporation } = this.state
    if (corporation === 'corporation') {
      delete data.firstname
      data.corporation = true
    }

    return this.props.signup(data).then(() => {
      this.props.next()
      if (emailStatus === 'requirePhone') this.sendTrackLog(this.dialogType.phone)
    })
  }

  // DEADCODE: SNSログイン後のユーザ名更新
  updateAndNext = (values) => {
    const data = {
      email: values.email,
      firstname: values.firstname,
      lastname: values.lastname,
      phone: values.phone,
      needSocialRename: false,
    }

    const { corporation } = this.state
    if (corporation === 'corporation') {
      delete data.firstname
      data.corporation = true
    }

    return this.props.updateUser(data).then(() => {
      this.props.next()
    })
  }

  // DEADCODE: Googleログイン（ユーザ登録）
  onGoogleLogin = (values) => {
    return this.props.googlelogin(values)
      .then((result) => {
        if (result.user.needSocialRename) {
          this.setState({emailStatus: 'afterSocialLogin', isSocialLoggedIn: true})
          this.props.initialize({lastname: result.user.lastname, firstname: result.user.firstname})
        } else {
          this.props.next()
        }
      })
  }

  // DEADCODE: Googleログイン失敗、email登録済みの場合
  onGoogleError = (message, code, email, token) => {
    if (code === 409 && email) {
      this.setState({emailStatus: 'yes', checkedEmail: email, googleToken: token})
    } else {
      alert(message)
    }
  }

  // DEADCODE: Facebookログイン（ユーザ登録）
  onFacebookLogin = (values) => {
    return this.props.fblogin(values)
      .then((result) => {
        if (result.user.needSocialRename) {
          this.setState({emailStatus: 'afterSocialLogin', isSocialLoggedIn: true})
          this.props.initialize({lastname: result.user.lastname, firstname: result.user.firstname})
        } else {
          this.props.next()
        }
      })
  }

  // DEADCODE: Facebookログイン失敗、email登録済みの場合
  onFacebookError = (message, code, email, token) => {
    if (code === 409 && email) {
      this.setState({emailStatus: 'yes', checkedEmail: email, facebookToken: token})
    } else {
      alert(message)
    }
  }

  // onLineLogin = ({lineCode, page}) => {
  //   return this.props.linelogin({lineCode, page}).then(({user}) => {
  //     this.props.next({signup: !!user.create})
  //   })
  // }

  handleChange = (event, corporation) => {
    this.setState({ corporation })
  }

  showPhoneDialog = () => {
    this.setState({emailStatus: 'requirePhone'})
    this.sendTrackLog(this.dialogType.name)
  }

  render() {
    const { findingPro, emailStatus, checkedEmail, corporation, isSocialLoggedIn } = this.state
    const { service, isLastQuery, handleSubmit, requirePhone, mustPhone, handlePhone, onClose, progress, submitting, classes } = this.props

    if (findingPro) {
      return <FindingPro service={service} />
    }

    const styles = {
      lastname: {
        marginRight: 6,
        flex: 1,
      },
      firstname: {
        marginLeft: 6,
        flex: 1,
      },
      input: {
        height: 55,
        fontSize: 24,
      },
    }

    const showPhoneInput = requirePhone || mustPhone
    const namePrev = isSocialLoggedIn ? null : () => this.setState({emailStatus: null, checkedEmail: null})
    const nameNext = showPhoneInput ? this.showPhoneDialog :
      isSocialLoggedIn ? handleSubmit(this.updateAndNext) : handleSubmit(this.signupAndNext)
    const needUpdate = !showPhoneInput && isLastQuery

    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        {emailStatus === null ?
          // DEADCODE: SNSログイン
          this.props.expSNSLogin === 'sns' ?
            <div key='container' className={classes.container}>
              <QueryCardHeader>
                見積もりを受け取るメールアドレスを入力してください
              </QueryCardHeader>
              <div style={{display: 'flex'}}>
                <Field classes={{input: 'emailInput'}} name='email' style={{width: '100%'}} component={renderTextInput} label='メールアドレス（必須）' type='email' normalize={s => s.trim()} inputStyle={styles.input} onKeyPress={this.emailKeyPress} />
                <Button className={[classes.next, 'nextQuery', 'email'].join(' ')} size='medium' variant='contained' color='primary' onClick={handleSubmit(this.checkEmail)}>次へ</Button>
              </div>
              <div className={classes.comments}>
                <LockIcon className={classes.secureIcon} />メールアドレスがプロに公開されることはありません
              </div>
              <div className={classes.mobileComments}>
                <LockIcon className={classes.mobileSecureIcon} />
                <div>メールアドレスは弊社からの連絡のためにのみ使用され、外部に公開されることはありません</div>
              </div>
              <div className={classes.sns}>もしくはSNSアカウントで登録</div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <GoogleLogin text='Google' style={{marginTop: 20, fontSize: 14, fontWeight: 'normal', width: 200, height: 50}} onLogin={this.onGoogleLogin} onError={this.onGoogleError} />
                <FacebookLogin label='Facebook' style={{marginTop: 20, textAlign: 'center'}} onLogin={this.onFacebookLogin} onError={this.onFacebookError} />
              </div>
            </div>
          :
            <>
              <div key='container' className={classes.container}>
                <QueryCardHeader>
                  見積もりを受け取るメールアドレスを入力してください
                </QueryCardHeader>
                <Field classes={{input: 'emailInput'}} name='email' component={renderTextInput} label='メールアドレス（必須）' type='email' normalize={s => s.trim()} inputStyle={styles.input} />
                <div className={classes.comments}>
                  <LockIcon className={classes.secureIcon} />メールアドレスがプロに公開されることはありません
                </div>
                <div className={classes.mobileComments}>
                  <LockIcon className={classes.mobileSecureIcon} />
                  <div>メールアドレスは弊社からの連絡のためにのみ使用され、外部に公開されることはありません</div>
                </div>
              </div>
              <QueryCardFooter
                key='footer'
                className='nextQuery email'
                onPrev={() => this.props.prev()}
                onNext={handleSubmit(this.checkEmail)}
                prevTitle='戻る'
                nextTitle='次へ'
              />
            </>
        : ['no', 'afterSocialLogin'].includes(emailStatus) ? [
          <div key='container' className={classes.container}>
            <QueryCardHeader>
              お名前を入力してください
            </QueryCardHeader>
            <RadioGroup
              classes={{root: classes.segment}}
              value={corporation}
              onChange={this.handleChange}
            >
              <FormControlLabel value='personal' control={<Radio color='primary' />} label='個人' />
              <FormControlLabel value='corporation' control={<Radio color='primary' />} label='法人' />
            </RadioGroup>
            {corporation === 'personal' ?  [
              <div key='personal' className={classes.name}>
                <Field name='lastname' style={styles.lastname} classes={{input: 'lastnameField'}} component={renderTextInput} label='姓（必須）' type='text' inputStyle={styles.input} />
                <Field name='firstname' style={styles.firstname} component={renderTextInput} label='名' type='text' inputStyle={styles.input} />
              </div>,
              <div key='privacy'>※ 苗字までをプロにお知らせします</div>,
            ] :
              <Field name='lastname' className='lastnameField' component={renderTextInput} placeholder='株式会社○○○○' label='法人名（必須）' type='text' inputStyle={styles.input} />
            }
          </div>,
          needUpdate ? <AgreementLinks key='agree' className={classes.agreement} label={isLastQuery ? '送信する' : '次へ'} /> : null,
          <QueryCardFooter
            key='footer'
            className='nextQuery name'
            onPrev={namePrev}
            onNext={nameNext}
            prevTitle='戻る'
            nextTitle={needUpdate ? '送信する' : '次へ'}
          />,
        ] : emailStatus === 'requirePhone' ? [
          <div key='container' className={classes.container}>
            <QueryCardHeader>
              電話番号を入力して下さい
            </QueryCardHeader>
            <Field classes={{input: 'phoneRequireInputField'}} name='phone' component={renderTextInput} label='電話番号（必須）' type='tel' onChange={handlePhone} />
            <div className={classes.comments}>
              <LockIcon className={classes.secureIcon} />
              <div>見積もりをした最大5人のプロにのみ電話番号を表示します。</div>
            </div>
          </div>,
          <AgreementLinks key='agree' className={classes.agreement} label={isLastQuery ? '送信する' : '次へ'} />,
          <QueryCardFooter
            key='footer'
            className='nextQuery phone'
            onPrev={() => this.setState({emailStatus: isSocialLoggedIn ? 'afterSocialLogin' : 'no'})}
            onNext={isSocialLoggedIn ? handleSubmit(this.updateAndNext) : handleSubmit(this.signupAndNext)}
            prevTitle='戻る'
            nextTitle={isLastQuery ? '送信する' : '次へ'}
          />,
        ] : emailStatus === 'yes' ? [
          <div key='container' className={classes.container}>
            <QueryCardHeader>
              ログインしてください
            </QueryCardHeader>
            <div className={classes.reset}><Link to='/reset' target='_blank'>パスワードを忘れた方はこちら</Link></div>
            <div className={classes.email}>メールアドレス</div>
            <div className={classes.checkEmail}>{checkedEmail}</div>
            <Field classes={{input: 'loginPassword'}} name='password' component={renderTextInput} label='パスワード' type='password' />
          </div>,
          <QueryCardFooter
            key='footer'
            className='loginSubmit'
            onPrev={() => this.setState({emailStatus: null, checkedEmail: null})}
            onNext={handleSubmit(this.loginAndNext)}
            prevTitle='戻る'
            nextTitle={isLastQuery ? '送信する' : '次へ'}
          />,
        ] : emailStatus === 'nopass' ? [
          <div key='container' className={classes.container}>
            <QueryCardHeader>
              このアカウントにはパスワードが設定されていません
            </QueryCardHeader>
            <p className={classes.announce}>入力されたメールアドレス宛にログイン用のURLをお送りしましたので、手順に従ってパスワードを設定してください。</p>
            <div className={classes.email}>メールアドレス</div>
            <div className={classes.checkEmail}>{checkedEmail}</div>
            <Field name='password' component={renderTextInput} label='パスワード' type='password' inputStyle={styles.input} />
          </div>,
          <QueryCardFooter
            key='footer'
            className='nextQuery email'
            disabledNext={submitting}
            onNext={handleSubmit(this.loginAndNext)}
            nextTitle={isLastQuery ? '送信する' : '次へ'}
          />,
        ] : null}
      </div>
    )
  }
}
