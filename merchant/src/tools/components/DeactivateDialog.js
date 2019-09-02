import React from 'react'
import { connect } from 'react-redux'
import { deactivate, update } from 'tools/modules/auth'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'

@connect(
  // propsに受け取るreducerのstate
  () => ({}),
  // propsに付与するactions
  { deactivate, update }
)
export default class DeactivateDialog extends React.Component {

  cancelDeactivate = () => {
    const user = {
      id: this.props.user.id,
      requestDeactivate: null,
      deactivateReason: null,
    }
    this.props.update(user).then(() => {
      this.props.onClose()
      this.props.onUpdate()
    })
  }

  deactivate = () => {
    this.props.deactivate(this.props.user.id)
      .then(() => {
        this.props.onClose()
        this.props.onUpdate()
      })
  }

  render () {
    const {open, user, onClose} = this.props

    return (
      <div>
        <Dialog open={!!open} onClose={() => onClose()}>
          <DialogTitle>{user.lastname}様を退会させますか？</DialogTitle>
          <DialogContent>
            <div>退会の理由：{user.deactivateReason}</div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => onClose()}>キャンセル</Button>
            <div style={{flex: 1}} />
            {user.requestDeactivate &&
              <Button variant='contained' color='primary' onClick={() => this.cancelDeactivate()}>退会申請を取り消す</Button>
            }
            <Button type='submit' variant='contained' color='secondary' onClick={() => this.deactivate()}>退会させる</Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}