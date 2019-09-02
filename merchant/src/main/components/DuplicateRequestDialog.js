import React from 'react'
import { withStyles } from '@material-ui/core'
import { withApiClient } from 'contexts/apiClient'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import CachedIcon from '@material-ui/icons/Cached'

@withApiClient
@withStyles((theme) => ({
  paper: {
    maxWidth: 600,
  },
  container: {
    textAlign: 'center',
    padding: 20,
  },
  cachedIcon: {
    width: 80,
    height: 80,
    color: theme.palette.secondary.main,
  },
  text: {
    margin: 10,
  },
  updateButton: {
    width: 180,
    height: 45,
    marginTop: 10,
  },
  recreateButton: {
    width: 180,
    height: 45,
    marginTop: 10,
  },
}))
export default class DuplicateRequestDialog extends React.Component {

  overwrite = () => {
    const { request } = this.props
    this.props.apiClient.put(`/api/requests/${request._id}/overwrite`)
    this.props.onClose()
  }

  render () {
    const { open, onClose, classes } = this.props

    return (
      <Dialog
        open={!!open}
        classes={{paper: classes.paper}}
        onClose={onClose}
      >
        <div className={classes.container}>
          <CachedIcon className={classes.cachedIcon} />
          <h3>すでに似た依頼を作成済みです</h3>
          <div className={classes.text}>今回入力した情報で前回の依頼を上書きし、新たに見積もりを受け取りたい場合は「更新する」ボタンを押してください。</div>
          <div className={classes.text}>※ 上書きすると前回の依頼に応募したプロとは連絡できなくなります</div>
          <Button variant='contained' color='primary' className={classes.updateButton} onClick={this.overwrite}>更新する</Button>
          <Button className={classes.recreateButton} onClick={onClose}>別に依頼する</Button>
        </div>
      </Dialog>
    )
  }
}