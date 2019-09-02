import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { update as updateUser } from 'modules/auth'
import { load as loadProfile, update as updateProfile } from 'modules/profile'
import { Button, CircularProgress } from '@material-ui/core'
import AvatarCropper from 'components/AvatarCropper'
import renderTextInput from 'components/form/renderTextInput'
import { phoneValidator } from 'lib/validate'
import { zenhan } from 'lib/string'

@reduxForm({
  form: 'profile',
  validate: values => {
    const errors = {
      ...phoneValidator(zenhan(values.phone), true),
    }
    if (!values.name) {
      errors.name = '必須項目です'
    }
    return errors
  },
})
@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateUser, loadProfile, updateProfile }
)
export default class MainEdit extends React.Component {

  componentDidMount() {
    this.props.initialize({
      name: this.props.profile.name,
      phone: this.props.user.phone,
    })
    this.props.reset()
  }

  handleImage = (blob) => {
    const id = this.props.profile.id
    this.props.updateUser({}, blob).then(() => {
      this.props.loadProfile(id)
    })
  }

  submit = (values) => {
    const id = this.props.profile.id
    this.props.updateUser({phone: zenhan(values.phone)})
    return this.props.updateProfile(id, {name: values.name}).then(() => {
      return this.props.onSubmit()
    })
  }

  render () {
    const { profile, handleSubmit, submitting } = this.props

    const styles = {
      root: {
        padding: 20,
      },
    }

    return (
      <div style={styles.root}>
        <AvatarCropper user={profile.pro} handleImage={this.handleImage} />
        <form style={{marginTop: 30}} onSubmit={handleSubmit(this.submit)}>
          <Field name='name' component={renderTextInput} label='事業者名（個人事業主・フリーランスの方は屋号もしくはご自身のお名前をご記入ください）' />
          <Field name='phone' component={renderTextInput} label='電話番号' type='tel' />
          <Button variant='contained'
            type='submit'
            disabled={submitting}
            color='primary'
            style={{width: '100%', marginTop: 10, height: 50}}
          >
            {submitting ? <CircularProgress size={20} color='secondary' /> : '更新する'}
          </Button>
        </form>
      </div>
    )
  }
}
