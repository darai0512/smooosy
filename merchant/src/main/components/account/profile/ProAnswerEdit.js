import React from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'

import { show as loadProQuestions } from 'modules/proQuestion'
import { update } from 'modules/proAnswer'
import renderTextArea from 'components/form/renderTextArea'
import { hasNGWords, hasEmail, hasPhone, hasURL } from 'lib/validate'

@withTheme
@connect(
  null,
  { update, loadProQuestions }
)
@reduxForm({
  form: 'proAnswer',
  validate: values => {
    const errors = {}
    for (const key in values) {
      const value = values[key]
      if (value) {
        if (hasNGWords(value)) {
          errors[key] = 'NGワードが含まれています'
        } else if (hasEmail(value)) {
          errors[key] = 'メールアドレスが含まれています'
        } else if (hasPhone(value)) {
          errors[key] = '電話番号が含まれています'
        } else if (hasURL(value)) {
          errors[key] = 'URLが含まれています'
        } else if (/(\D)\1{9}/.test(value)) {
          errors[key] = '連続で同じ文字が繰り返されています。'
        } else if (/^[ 　\r\n\t]*$/.test(value)) { // eslint-disable-line
          errors[key] = '空白文字のみです。'
        } else if (value.length < 50 || value.length > 250) {
          errors[key] = `50文字以上250文字以下で入力してください(現在: ${value.length}文字)`
        }
      }
    }

    return errors
  },
})
export default class ProAnswerEdit extends React.Component {

  constructor (props) {
    super(props)
    const init = {}
    for (let proQuestion of props.proQuestions) {
      init[proQuestion.id] = proQuestion.answer
    }
    this.props.initialize(init)
    this.props.reset()
    this.state = {
      currentQuestionPage: props.currentQuestionPage,
    }

    if (props.proQuestions.length === 0) props.onSubmit()
  }

  submit = (values) => {
    const { profile, proQuestions, onSubmit } = this.props
    const datas = {
      profile,
      proQuestions: proQuestions.map(pq => ({id: pq.id, service: pq.service, text: values[pq.id]})),
    }
    this.props.update(datas)
      .then(() => {
        onSubmit()
        return this.props.loadProQuestions(profile.id)
      })
  }

  render () {
    const { proQuestions, handleSubmit, theme } = this.props
    const { currentQuestionPage } = this.state
    const { grey, blue } = theme.palette

    return (
      <form onSubmit={handleSubmit(this.submit)} style={{padding: 20}}>
        {proQuestions.slice(currentQuestionPage * 5, (currentQuestionPage + 1) * 5).map(pq => (
          <div key={pq.id}>
            <h4 style={{fontWeight: 'bold'}}>{pq.text}</h4>
            <Field name={pq.id} component={renderTextArea} type='text' value={pq.answer || ''} textareaStyle={{height: 80}} />
          </div>
        ))}
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
          <div style={{marginRight: 10}}>ページ</div>
          {[...Array(Math.ceil(proQuestions.length / 5) || 1)].map((_, idx) =>
            <a
              key={`proanswer_${idx}`}
              style={idx === currentQuestionPage ?
                {color: grey[500], pointerEvents: 'none', marginleft: 10, marginRight: 10}
              : {color: blue.A200, pointerEvents: 'auto', marginleft: 10, marginRight: 10}}
              onClick={() => this.setState({currentQuestionPage: idx})}
            >
              {idx + 1}
            </a>
          )}
        </div>
        <Button type='submit' size='small' variant='contained' color='primary' style={{width: '100%', marginTop: 10, height: 50}}>保存する</Button>
      </form>
    )
  }
}
