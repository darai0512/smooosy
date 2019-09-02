import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, formValueSelector } from 'redux-form'
import { FormControl, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'

import ConfirmDialog from 'components/ConfirmDialog'
import renderTextArea from 'components/form/renderTextArea'

import { withApiClient } from 'contexts/apiClient'
import { passReason } from '@smooosy/config'

import { pass as passRequest } from 'modules/request'

const selector = formValueSelector('feedback')

@withApiClient
@withWidth()
@withTheme
@reduxForm({
  form: 'feedback',
  initialValues: {
    text: '',
  },
})
@connect(
  state => ({
    text: selector(state, 'text'),
  }),
  { passRequest }
)
export default class PassDialog extends React.Component {

  static defaultProps = {
    open: false,
  }

  state = {
    queryModal: false,
    answered: false,
    reason: null,
  }

  onClose = () => {
    const { onClose, onPass } = this.props

    this.setState({queryModal: false})
    if (onClose) {
      onClose()
    }
    if (onPass) {
      onPass()
    }
  }

  pass = () => {
    const { requestForPro, profile } = this.props
    const { reason } = this.state

    this.props.passRequest(requestForPro._id, {profile: profile.id, reason: passReason[reason]})
       .then(() => {
         const queryModal = reason === 'query'
         this.setState({queryModal})
         if (!queryModal) {
           this.onClose()
         }
       })
  }

  postFeedback = text => {
    const { requestForPro, profile } = this.props

    this.props.apiClient.post('/api/feedbacks', {
      text,
      request: requestForPro._id,
      profile: profile.id,
      type: 'パス',
    })
  }

  onAnswerSubmit = () => {
    if (this.state.answered) {
      this.onClose()
    } else {
      this.postFeedback(this.props.text)
      this.setState({answered: true})
    }
  }

  render() {
    const { open, requestForPro, onClose, theme } = this.props
    const { answered, queryModal, reason } = this.state
    const { common } = theme.palette

    return (
      <div>
        <ConfirmDialog
          open={!!open && !queryModal}
          title='理由を選んでください'
          label='パスする'
          onSubmit={() => this.pass()}
          onClose={onClose}
        >
          <FormControl>
            <RadioGroup name='pass' style={{paddingBottom: 10}} value={reason} onChange={(e, reason) => this.setState({reason})}>
              {Object.keys(passReason).map(r =>
                <FormControlLabel key={r} value={r} label={passReason[r]}  control={<Radio color='primary' />} />
              )}
            </RadioGroup>
          </FormControl>
        </ConfirmDialog>
        <ConfirmDialog
          title={answered ? 'ご回答ありがとうございました' : 'アンケートのお願い'}
          label={answered ? '閉じる' : '送信する'}
          alert={true}
          open={!!queryModal}
          onSubmit={this.onAnswerSubmit}
          onClose={this.onClose}
        >
          {answered ?
            <div>
              今後のサービス改善の参考にさせて頂きます。
              引き続きSMOOOSYを宜しくお願いいたします。
            </div>
          :
            <form>
              依頼者に入力してほしい情報を教えてください。
              <div style={{marginTop: 20, fontSize: 13, fontWeight: 'bold', color: '#666'}}>サービス</div>
              <div style={{marginBottom: 10, color: common.black}}>{requestForPro.service.name}</div>
              <Field name='text' label='必要な情報' component={renderTextArea} textareaStyle={{height: 150}} />
            </form>
          }
        </ConfirmDialog>
      </div>
    )
  }
}
