import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core'

@withStyles(theme => ({
  root: {
    lineHeight: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  text: {
    maxHeight: '6em',
  },
  textOpen: {
    maxHeight: 'none',
    paddingBottom: '1.5em',
  },
  readmore: {
    width: '100%',
    textAlign: 'right',
    position: 'absolute',
    top: '6em',
  },
  readmoreOpen: {
    top: 0,
    position: 'relative',
  },
  toggle: {
    background: theme.palette.common.white,
    boxShadow: `-20px 0px 20px 0px ${theme.palette.common.white}`,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    outline: 'none',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
}))
class ReadMore extends React.Component {
  state = {
    open: false,
  }

  toggle = (e) => {
    e.stopPropagation()
    this.setState({open: !this.state.open})
  }

  render() {
    const { className, children, classes, toggleClass, toggleStyle } = this.props
    const { open } = this.state

    const rootClasses = [classes.root]
    const textClasses = [classes.text]
    const readMoreClasses = [classes.readmore]
    if (open) {
      rootClasses.push(classes.rootOpen)
      textClasses.push(classes.textOpen)
      readMoreClasses.push(classes.readmoreOpen)
    }
    if (className) {
      textClasses.push(className)
    }

    return (
      <div className={rootClasses.join(' ')}>
        <p className={textClasses.join(' ')}>{children}</p>
        <p className={readMoreClasses.join(' ')}>
          <span className={[classes.toggle, toggleClass].join(' ')} style={toggleStyle} onClick={this.toggle}>
            {open ? '表示を減らす' : 'もっと読む'}
          </span>
        </p>
      </div>
    )
  }
}

const Wrap = connect(
  state => ({
    Component: state.amp ? state.amp.ReadMore : null,
  })
)(({Component, ...rest}) => {
  return Component ? <Component {...rest} /> : <ReadMore {...rest} />
})

export default Wrap
