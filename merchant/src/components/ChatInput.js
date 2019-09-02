import React from 'react'
import Textarea from 'react-textarea-autosize'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

@withWidth()
@withStyles(theme => ({
  root: {
    flex: 1,
    background: theme.palette.grey[200],
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: 5,
    height: '100%',
    padding: '4px 8px',
    '&:focus-within': {
      border: `1px solid ${theme.palette.blue.B200}`,
    },
  },
  textarea: {
    background: theme.palette.grey[200],
    fontSize: 14,
    border: 'none',
    width: '100%',
    lineHeight: '24px',
    outline: 'none',
    resize: 'none',
  },
}))
export default class ChatInput extends React.Component {
  static defaultProps = {
    autoFocus: false,
    setRef: () => {},
    onChange: () => {},
  }

  onChange = (e, value) => {
    this.props.input.onChange(e, value)
  }

  render() {
    const { style, setRef, input, meta, onChange, classes, children, ...custom } = this.props

    return (
      <div className={classes.root} style={style}>
        <Textarea ref={e => setRef(e)} className={classes.textarea} {...input} onChange={this.onChange} {...custom} />
        {children}
      </div>
    )
  }
}

