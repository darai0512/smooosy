import React from 'react'
import { Button } from '@material-ui/core'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'

export default class ConfirmDialog extends React.Component {
  static defaultProps = {
    open: false,
    title: '',
    label: 'OK',
    cancelLabel: 'キャンセル',
    alert: false,
    disabled: false,
    onSubmit: () => {},
    onClose: () => {},
    children: null,
    style: {},
  }

  handleAction = (e, callback) => {
    e.preventDefault()
    callback && callback()
  }

  render() {
    const { open, title, alert, disabled, onClose, onSubmit, label, cancelLabel, children, forceSubmit, style, ...custom } = this.props

    let actions = [
      alert ? null : <Button key='cancel' style={{minWidth: 120}} onClick={e => this.handleAction(e, onClose)}>{cancelLabel}</Button>,
      <Button key='submit' variant='contained' color='primary' disabled={disabled} style={{minWidth: 120}} onClick={e => this.handleAction(e, onSubmit)}>{label}</Button>,
    ]

    if (forceSubmit) {
      actions = actions.slice(1)
    }

    return (
      <Dialog
        open={!!open}
        style={style}
        onClose={onClose}
        {...custom}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    )
  }
}
