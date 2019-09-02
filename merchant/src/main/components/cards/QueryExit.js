import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@material-ui/core'
import { amber } from '@material-ui/core/colors'
import AssignmentLate from '@material-ui/icons/AssignmentLate'
import { withStyles } from '@material-ui/core'

const QueryExit = ({progress, open, onClose, onExit, classes}) => (
  <Dialog
    open={!!open}
    onClose={onClose}
    classes={{paper: classes.paper}}
  >
    <DialogTitle className={classes.title}>
      {progress >= 50 && <p>{`依頼完了まで${progress}%回答済みです。`}</p>}
      本当に閉じますか？ここまでの回答が失われます。
    </DialogTitle>
    <DialogContent className={classes.content}>
      <div className={classes.contentInner}>
        <AssignmentLate className={classes.assignmentLate} />
        <div>
          入力頂いた内容をもとに、プロから見積もりが届きます。
        </div>
        <div>
          ご自身に合った見積もりがなければ、依頼後のキャンセルは可能です。
        </div>
      </div>
    </DialogContent>
    <DialogActions className={classes.actionRoot}>
      <div className={classes.actionInner}>
        <Button className={classes.exitButton} onClick={onExit}>依頼を中断する</Button>
        <Button color='primary' variant='contained' onClick={onClose}>依頼をつづける</Button>
      </div>
    </DialogActions>
  </Dialog>
)

export default withStyles(theme => ({
  paper: {
    width: 600,
    minWidth: 'auto',
    maxWidth: '90vw',
  },
  title: {
    textAlign: 'center',
    background: theme.palette.grey[100],
  },
  assignmentLate: {
    width: 125,
    height: 125,
    color: amber[500],
  },
  content: {
    padding: 0,
  },
  contentInner: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  actionRoot: {
    width: '100%',
    padding: 10,
    margin: 0,
  },
  actionInner: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  exitButton: {
    color: theme.palette.red[300],
  },
}))(QueryExit)