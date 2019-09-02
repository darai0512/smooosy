import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import AlertWarning from '@material-ui/icons/Warning'
import { orange, red } from '@material-ui/core/colors'

@withStyles(theme => ({
  input: {
    outline: 0,
    width: '100%',
    height: 40,
    padding: '0px 10px',
    fontSize: 16,
    appearance: 'none',
    display: 'inline-block',
    color: theme.palette.common.black,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderRadius: 4,
    verticalAlign: 'middle',
    '&:focus': {
      borderColor: theme.palette.blue.B200,
    },
  },
  errorBorder: {
    borderColor: red[500],
    '&:focus': {
      borderColor: red[500],
    },
  },
  warnBorder: {
    borderColor: orange[500],
    '&:focus': {
      borderColor: orange[500],
    },
  },
  disabled: {
    color: theme.palette.grey[500],
  },
  simple: {
    height: 30,
    background: 'transparent',
    borderWidth: '0 0 1px',
  },
  labelWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
  error: {
    color: red[500],
  },
  warning: {
    color: orange[800],
  },
  beforeLabel: {
    marginRight: 10,
  },
  afterLabel: {
    marginLeft: 2,
    marginRight: 10,
    whiteSpace: 'nowrap',
  },
  alert: {
    minHeight: 10,
    fontSize: 12,
    padding: '0 5px',
  },
  alertIcon: {
    verticalAlign: 'bottom',
    width: 18,
    height: 18,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
  },
  counter: {
    marginLeft: 'auto',
    fontSize: 13,
    width: 55,
    textAlign: 'end',
    color: theme.palette.grey[800],
  },
}))
export default class renderTextInput extends React.Component {
  static defaultProps = {
    type: 'text',
    rootClass: '',
    inputClass: '',
  }

  render() {
    const {type, label, labelClass, beforeLabel, afterLabel, style, autoFocus, input, meta, inputRef, inputStyle, disabled, hideError, simple, showCounter, rootClass, inputClass, classes, ...custom} = this.props
    const err = meta && meta.touched && meta.error
    const warn = meta && meta.warning

    const inputClasses = [classes.input, inputClass]
    if (disabled) inputClasses.push(classes.disabled)
    if (warn) inputClasses.push(classes.warnBorder)
    if (err) inputClasses.push(classes.error, classes.errorBorder)
    if (simple) inputClasses.push(classes.simple)

    return (
      <label style={style} className={rootClass}>
        <div className={classes.labelWrapper}>
          <div className={[classes.label, labelClass || '', err ? classes.error : ''].join(' ')}>{label}</div>
        </div>
        {beforeLabel && <span className={classes.beforeLabel}>{beforeLabel}</span>}
        <input type={type} ref={inputRef} autoFocus={autoFocus} disabled={disabled} {...input} {...custom} style={inputStyle} className={inputClasses.join(' ')} />
        {afterLabel && <span className={classes.afterLabel}>{afterLabel}</span>}
        {!hideError &&
          <div className={classes.alert}>
          {err ?
              <div className={classes.error}>
                <p><AlertWarning className={[classes.alertIcon, classes.error].join(' ')} />{err}</p>
              </div>
            : warn ?
              <div className={classes.warning}>
                <p><AlertWarning className={[classes.alertIcon, classes.warning].join(' ')} />{warn}</p>
              </div>
            : null
          }
          </div>
        }
        {showCounter &&
          <div className={classes.center}>
            <span className={classes.counter}>{input.value.length}文字</span>
          </div>
        }
      </label>
    )
  }
}
