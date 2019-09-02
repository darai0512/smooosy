import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Dialog, DialogContent, DialogTitle, DialogActions } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import { imageOrigin } from '@smooosy/config'

import { applyCampaign, loadCampaigns } from 'modules/point'

@connect(
  state => ({
    campaigns: state.point.campaigns,
    meets: state.meet.meets,
  }),
  { applyCampaign, loadCampaigns }
)
@withStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  contentImageWrap: {
    width: '100%',
    background: `url(${imageOrigin}/static/pros/dialog_background2.png) center center/cover no-repeat`,
    height: 300,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  highlight: {
    color: orange[500],
  },
  contentImage: {
    width: 200,
    height: 200,
  },
  linkButton: {
    margin: '0 10px 5px',
    height: 45,
  },
})
export default class FirstMeetDialog extends React.Component {
  state = {
    open: false,
    meetCampaign: null,
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate(prevProps) {
    const prevCanApply = this.canApply(prevProps.meets)
    const currentCanApply = this.canApply(this.props.meets)
    if (!prevCanApply && currentCanApply) {
      this.load()
    }
  }

  load = () => {
    this.props.loadCampaigns()
      .then(() => {
        const meetCampaign = this.props.campaigns.find(c => c.key === 'meet' && c.status === 'clear')
        if (!meetCampaign) return

        this.props.applyCampaign('meet')
          .then(() => this.setState({open: true, meetCampaign}))
      })
  }

  canApply(meets) {
    return meets && meets.length > 0
  }

  onClose = () => {
    this.props.onClose()
    this.setState({open: false, meetCampaign: null})
  }

  render() {
    const { classes } = this.props
    const { open, meetCampaign } = this.state

    if (!meetCampaign) return null

    return (
      <Dialog key='taskClearDialog' open={!!open} onClose={this.onClose}>
        <DialogTitle>
          {`${meetCampaign.clearMessage}（${meetCampaign.point}ptを獲得しました)`}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <div className={classes.contentImageWrap}>
            <img className={classes.contentImage} src={`${imageOrigin}/static/pros/good.png`} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button className={classes.linkButton} fullWidth component={Link} to='/account/tasks' variant='contained' color='primary'>タスクリストを確認する</Button>
        </DialogActions>
      </Dialog>
    )
  }
}
