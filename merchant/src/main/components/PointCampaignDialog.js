import React from 'react'
import { IconButton, Dialog } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import NavigationClose from '@material-ui/icons/Close'
import { showIntercom, hideIntercom } from 'lib/intercom'

import PointCampaign from 'components/PointCampaign'

@withStyles(theme => ({
  wrap: {
    padding: 20,
    fontSize: 22,
    fontWeight: 'bold',
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  title: {
    color: orange[500],
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 12,
    fontweight: 'normal',
    color: theme.palette.grey[500],
  },
  closeIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
}))
export default class PointCampaignDialog extends React.Component {

  onClose = () => {
    const { onClose } = this.props
    showIntercom()
    onClose()
  }

  render() {
    const { classes, open } = this.props

    return (
      <Dialog
        open={!!open}
        onEnter={hideIntercom}
        onClose={this.onClose}
        >
        <div>
          <div className={classes.wrap}>
            <p><span>無料でポイントを獲得</span><span className={classes.title}>（期間限定！）</span></p>
            <p className={classes.notes}>※本キャンペーンは予告なく変更・終了することがあります。</p>
            <IconButton className={classes.closeIcon} onClick={this.onClose}><NavigationClose /></IconButton>
          </div>
          <PointCampaign />
        </div>
      </Dialog>
    )
  }
}
