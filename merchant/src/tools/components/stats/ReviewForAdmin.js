import React from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { Button, MenuItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { updateReview, removeReview } from 'tools/modules/profile'
import Review from 'components/Review'
import CustomChip from 'components/CustomChip'
import ConfirmDialog from 'components/ConfirmDialog'
import renderNumberInput from 'components/form/renderNumberInput'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderSelect from 'components/form/renderSelect'

@withStyles(theme => ({
  edit: {
    margin: '5px 0',
    padding: 10,
    background: theme.palette.grey[100],
    border: `1px solid ${theme.palette.grey[300]}`,
  },
}))
@connect(
  state => ({
    admin: state.auth.admin,
  }),
  { updateReview, removeReview }
)
export default class ReviewForAdmin extends React.Component {

  constructor(props) {
    super(props)
    this.state = {}
  }

  onSubmit = ({ rating, username, service, text, reply }) => {
    this.setState({edit: false})
    return this.props.updateReview({id: this.props.review.id, username, service, rating, text, reply })
  }

  deleteReview = () => {
    this.props.removeReview(this.props.review.id).then(() => {
      this.setState({edit: false, open: false})
    })
  }

  render() {
    const { review, services, admin, classes } = this.props

    return (
      <div>
        {this.state.edit ?
          <div className={classes.edit}>
            <ReviewForm onSubmit={this.onSubmit} services={services} form={`review_${review.id}`} initialValues={{...review, service: review.service && review.service.id}}>
              <div style={{display: 'flex'}}>
                <Button variant='outlined' size='small' onClick={() => this.setState({edit: false})}>キャンセル</Button>
                <div style={{flex: 1}} />
                {admin > 9 && <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({open: true})}>削除</Button>}
                <Button type='submit' size='small' variant='contained' color='primary' style={{marginLeft: 10}}>更新</Button>
              </div>
            </ReviewForm>
          </div>
        :
          <Review review={review}>
            <Button
              variant='contained'
              color='secondary'
              size='small'
              onClick={() => this.setState({edit: true})}
              style={{marginTop: 10}}
            >
              編集
            </Button>
            {review.meet && <CustomChip label='SMOOOSY内' style={{marginLeft: 10}} />}
          </Review>
        }
        <ConfirmDialog open={!!this.state.open} title='レビューを削除しますか？' onSubmit={this.deleteReview} onClose={() => this.setState({open: false})} />
      </div>
    )
  }
}

const ReviewForm = reduxForm()(props => (
  <form onSubmit={props.handleSubmit(props.onSubmit)}>
    <Field name='username' label='投稿者名' component={renderTextInput} />
    <div style={{display: 'flex', marginBottom: 10}}>
      <Field name='service' label='サービス' component={renderSelect}>
        {props.services.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
      </Field>
      <Field name='rating' label='評価' component={renderNumberInput} max={5} min={1} inputStyle={{width: 50, marginLeft: 20, height: 30}} />
      <div style={{flex: 1}} />
    </div>
    <Field name='text' component={renderTextArea} />
    <Field name='reply' label='プロからの返信' component={renderTextArea} />
    {!props.submitting && props.children}
  </form>
))
