import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { AmpState } from 'react-amphtml'
import { Bind as AmpBind, Action as AmpAction } from 'react-amphtml/helpers'

const fontSize = 14
const lineHeight = 1.5

@withStyles(theme => ({
  root: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: fontSize * lineHeight,
  },
  truncated: {
    lineHeight,
    fontSize,
    maxHeight: fontSize * lineHeight * 4,
    overflow: 'hidden',
    whiteSpace: 'pre-line',
  },
  expanded: {
    lineHeight,
    fontSize,
    overflow: 'hidden',
    whiteSpace: 'pre-line',
  },
  readMoreButtonShow: {
    position: 'absolute',
    top: fontSize * lineHeight * 4,
    right: 0,
    border: 'none',
    color: theme.palette.blue.A200,
    outline: 'none',
  },
  readMoreButtonHide: {
    float: 'right',
    display: 'none',
  },
}))
export default class AmpReadMore extends React.Component {
  constructor (props) {
    super(props)
  }

  style(key) {
    const { customClasses = {}, classes } = this.props
    return customClasses[key] || classes[key]
  }

  render () {
    const { children, name, defaultExpanded } = this.props

    const readMoreTextDefaultClass = defaultExpanded ? this.style('expanded') : this.style('truncated')
    const readMoreTextClass = {
      '[class]': `ampReadMore_${name}.readMore_${name} == 'expanded_${name}' ? '${this.style('expanded')}' : '${this.style('truncated')}'`,
    }
    const readMoreButtonDefaultClass = defaultExpanded ? this.style('readMoreButtonHide') : this.style('readMoreButtonShow')
    const readMoreButtonClass = {
      '[class]': `ampReadMore_${name}.readMore_${name} == 'expanded_${name}' ? '${this.style('readMoreButtonHide')}' : '${this.style('readMoreButtonShow')}'`,
    }

    const ampState = {}
    ampState[`readMore_${name}`] = 'truncated'

    return (
      <div className={this.style('root')}>
        <AmpState id={`ampReadMore_${name}`} specName='amp-state'>
          {ampState}
        </AmpState>
        <AmpBind {...readMoreTextClass}>
          {props => <div className={readMoreTextDefaultClass} {...props}>{children}</div>}
        </AmpBind>
        <AmpBind {...readMoreButtonClass}>
          {props =>
            <AmpAction
              events={{
                tap: [`AMP.setState({ampReadMore_${name}: { readMore_${name}: "expanded_${name}" }})`],
              }}
              {...props}
            >
              {props => <a className={readMoreButtonDefaultClass} {...props}>もっと読む</a>}
            </AmpAction>
          }
        </AmpBind>
      </div>
    )
  }
}