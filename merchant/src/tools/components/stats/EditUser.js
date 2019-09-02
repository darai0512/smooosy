import React from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { emailWarn, emailValidator, phoneValidator } from 'lib/validate'
import { Button } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, RadioGroup, FormControlLabel, Radio } from '@material-ui/core'
import { red } from '@material-ui/core/colors'

import { update } from 'tools/modules/auth'
import { open as openSnack } from 'tools/modules/snack'
import DeactivateDialog from 'tools/components/DeactivateDialog'
import renderCheckbox from 'components/form/renderCheckbox'
import renderTextInput from 'components/form/renderTextInput'
import { notificationTypes } from '@smooosy/config'
import emailTypo from 'lib/emailTypo'


const selector = formValueSelector('editUser')

@reduxForm({
  form: 'editUser',
  validate: (values) => {
    const errors = {}
    if (!values.lastname) {
      errors.lastname = '必須項目です'
    }
    errors.email = emailValidator(values.email).email
    errors.phone = phoneValidator(values.phone).phone
    return errors
  },
  warn: (values, props) => ({
    email: emailWarn(values.email) || emailTypo(values.email, (email) => props.dispatch(props.change('email', email))),
  }),
})
@connect(
  state => ({
    admin: state.auth.admin,
    corporation: selector(state, 'corporation'),
  }),
  { update, openSnack }
)
export default class EditUser extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      type: 'email',
    }
  }

  // loadUserが呼ばれてinitialValuesが更新された場合、initializeを呼ぶ
  getSnapshotBeforeUpdate(prevProps) {
    return this.props.initialValues !== prevProps.initialValues
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (snapshot) this.props.initialize(this.props.initialValues)
  }

  submit = (values) => {
    const { initialValues, corporation } = this.props
    const body = {
      id: initialValues.id,
    }

    // initialValuesから変化のある値だけ送る
    for (let name of Object.keys(values)) {
      if (values[name] !== initialValues[name]) {
        body[name] = values[name]
      }
    }
    if (corporation) {
      body.firstname = ''
    }
    body.updatedAt = initialValues.updatedAt
    this.props.update(body)
      .then(() => this.props.onUpdate())
      .catch(err => {
        console.log(err)
        const msg = err.code === 901 ? '登録済みのメールアドレスです' : err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
        this.props.openSnack(msg)
      })
  }

  render () {
    const { open, initialValues, onClose, admin, handleSubmit, corporation, showNotification, showAdmin } = this.props
    const { type } = this.state

    return (
      <Dialog open={!!open} onClose={() => onClose()}>
        <form onSubmit={handleSubmit(this.submit)}>
          <DialogTitle>ユーザー情報編集</DialogTitle>
          <DialogContent>
            <div>ID: {initialValues.id}</div>
            {
              corporation ?
                <div>
                  <Field name='lastname' component={renderTextInput} label='事業者名' type='text' />
                  <Field name='firstname' component={renderTextInput} style={{display: 'none'}} type='text' />
                </div>
              :
              <div style={{display: 'flex'}}>
                <Field name='lastname' component={renderTextInput} style={{flex: 1, marginRight: 5}}  label='姓' type='text' />
                <Field name='firstname' component={renderTextInput} style={{flex: 1, marginLeft: 5}} label='名' type='text' />
              </div>
            }
            <Field name='corporation' component={renderCheckbox} label='法人' />
            <div style={{display: 'flex'}}>
              <Field name='email' component={renderTextInput} style={{flex: 1, marginRight: 5}} label='メールアドレス' placeholder='abc@gmail.com' type='email' />
              <Field name='phone' component={renderTextInput} style={{flex: 1, marginLeft: 5}} label='電話番号' placeholder='00011112222' type='tel' />
            </div>
            <Field name='bounce' component={renderCheckbox} label='バウンス' />
            {showNotification &&
              <>
                <Tabs
                  value={type}
                  onChange={(_, type) => this.setState({type})}
                  variant='fullWidth'
                  >
                  <Tab value='email' label='メール通知' style={{maxWidth: 'none', minWidth: 'auto'}} />
                  <Tab value='line' label='LINE通知' style={{maxWidth: 'none', minWidth: 'auto'}} />
                </Tabs>
                {type === 'line' && !initialValues.lineId ?
                  <div style={{padding: '40px 0px', textAlign: 'center'}}>
                    未連携
                  </div>
                :
                  <div style={{display: 'flex', flexWrap: 'wrap'}}>
                    {Object.keys(notificationTypes).map(k =>
                      notificationTypes[k].target.includes(initialValues.pro ? 'pro' : 'user') ?
                        <Field
                          key={k}
                          name={`notification.${k}.${type}`}
                          component={renderCheckbox}
                          label={notificationTypes[k].label}
                        />
                      : null
                    )}
                  </div>
                }
              </>
            }
            {showAdmin && (initialValues.admin || 0) < 10 &&
              <div style={{border: `1px solid ${red[500]}`, background: red[50], padding: 10}}>
                <Field name='admin' component={({input}) =>
                  <RadioGroup
                    name={input.name}
                    value={input.value + ''}
                    onChange={e => input.onChange(e.target.value)}
                    style={{flexDirection: 'row'}}
                    disabled={input.value === '10'}
                  >
                    <FormControlLabel value='3' label='閲覧編集' control={<Radio color='primary' />} />
                    <FormControlLabel value='2' label='プロフィール編集' control={<Radio color='primary' />} />
                    <FormControlLabel value='1' label='プロ紹介のみ' control={<Radio color='primary' />} />
                  </RadioGroup>
                } />
              </div>
            }
          </DialogContent>
          <DialogActions>
            {initialValues.id && !initialValues.deactivate && admin > 1 && <Button color='secondary' onClick={() => this.setState({openDeactivate: true})}>退会処理</Button>}
            <div style={{flex: 1}} />
            <Button type='submit' variant='contained' color='primary'>
              {initialValues.id ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
        <DeactivateDialog
          open={this.state.openDeactivate}
          user={initialValues}
          onUpdate={this.props.onUpdate}
          onClose={() => this.setState({openDeactivate: false})}
        />
      </Dialog>
    )
  }
}
