import React from 'react'
import uuidv4 from 'uuid/v4'
import { withStyles } from '@material-ui/core'
import withStylesWithProps from 'components/withStylesWithProps'

class ReadMoreWithCSS extends React.PureComponent {
  constructor(props) {
    super(props)
    this.id = uuidv4()
  }

  render() {
    const { classes, backgroundColor, children } = this.props

    return (
      <div className={classes.root}>
        <input id={this.id} type='checkbox' />
        <label htmlFor={this.id} className={backgroundColor} />
        <div>{children}</div>
      </div>
    )
  }
}

export default withStyles(() => ({
  root: {
    position: 'relative',
    '& label': {
      height: 50,
      zIndex: 10,
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: 12,
      position: 'absolute',
      bottom: 0,
      width: '100%',
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.95) 90%)',
    },
    '& label.grey': {
      background: 'linear-gradient(to bottom, rgba(245, 245, 245, 0.7) 0%, rgba(245, 245, 245, 0.95) 90%)',
    },
    '& label:after': {
      content: '"もっと読む"',
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#000',
      width: '18.75rem',
      borderRadius: '20px',
    },
    '& input': {
      display: 'none',
    },
    '& input:checked': {
      '& + label': {
        background: 'inherit',
      },
      '& + label:after': {
        content: '"表示を減らす"',
      },
    },
  },
}))(withStylesWithProps((_, props) => ({
  root: {
    '& > div': {
      overflow: 'hidden',
      wordBreak: 'break-all',
      height: props.height,
    },
    '& input:checked ~ div': {
      minHeight: props.height,
      height: 'auto',
      paddingBottom: 80,
    },
  },
}))(ReadMoreWithCSS))