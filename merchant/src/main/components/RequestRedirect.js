import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

const RequestRedirect = ({user}) =>
  <Redirect to={{ pathname: user.pro ? '/pros' : '/requests' }} />

export default connect(
  state => ({
    user: state.auth.user,
  })
)(RequestRedirect)
