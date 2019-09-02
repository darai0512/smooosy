import React from 'react'
import { IconButton } from '@material-ui/core'
import { Dialog, DialogTitle, withMobileDialog } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import Close from '@material-ui/icons/Close'


const DialogHeader = withStyles({
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
})(({classes, title, onClose, className}) => (
  <DialogTitle className={className}>
    {title}
    <IconButton className={classes.closeButton} onClick={onClose}>
      <Close />
    </IconButton>
  </DialogTitle>
))

const ResponsiveDialog = ({ fullScreen, classes, muiClasses, className, titleClassName, title, open, closeButton, onOpen, onOpened, onClose, children, hideHeader, ...custom }) => (
  <Dialog
    fullScreen={fullScreen}
    classes={muiClasses}
    className={className}
    open={open}
    onEnter={onOpen}
    onEntered={onOpened}
    onClose={onClose}
    {...custom}
  >
    {!hideHeader && <DialogHeader title={title} className={titleClassName} onClose={onClose} />}
    {children}
  </Dialog>
)


const noop = () => {}

ResponsiveDialog.defaultProps = {
  muiClasses: {},
  closeButton: true,
  title: null,
  content: null,
  actions: null,
  onOpen: noop,
  onOpened: noop,
  onClose: noop,
  hideHeader: false,
}

export default withMobileDialog({breakpoint: 'xs'})(ResponsiveDialog)
