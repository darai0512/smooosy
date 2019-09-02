import React from 'react'
import { connect } from 'react-redux'
import { logout } from 'modules/auth'


@connect(
  () => ({}),
  { logout }
)
export default class LogoutPage extends React.Component {
  componentDidMount() {
    this.props.logout().then(() => this.props.history.push('/'))
  }

  render() {
    return null
  }
}
