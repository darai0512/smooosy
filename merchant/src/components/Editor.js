import React from 'react'
import MediumEditor from 'medium-editor'
import MediumEditorTable from 'medium-editor-tables'
import 'medium-editor/dist/css/medium-editor.min.css'
import 'medium-editor/dist/css/themes/default.min.css'
import 'medium-editor-tables/dist/css/medium-editor-tables.min.css'
import { withStyles } from '@material-ui/core/styles'
import AlertWarning from '@material-ui/icons/Warning'

@withStyles(theme => ({
  textarea: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderRadius: 6,
    fontSize: 14,
    '&:focus': {
      borderColor: theme.palette.blue.B200,
    },
  },
  editor: {
    width: '100%',
    height: 'auto',
    minHeight: 100,
    background: theme.palette.common.white,
    borderRadius: 6,
    padding: 10,
    border: 0,
    outline: 'none',
  },
}), {withTheme: true})
export default class Editor extends React.Component {

  componentDidMount() {
    if (this.props.ready) this.setupEditor()
  }
  componentDidUpdate(prevProps) {
    if (!this.props.ready && prevProps.ready) this.setupEditor()

    if (this.props.input.value !== prevProps.input.value) {
      const content = this.editor.getContent()
      if (content !== this.props.input.value) {
        this.editor.setContent(this.props.input.value)
      }
    }
  }

  setupEditor() {
    if (this.editor) return
    this.editor = new MediumEditor(this.editorDOM, {
      toolbar: {
        buttons: this.props.toolbarButtons || [
          'h2', 'h3', 'italic', 'underline',
          'orderedlist', 'unorderedlist', 'table',
        ],
      },
      extensions: {
        table: new MediumEditorTable(),
      },
    })
    this.editor.subscribe('editableInput', (_, editable) => {
      this.props.input.onChange(editable.innerText.trim() ? editable.innerHTML : '')
    })
  }


  render() {
    const {label, requireLabel, style, editorStyle, inputRef, input, meta, classes, theme, ready, ...custom} = this.props
    const err = meta.touched && meta.error

    const { grey, red } = theme.palette

    const styles = {
      textarea: {
        ...(err ? {borderColor: red[500]} : null),
        ...editorStyle,
      },
    }

    return (
      <label style={style || {}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1, fontSize: 13, fontWeight: 'bold', color: err ? red[500] : grey[700]}}>{label}{requireLabel && <span style={{fontSize: 13, fontWeight: 'bold', color: red[500]}}>{requireLabel}</span>}
</div>
        </div>
        <div className={classes.textarea} style={styles.textarea}>
          <textarea ref={e => this.editorDOM = e} className={classes.editor} {...input} {...custom} />
        </div>
        <div style={{minHeight: 10, maxHeight: 22, fontSize: 12, color: red[500], padding: '0 5px'}}>
          {err && <p><AlertWarning style={{verticalAlign: 'bottom', width: 18, height: 18, color: red[500]}} />{err}</p>}
        </div>
      </label>
    )
  }
}
