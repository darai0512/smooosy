import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Dialog, DialogContent } from '@material-ui/core'

import { inquiry } from 'tools/modules/lead'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'

const fieldNames = {
  name: '氏名',
  firstname: '苗字',
  lastname: '名前',
  ruby: 'ふりがな',
  phone: '電話番号',
  email: 'メール',
  address: '住所',
  zipcode: '郵便番号',
}

@connect(
  () => ({}),
  { inquiry }
)
@reduxForm({
  form: 'inquiry',
  initialValues: {
    name: '株式会社SMOOOSY ',
    firstname: '株式会社SMOOOSY ',
    lastname: '株式会社SMOOOSY ',
    ruby: 'かぶしきがいしゃみつもあ',
    phone: '',
    email: 'info@smooosy.biz',
    address: '東京都港区赤坂2-22-19南部坂アネックス601号室',
    zipcode: '1070052',
    message: '',
  },
})
export default class InquiryDialog extends React.Component {
  state = {}

  handleSubmit = values => {
    const { leads } = this.props
    const data = leads.map(l => {
      const d = Object.assign({}, values)
      d.message = d.message.replace(/{{name}}/g, l.name)
      return {
        url: l.formUrl,
        inquiryData: d,
        id: l._id,
      }
    })
    this.props.inquiry(data)
    this.props.onClose()
  }

  render() {
    const { leads = [], onClose, handleSubmit, open, children } = this.props
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
        {leads.length ?
          <div>
            <div>送信先：{leads.length}件</div>
            <form onSubmit={handleSubmit(this.handleSubmit)}>
              {Object.keys(fieldNames).map(name =>
                <div key={name}>
                  <Field
                    component={renderTextInput}
                    label={fieldNames[name]}
                    name={name}
                  />
                </div>
              )}
              <Field
                component={renderTextArea}
                label='本文（ {{name}}はleadの名前に変換されます ）'
                name='message'
              />
              {children}
            </form>
          </div>
        :
          <div>選択された見込み顧客のurlは、全件が一度投稿済みです</div>
        }
        </DialogContent>
      </Dialog>
    )
  }
}
