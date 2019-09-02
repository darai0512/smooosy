import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, formValueSelector } from 'redux-form'
import { Button, CircularProgress, IconButton } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import EditorAttachFile from '@material-ui/icons/AttachFile'

import { withApiClient } from 'contexts/apiClient'
import { create as createChat } from 'modules/chat'
import { open as openSnack } from 'modules/snack'
import ChatInput from 'components/ChatInput'
import FileUploader, { FileThumbnail } from 'components/FileUploader'
import storage from 'lib/storage'
import { hasNGWords } from 'lib/validate'
import { fileMime } from '@smooosy/config'

const selector = formValueSelector('chat')

@withApiClient
@withStyles(theme => ({
  root: {
    maxHeight: '90%',
    padding: '10px 10px 0',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  form: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  icons: {
    display: 'flex',
    padding: '5px 0',
  },
  actionIcon: {
    width: 36,
    height: 36,
    marginRight: 4,
    padding: 4,
  },
  textField: {
    flex: 1,
  },
}))
@reduxForm({
  form: 'chat',
  onChange: (values, dispatch, props) => {
    if (props.meet && props.meet.id) {
      const draft = storage.get('draft') || {}
      draft[props.meet.id] = values
      storage.save('draft', draft)
    }
  },
})
@connect(
  state => ({
    files: selector(state, 'files') || [],
  }),
  { createChat, openSnack }
)
export default class ChatForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    const { meet } = this.props
    const draft = storage.get('draft') || {}
    const tmp = draft[meet.id] || {}
    this.props.initialize({
      text: tmp.text || '',
      meetId: meet.id,
      files: tmp.files || [],
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.initialText !== prevProps.initialText) {
      this.props.change('text', this.props.initialText)
    }
    if (this.props.meet.id !== prevProps.meet.id) {
      const draft = storage.get('draft') || {}
      const tmp = draft[this.props.meet.id] || {}
      this.props.change('meetId', this.props.meet.id)
      this.props.change('text', tmp.text || '')
      this.props.change('files', tmp.files || [])
    }
  }

  handleFile = ({data, file, fileType}) => {
    const up = {
      id: data.id,
      url: data.url,
      name: file.name,
      type: fileType,
    }
    this.props.array.push('files', up)
  }

  deleteFile = (file, index) => {
    this.props.array.remove('files', index)
    this.props.apiClient.delete(`/api/chats/${file.id}`)
  }

  submitChat = (values) => {
    const submitData = {...values}
    submitData.text = submitData.text.trim()

    if (!values.files.length && !submitData.text.length) {
      this.props.openSnack('テキストが空です', {anchor: {vertical: 'bottom', horizontal: 'left'}})
      return
    }
    if (hasNGWords(values.text)) {
      this.props.openSnack('NGワードが含まれています', {anchor: {vertical: 'bottom', horizontal: 'left'}})
      return
    }

    submitData.files = (submitData.files || []).map(f => f.id)

    return this.props.createChat(submitData).then(() => {
      this.props.change('text', '')
      this.props.array.removeAll('files')
      this.props.onSubmit()
    })
  }

  render() {
    const { files, classes, handleSubmit, submitting, children } = this.props

    return (
      <div className={classes.root}>
        <form className={classes.form} onSubmit={handleSubmit(this.submitChat)}>
          <div className={classes.textField}>
            <Field
              name='text'
              component={ChatInput}
              placeholder='メッセージを入力'
            >
              <FileThumbnail files={files} onRemove={this.deleteFile}/>
            </Field>
          </div>
          <Button variant='contained'
            style={{marginLeft: 10, minWidth: 60}}
            type='submit'
            disabled={submitting}
            color='primary'
          >
            {submitting ? <CircularProgress size={20} color='secondary' /> : '送信'}
          </Button>
        </form>
        <div className={classes.icons}>
          <FileUploader
            endPoint={({type, fileType}) => `/api/chats/file/getSignedUrl?ext=${type.ext}&mime=${type.mime}&type=${fileType}`}
            acceptance={[fileMime.types.all]}
            multiple
            handleFile={this.handleFile}
          >
            <IconButton className={classes.actionIcon}>
              <EditorAttachFile />
            </IconButton>
          </FileUploader>
          {children}
        </div>
      </div>
    )
  }
}
