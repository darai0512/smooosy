import React from 'react'
import qs from 'qs'
import { connect } from 'react-redux'
import { login } from 'modules/auth'

@connect(
  null,
  { login }
)
export default class AutoLogin extends React.Component {
  componentDidMount() {
    const path = qs.parse(this.props.location.search.slice(1)).path || '/'
    this.props.login({token: this.props.match.params.token})
      .then(() => this.props.history.replace(path))
      .catch(() => this.props.history.replace('/login'))
  }

  render() {
    return null
  }
}
