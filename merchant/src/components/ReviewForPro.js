import React from 'react'
import { Field, reduxForm } from 'redux-form'
import { Button, CircularProgress } from '@material-ui/core'

import Review from 'components/Review'
import ThanksButton from 'components/ThanksButton'
import renderTextArea from 'components/form/renderTextArea'

const ReviewForPro = ({review, onReply}) => (
  <Review review={review}>
    {review.user &&
      <div style={{marginTop: 10}}>
        <ThanksButton user={{id: review.user}} name={review.username} />
      </div>
    }
    {!review.reply &&
      <details style={{marginTop: 10, fontSize: 13}}>
        <summary>クチコミに返信する</summary>
        <ReplyForm
          onSubmit={({reply}) => onReply({id: review.id, reply})}
          form={`review_reply_${review.id}`}
        />
      </details>
    }
  </Review>
)


export default ReviewForPro

const ReplyForm = reduxForm({
  validate: values => {
    const errors = {}
    if (!values.reply) {
      errors.reply = 'コメントを入力してください'
    }
    return errors
  },
})(props => (
  <form onSubmit={props.handleSubmit(props.onSubmit)} style={{display: 'flex', flexDirection: 'column'}}>
    <Field name='reply' label='返信コメント' component={renderTextArea} />
    <Button color='primary' variant='contained' type='submit' disabled={props.submitting} style={{alignSelf: 'flex-end'}}>
      {props.submitting ? <CircularProgress size={20} color='secondary' /> : '送信する'}
    </Button>
  </form>
))
