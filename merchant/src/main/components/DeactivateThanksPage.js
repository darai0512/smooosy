import React from 'react'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'

import { deactivate } from 'modules/auth'
import Loading from 'components/Loading'

@connect(
  null,
  { deactivate }
)
export default class DeactivateThanksPage extends React.Component {
  state = {}

  componentDidMount() {
    const state = this.props.location.state || {}
    if (state.from === 'deactivate') {
      this.props.deactivate().then(() => this.setState({done: true}))
    } else {
      this.props.history.replace('/')
    }
  }

  render() {
    if (!this.state.done) {
      return <Loading />
    }

    return (
      <div style={{margin: '0 auto', padding: '30px 0', width: '90%', maxWidth: 960, alignItems: 'center'}}>
        <div style={{fontSize: 18, fontWeight: 'bold'}}>
          退会処理が完了しました
        </div>
        <div style={{margin: '10px 0'}}>
          SMOOOSYのご利用ありがとうございました。またのご利用をお待ちしております。
        </div>
        <Button
          variant='contained'
          color='primary'
          style={{margin: '20px 0'}}
          onClick={() => this.props.history.push('/')}
        >
          SMOOOSYトップ
        </Button>
      </div>
    )
  }
}
