import React from 'react'
import { connect } from 'react-redux'
import { login } from 'modules/auth'

@connect(
  null,
  { login }
)
export default class CheckToken extends React.Component {
  componentDidMount() {
    this.props.login({token: this.props.match.params.token})
      .then(() => this.props.history.push('/account/password'))
      .catch(() => this.props.history.push('/login'))
  }

  render() {
    return null
  }
}
