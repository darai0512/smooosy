import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Button } from '@material-ui/core'

const defaultHeight = 280
@withStyles(() => ({
  root: {
    position: 'relative',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  fixedHeight: {
    minHeight: defaultHeight - 1,
    maxHeight: defaultHeight + 1,
  },
  more: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    boxShadow: 'inset 0px -50px 50px #fff',
    paddingTop: 14,
  },
  button: {
    width: '100%',
  },
}))
export default class TruncateContent extends React.Component {
  static defaultProps = {
    height: defaultHeight,
  }

  constructor(props) {
    super(props)
    this.state = {
      truncated: undefined,
      height: props.fixedHeight && props.height || 'auto',
    }
  }

  componentDidMount() {
    const { height, fixedHeight } = this.props
    this.setState({
      truncated: this.$root.offsetHeight > height,
      height: fixedHeight || this.$root.offsetHeight > height ? height : 'auto',
    })
  }

  showAll = () => {
    this.setState({
      truncated: false,
      height: 'auto',
    })
  }

  style(key) {
    const { customClasses = {}, classes } = this.props
    return customClasses[key] || classes[key]
  }

  render() {
    const { fixedHeight, color, children } = this.props
    const { truncated, height } = this.state

    const styles = {
      root: truncated !== undefined ? {
        height,
        minHeight: fixedHeight ? (this.props.height || defaultHeight) - 1 : 'initial',
        maxHeight: 'initial',
      } : {},
      more: color ? {
        boxShadow: `inset 0px -50px 50px ${color}`,
      } : {},
    }

    const rootClasses = [ this.style('root') ]
    if (fixedHeight) rootClasses.push(this.style('fixedHeight'))

    return (
      <div ref={e => this.$root = e} className={rootClasses.join(' ')} style={styles.root}>
        {children}
        {truncated &&
          <div className={this.style('more')} style={styles.more}><Button className={this.style('button')} onClick={this.showAll}>すべて表示</Button></div>
        }
      </div>
    )
  }
}
