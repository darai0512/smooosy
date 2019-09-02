import React from 'react'
import { Link } from 'react-router-dom'

export default class LessRenderLink extends React.PureComponent {
  render() {
    return <Link {...this.props} />
  }
}