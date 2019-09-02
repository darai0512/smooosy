import React from 'react'
import { withStyles } from '@material-ui/core'
import Avatar from '@material-ui/core/Avatar'
import ConfirmDialog from 'components/ConfirmDialog'

let HireDialog = ({title, open, image, onSubmit, onClose, classes}) => (
  <ConfirmDialog
    title={title}
    open={open}
    onSubmit={onSubmit}
    onClose={onClose}
  >
    <div className={classes.root}>
      <Avatar className={classes.avatar} src={image} />
      <div className={classes.text}>決定することでプロが安心します。</div>
      <div className={classes.comment}>（※決定時の料金はかかりません）</div>
    </div>
  </ConfirmDialog>
)

HireDialog = withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  text: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  comment: {
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
}))(HireDialog)

export default HireDialog