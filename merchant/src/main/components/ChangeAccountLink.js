import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'

import { logout } from 'modules/auth'

const ChangeAccountLink = props => {
  const { logout, history, location, children } = props

  const onClick = () => {
    logout().then(() => history.push('/login', { from: location }))
  }

  return <a onClick={onClick}>{children}</a>
}

export default connect(
  () => ({}),
  { logout }
)(withRouter(ChangeAccountLink))
