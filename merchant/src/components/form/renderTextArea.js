import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import ErrorIcon from '@material-ui/icons/Warning'
import WarningIcon from '@material-ui/icons/Info'
import ProgressBar from 'components/ProgressBar'

@withStyles(theme => ({
  textarea: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderRadius: 6,
    outline: 0,
    padding: 10,
    fontSize: 14,
    resize: 'vertical',
    '&:focus': {
      borderColor: theme.palette.blue.B200,
    },
  },
}), {withTheme: true})
export default class renderTextArea extends React.Component {

  static defaultProps = {
    textareaStyle: {},
  }

  render() {
    const { label, requireLabel, style, labelStyle, textareaStyle, autoFocus, input, meta, theme, classes, showProgress, showCounter, targetCount = 100, errorOnOverflow, inputRef, ...custom } = this.props
    const err = meta && meta.touched && meta.error
    const warn = meta && meta.touched && meta.warning

    const { grey, red } = theme.palette

    const styles = {
      textarea: {
        ...(err ? { borderColor: red[500] } : null),
        ...textareaStyle,
      },
    }

    return (
      <label style={labelStyle || {}}>
        <div style={style || {}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={{flex: 1, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 'bold', color: err ? red[500] : grey[700]}}>
              {label}{requireLabel && <span style={{fontSize: 13, fontWeight: 'bold', color: red[500]}}>{requireLabel}</span>}
            </div>
          </div>
          <textarea autoFocus={autoFocus} ref={inputRef} {...input} {...custom} style={styles.textarea} className={classes.textarea} />
          <div style={{minHeight: 10, maxHeight: 22, fontSize: 12, color: red[500], padding: '0 5px'}}>
            {err && <p><ErrorIcon style={{verticalAlign: 'bottom', width: 18, height: 18, color: red[500]}} />{err}</p>}
            {warn && <p><WarningIcon style={{verticalAlign: 'bottom', width: 18, height: 18, color: orange[500]}} />{warn}</p>}
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            {showProgress && <ProgressBar style={{flex: 1, alignItems: 'center'}} value={input.value.length / targetCount} errorOnOverflow={errorOnOverflow} />}
            {showCounter && <span style={{marginLeft: 'auto', fontSize: 13, width: 55, textAlign: 'end'}}>{input.value.length}文字</span>}
          </div>
        </div>
      </label>
    )
  }
}
