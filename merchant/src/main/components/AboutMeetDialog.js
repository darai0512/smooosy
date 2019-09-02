import React from 'react'
import { withStyles } from '@material-ui/core'
import Dialog from '@material-ui/core/Dialog'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Button from '@material-ui/core/Button'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ActionAssignment from '@material-ui/icons/Assignment'
import ActionSchedule from '@material-ui/icons/Schedule'


let AboutMeetDialog = ({ request = {}, open, onClose, classes }) => (
  <Dialog
    open={!!open}
    classes={{paper: classes.bluePaper}}
    onClose={onClose}
  >
    <CheckCircleIcon className={classes.checkIcon} />
    <h3 className={classes.header}>最適なプロをお探し中です</h3>
    <div className={classes.message}>
      <b>プロからの見積もりが4日後までにメールやLINEに届きます。</b>
      <p>見逃さないようにしましょう！</p>
    </div>
    <List className={classes.list}>
      <ListItem>
        <ListItemIcon>
          <ActionAssignment className={classes.icon} />
        </ListItemIcon>
        <ListItemText disableTypography primary={'想定見積もり数：' + (request.estimatedMeetCount ? `${request.estimatedMeetCount.from}〜${request.estimatedMeetCount.to}` : '1〜3') + '件（最大5件まで）'} />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <ActionSchedule className={classes.icon} />
        </ListItemIcon>
        <ListItemText disableTypography primary={'平均的な待ち時間：' + (request.timeToFirstMeet ? `${request.timeToFirstMeet.from}〜${request.timeToFirstMeet.to}` : '1〜5時間')} />
      </ListItem>
    </List>
    <Button fullWidth variant='contained' className={classes.closeButton} onClick={onClose}>閉じる</Button>
  </Dialog>
)

AboutMeetDialog = withStyles((theme) => ({
  bluePaper: {
    color: theme.palette.common.white,
    background: theme.palette.primary.main,
    textAlign: 'center',
    maxWidth: 600,
    padding: 20,
  },
  header: {
    fontSize: 26,
    [theme.breakpoints.down('xs')]: {
      fontSize: 20,
    },
  },
  message: {
    margin: 10,
    fontSize: 18,
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
    },
  },
  checkIcon: {
    diplay: 'block',
    margin: '0 auto',
    width: 80,
    height: 80,
    color: theme.palette.common.white,
  },
  icon: {
    color: theme.palette.common.white,
  },
  list: {
    border: `1px solid ${theme.palette.common.white}`,
    borderRadius: 4,
  },
  closeButton: {
    height: 45,
    marginTop: 20,
    color: theme.palette.primary.main,
    background: theme.palette.common.white,
  },
}))(AboutMeetDialog)

export default AboutMeetDialog