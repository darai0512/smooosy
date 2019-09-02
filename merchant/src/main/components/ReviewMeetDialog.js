import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import {
  Button,
  CircularProgress,
  Dialog,
  withStyles,
} from '@material-ui/core'
import { red } from '@material-ui/core/colors'
import { withRollOut } from 'contexts/rollOut'
import renderTextArea from 'components/form/renderTextArea'
import renderCheckbox from 'components/form/renderCheckbox'
import RatingStar from 'components/RatingStar'
import renderTextInput from 'components/form/renderTextInput'

import { review as createReview } from 'modules/meet'

@withRollOut
@withStyles(theme => ({
  root: {
    minWidth: 500,
    padding: '20px 10px 0',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      minWidth: 0,
    },
  },
  campaignHeader: {
    wordBreak: 'keep-all',
  },
  caution: {
    marginBottom: 10,
    fontSize: 14,
    color: red[500],
    wordBreak: 'keep-all',
  },
  message: {
    margin: 5,
    fontSize: 14,
  },
  rating: {
    width: 150,
    margin: '0 auto',
  },
  form: {
    textAlign: 'left',
  },
}))
@connect(
  null,
  { createReview }
)
export default class ReviewMeetDialog extends React.PureComponent {

  state = {
    rating: 0,
  }

  constructor(props) {
    super(props)
    this.state = {
      rating: this.props.rating,
    }
  }

  handleRating = (rating) => {
    this.setState({rating})
  }

  handleReview = (values) => {
    const { meet, user, onSubmit } = this.props
    const { rating } = this.state

    const id = meet.id
    return this.props.createReview(id, {rating, user: user.id, username: values.username, text: values.text, thanks: values.thanks})
      .then(() => {
        if (onSubmit) onSubmit()
      })
  }

  render() {
    const { meet, open, onClose, classes, user } = this.props
    const { rating } = this.state
    const rollouts = this.props.rollouts || {}

    return (
      <Dialog
        open={open}
        onClose={onClose}
      >
        <div className={classes.root}>
          {rollouts.enableReviewCampaign ? <h4 className={classes.campaignHeader}>仕事のクチコミのみの投稿も可能です。 投稿しますか？</h4> : <h4>{`「${meet.profile.name}」のクチコミにご協力ください`}</h4>}
          {rollouts.enableReviewCampaign && <div className={classes.caution}>
            ※Amazon ギフト券は獲得できません。
            ご注意ください。
          </div>}
          <div className={classes.message}>{meet.profile.name}様はいかがでしたか？</div>
          <div className={classes.rating}>
            <RatingStar canChange rating={rating} onChange={this.handleRating} />
          </div>
          {rating &&
            <ReviewForm
              form={`reviewForm_${meet._id}`}
              onSubmit={this.handleReview}
              onClose={onClose}
              classes={classes}
              initialValues={{username: user.lastname, thanks: true}}
            />
          }
        </div>
      </Dialog>
    )
  }
}


let ReviewForm = ({handleSubmit, classes, onClose, submitting}) => {
  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      <Field component={renderTextInput} name='username' label='投稿者名' />
      <Field component={renderTextArea} name='text' label='クチコミ' style={{flex: 1}} textareaStyle={{height: 160}} placeholder='家族写真の撮影をしていただきました。&#13;&#10;チャットのレスポンスも丁寧で、安心して依頼することができました。&#13;&#10;撮影時には様々な構図を提案していただきとても助かりました。&#13;&#10;ありがとうございました。' />
      <Field component={renderCheckbox} name='thanks' label='ありがとうも一緒に送る' />
      <div style={{display: 'flex', marginBottom: 10}}>
        <Button onClick={onClose}>
          まだ依頼中です
        </Button>
        <div style={{flex: 1}} />
        <Button variant='contained'
          type='submit'
          color='primary'
        >
          {submitting ? <CircularProgress size={20} color='secondary' /> : '送信する'}
        </Button>
      </div>
    </form>
  )
}

ReviewForm = reduxForm({
  destroyOnUnmount: false, // keep values even if Dialog is closed
  validate: values => {
    const errors = {}
    if (!values.text) {
      errors.text = '必須項目です'
    }
    if (!values.username) {
      errors.username = '必須項目です'
    }
    return errors
  },
})(ReviewForm)