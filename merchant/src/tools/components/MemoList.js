import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { yellow } from '@material-ui/core/colors'
import CloseIcon from '@material-ui/icons/Close'

import { withApiClient } from 'contexts/apiClient'
import ChatInput from 'components/ChatInput'
import ConfirmDialog from 'components/ConfirmDialog'
import { relativeTime } from 'lib/date'
import Linkify from 'react-linkify'

@withApiClient
@withStyles(theme => ({
  root: {
    width: '100%',
  },
  form: {
    padding: 5,
    display: 'flex',
    alignItems: 'flex-start',
    background: yellow[100],
    border: `1px solid ${yellow[500]}`,
  },
  memo: {
    marginTop: 5,
    padding: 5,
    display: 'flex',
    fontSize: 14,
    background: yellow[100],
    border: `1px solid ${yellow[500]}`,
  },
  username: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  text: {
    flex: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  time: {
    marginLeft: 10,
    color: theme.palette.grey[700],
  },
}))
@reduxForm({
  validate: values => {
    const errors = {}
    if (!values.text) {
      errors.text = '必須'
    }
    return errors
  },
})
export default class MemoList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.load()
  }

  load = () => {
    const { request, profile, lead, user } = this.props
    this.props.apiClient
      .get(`/api/admin/memos?item=${request || profile || lead || user}`)
      .then(res => this.setState({memos: res.data}))
  }

  onKeyDown = (e, submit) => {
    if ((e.metaKey || e.ctrlKey) && e.keyCode === 13) { // Cmd + Enter or Ctrl + Enter
      submit()
    }
  }

  createMemo = values => {
    const { request, profile, lead, user } = this.props
    this.props.apiClient.post('/api/admin/memos', {
      ...values,
      item: request || profile || lead || user,
      reference: request ? 'Request' : profile ? 'Profile' : lead ? 'Lead' : user ? 'User' : null,
    })
    .then(res => {
      this.setState({memos: [res.data, ...this.state.memos]})
      this.props.initialize()
    })
  }

  removeMemo = id => {
    this.setState({confirm: false})
    this.props.apiClient.delete(`/api/admin/memos/${id}`)
      .then(() => this.load())
  }

  render() {
    const { handleSubmit, pristine, invalid, classes, style } = this.props
    const { memos } = this.state

    if (!memos) return null

    return (
      <div className={classes.root} style={style}>
        <form className={classes.form} onSubmit={handleSubmit(this.createMemo)}>
          <Field name='text' component={ChatInput} style={{flex: 1, marginRight: 5}} onKeyDown={e => this.onKeyDown(e, handleSubmit(this.createMemo))} />
          <Button variant='contained' color='secondary' style={{minWidth: 60}} disabled={pristine || invalid} type='submit'>追加</Button>
        </form>
        {memos.map(memo =>
          <div key={memo._id} className={classes.memo}>
            <div className={classes.username}>{memo.username}</div>
            <div className={classes.text}>
              <Linkify properties={{target: '_blank', rel: 'nofollow'}}>{memo.text}</Linkify>
              <span className={classes.time}>{relativeTime(new Date(memo.createdAt))}</span>
            </div>
            <CloseIcon style={{width: 20, height: 20}} onClick={() => this.setState({confirm: memo._id})} />
          </div>
        )}
        <ConfirmDialog
          open={!!this.state.confirm}
          title='削除しますか？'
          onClose={() => this.setState({confirm: false})}
          onSubmit={() => this.removeMemo(this.state.confirm)}
        />
      </div>
    )
  }
}
