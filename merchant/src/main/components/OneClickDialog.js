import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { DialogContent, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { createByUser } from 'modules/meet'
import { matchByUser } from 'modules/request'
import ResponsiveDialog from 'components/ResponsiveDialog'
import RequestInfo from 'components/RequestInfo'

@withStyles((theme) => ({
  oneClickDialog: {
    maxWidth: 600,
    height: 600,
    [theme.breakpoints.down('xs')]: {
      maxWidth: 'none',
      height: '100%',
    },
  },
  oneClickContent: {
    padding: '0 24px',
  },
  oneClickTitle: {
    padding: '16px 24px',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  oneClickButtons: {
    padding: '16px 24px',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  oneClickButton: {
    height: 50,
    width: '100%',
    fontSize: 16,
  },
}))
@connect(
  state => ({
    user: state.auth.user,
  }),
  { createByUser, matchByUser }
)
@withRouter
export default class OneClickDialog extends React.Component {

  addNewProToRequest = () => {
    const { proService, request, onSubmit } = this.props
    const promise = proService.isMatchMore
      ? this.props.createByUser(request._id, [proService.profile._id])
      : this.props.matchByUser(request._id, {profile: proService.profile._id})

    promise.then(() => {
      onSubmit && onSubmit()
    })
  }

  render () {
    const { proService, request, service, user, onClose, classes } = this.props
    return (
      <ResponsiveDialog
        open={!!proService}
        onClose={onClose}
        muiClasses={{paper: classes.oneClickDialog}}
      >
        <DialogContent className={classes.oneClickContent}>
          <div className={classes.oneClickTitle}>
            依頼内容の確認
          </div>
          {request &&
            <RequestInfo hideHeader request={{...request, service}} customer={user} />
          }
        </DialogContent>
        <div className={classes.oneClickButtons}>
          <Button className={classes.oneClickButton} variant='contained' color='primary' onClick={this.addNewProToRequest}>
            この内容でプロに連絡する
          </Button>
        </div>
      </ResponsiveDialog>
    )
  }
}
