import React from 'react'
import {
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  withWidth,
} from '@material-ui/core'
import TextArea from 'components/form/renderTextArea'
import { hasNGWords } from 'lib/validate'

@withWidth()
export default class RequestReviewDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      reviewMsgError: null,
      reviewMsg: 'ご依頼いただき、ありがとうございました。お忙しいところ大変恐縮ではございますが、私のこれまでのお客様の声をご紹介したく、私のクチコミをお願いしております。星をつけて一言書いていただくだけでも結構です。よろしくお願いいたします。',
    }
  }

  onChange = e => this.setState({reviewMsg: e.target.value})

  handleDone = () => {
    const {reviewMsg} = this.state
    if (hasNGWords(reviewMsg)) {
      this.setState({reviewMsgError: 'NGワードが含まれています'})
      return
    }
    this.setState({reviewMsgError: null})
    this.props.handleDone(reviewMsg)
  }

  closeReviewModal = () => {
    this.setState({
      reviewMsgError: null,
    })
    this.props.onClose()
  }

  render() {
    const {title, open, reviewRequestBeforeArchive, meetFaq, toggleArchive, width, onClose} = this.props
    const {reviewMsg, reviewMsgError} = this.state
    return (
      <Dialog
        open={open}
        onClose={onClose}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <p>
            クチコミがある場合、依頼主があなたを選ぶ可能性は倍以上に高まります。
            <a href={meetFaq.reviewEffect.url} target='_blank' rel='noopener noreferrer'>{meetFaq.reviewEffect.label}</a>
          </p>
          <p style={{marginTop: 20}}>メッセージ</p>
          <TextArea value={reviewMsg} meta={{touched: !!reviewMsgError, error: reviewMsgError}} onChange={this.onChange} />
        </DialogContent>
        <DialogActions>
          <div style={{display: 'flex', width: '100%'}}>
            <Button key='cancel' size={width === 'xs' ? 'small' : 'medium'} style={{marginRight: 8}} onClick={this.closeReviewModal}>{width === 'xs' ? 'キャンセル' : 'まだ仕事は完了していません'}</Button>
            <div style={{flex: 1}} />
            {reviewRequestBeforeArchive && <Button key='cancel' size={width === 'xs' ? 'small' : 'medium'} style={{marginRight: 8}} onClick={toggleArchive}>依頼しない</Button>}
            <Button key='submit' size={width === 'xs' ? 'medium' : 'large'} variant='contained' color='primary' onClick={this.handleDone}>依頼する</Button>
          </div>
        </DialogActions>
      </Dialog>
    )
  }
}
