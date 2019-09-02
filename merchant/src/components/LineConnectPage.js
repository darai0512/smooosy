import React from 'react'
import { connect } from 'react-redux'
import LineLogin from 'components/LineLogin'
import storage from 'lib/storage'
import { update as updateUser } from 'modules/auth'

@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateUser }
)
export default class LineConnectPage extends React.Component {

  onLineLogin = (values) => {
    const {lineCode, page} = values
    return this.props.updateUser({lineCode, page})
      .then(this.nextPage)
  }

  onLineClick = () => {
    // LINEログインは一度SMOOOSY外に行くのでlocalStorageにfromを保存
    const { from } = this.props.location.state || {}
    storage.save('loginFrom', from)
  }

  nextPage = () => {
    let { from } = this.props.location.state || {}
    // react-routerのlocation.state > localStorage(LINE用) > デフォルトURL
    from = from || storage.get('loginFrom') || (this.props.user.pro ? '/pros/requests' : '/requests')
    storage.remove('loginFrom')
    this.props.history.replace(from)
  }

  render () {
    const { user } = this.props

    if (user.lineId) {
      this.nextPage()
      return null
    }

    return (
      <LineLogin style={{visibility: 'hidden'}} needClick onLogin={this.onLineLogin} page='/lineConnect' onClick={this.onLineClick} />
    )
  }
}
