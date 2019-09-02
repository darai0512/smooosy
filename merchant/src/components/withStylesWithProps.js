import React from 'react'
import { withStyles } from '@material-ui/core/styles'

function withStylesWithProps(func, option) {
  return function(WrapComponent) {
    return class extends WrapComponent {
      componentDidMount() {
        return
      }
      componentWillUnmount() {
        return
      }
      componentDidUpdate() {
        return
      }

      render() {
        const styles = theme => func(theme, this.props)
        const Inner = withStyles(styles, option)(WrapComponent)
        return <Inner {...this.props} />
      }
    }
  }
}

export default withStylesWithProps
