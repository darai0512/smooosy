import React from 'react'
import { FieldArray, Form, reduxForm, SubmissionError } from 'redux-form'
import { connect } from 'react-redux'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import { green } from '@material-ui/core/colors'

import { withApiClient } from 'contexts/apiClient'
import { requestReview } from 'modules/profile'
import { open as openSnack } from 'modules/snack'
import EmailReview from 'components/EmailReview'
import renderArrayField from 'components/form/renderArrayField'
import { webOrigin, isEmail } from '@smooosy/config'

@withApiClient
@withStyles(theme => ({
  review: {
    width: '100%',
    maxWidth: 564,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 3,
  },
}))
@reduxForm({
  form: 'emails',
  initialValues: {
    emailArray: ['', '', ''],
  },
  validate: values => {
    const errors = {}
    const emailErrors = []
    const { emailArray } = values
    emailArray && emailArray.forEach((email, idx) => {
      if (email && email.trim() && !isEmail(email.trim())) {
        emailErrors[idx] = 'メールアドレスが不正です'
      }
    })
    if (emailErrors.length) {
      errors.emailArray = emailErrors
    }
    return errors
  },
})
@connect(
  null,
  { requestReview, openSnack }
)
export default class ReviewRequestForm extends React.Component {
  static defaultProps = {
    onRef: () => {},
    onSent: () => {},
    onSkip: null,
    style: {},
  }

  constructor(props) {
    super(props)
    this.state = {
      sent: false,
      text: '',
    }
  }

  componentDidMount() {
    if (!this.props.profile) return
    this.props.onRef(this)
    this.props.apiClient.get(`/api/profiles/${this.props.profile.id}/reviewTemplate`)
      .then(res => this.setState({text: res.data}))
  }
  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  submit = () => {
    this.props.dispatch(this.props.submit('emails'))
  }

  email = (values) => {
    const noEmail = values.emailArray.every(e => !e || !e.length)
    if (noEmail) throw new SubmissionError({_error: '少なくとも一つのメールアドレスを入力してください'})
    return this.send(values)
      .then(() => {
        this.setState({sent: true})
        this.props.onSent()
        window.mixpanel && window.mixpanel.track('pro: review request mail')
        this.props.reset()
      })
  }

  send = (values) => {
    const { profile } = this.props
    const emails = values.emailArray.filter(e => e && isEmail(e.trim())).map(e => e.trim())
    return this.props.requestReview(profile.id, {emails: [...new Set(emails)], text: this.state.text})
  }

  render() {
    const { onSkip, profile, pro, hideSubmitButton, handleSubmit, error, submitting, classes } = this.props
    const { text } = this.state

    if (!profile) return null

    const url = `${webOrigin}/r/${profile.shortId}`

    return (
      <Form onSubmit={handleSubmit(this.email)}>
        <div style={{margin: '20px 0'}}>
          <h4>送信先</h4>
          <FieldArray
            name='emailArray'
            component={renderArrayField}
            width={220}
            error={error}
            placeholder='メールアドレス'
            addLabel='メールアドレスを追加'
          />
        </div>
        {this.state.text &&
          <div style={{margin: '20px 0'}}>
            <h4>プレビュー</h4>
            <div className={classes.review}>
              <EmailReview pro={pro} profile={profile} text={text} onChange={text => this.setState({text})} />
            </div>
          </div>
        }
        <div style={{display: 'flex', alignItems: 'center'}}>
          <CopyToClipboard
            text={url}
            onCopy={() => this.props.openSnack('コピーしました', {anchor: {vertical: 'bottom', horizontal: 'left'}})}>
            <Button variant='outlined' color='primary'>クチコミリンクを取得</Button>
          </CopyToClipboard>
          <div style={{flex: 1}} />
          {hideSubmitButton ? null
          : this.state.sent ?
            <div style={{margin: 'auto 10px', color: green[700]}}>送信しました</div>
          : onSkip ?
            <Button className='reviewRequestFormSkipButton' onClick={onSkip} style={{marginRight: 10}} >スキップ</Button>
          : null}
          {!hideSubmitButton && <Button className='reviewRequestFormSubmitButton' variant='contained' color='primary' type='submit' disabled={submitting}>送信する</Button>}
        </div>
      </Form>
    )
  }
}

