import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent, DialogTitle, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import { open as openSnack } from 'modules/snack'
import ProBadge from 'components/ProBadge'

export default connect(() => ({}), { openSnack })(props => {
  const { open, profile, onClose } = props
  const styles = {
    closeButton: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
  }
  return (
    <Dialog key='probadge' open={!!open} onClose={onClose}>
      <DialogTitle>
        SMOOOSYのプロバッジを設置する
        <IconButton style={styles.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <ProBadge
          profile={profile}
          onCopy={() => props.openSnack('コピーしました', {anchor: {vertical: 'bottom', horizontal: 'left'}})}
        />
      </DialogContent>
    </Dialog>
  )
})
