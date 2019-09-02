import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Dialog, DialogContent, DialogTitle, DialogActions } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { imageOrigin } from '@smooosy/config'

import { applyCampaign, loadCampaigns } from 'modules/point'

@connect(
  state => ({
    user: state.auth.user,
    campaigns: state.point.campaigns,
    meets: state.meet.meets,
    profiles: state.profile.profiles,
  }),
  { applyCampaign, loadCampaigns }
)
@withStyles(theme => ({
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
  contentImage: {
    width: 200,
    height: 200,
  },
  messageWrap: {
    padding: 10,
    borderRadius: 3,
    margin: '0 30px',
    [theme.breakpoints.down('xs')]: {
      margin: 0,
    },
  },
  messageLi: {
    fontSize: 14,
    width: '100%',
    display: 'flex',
  },
  messagePt: {
    marginLeft: 'auto',
    fontWeight: 'bold',
  },
  linkButton: {
    margin: '0 10px 5px',
    height: 45,
  },
}))
export default class TaskCompleteDialog extends React.Component {

  state = {
    open: false,
    clearCampaigns: [],
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate(prevProps) {
    const prevCampaigns = this.canApply(prevProps)
    const currentCampaigns = this.canApply(this.props)
    for (let key in currentCampaigns) {
      if (prevCampaigns[key] !== undefined && currentCampaigns[key] !== undefined && prevCampaigns[key] < currentCampaigns[key]) {
        return this.load()
      }
    }
  }

  load = () => {
    // this.props.loadCampaigns()
    //   .then(() => {
    //     const campaigns = this.props.campaigns
    //     const clearCampaigns = campaigns.filter(c => c.status === 'clear')
    //     let totalPoint = 0

    //     const messages = []
    //     const promises = []
    //     clearCampaigns.forEach(c => {
    //       messages.push(c.clearMessage)
    //       const clearLen = c.clear - c.applied
    //       totalPoint += c.point * clearLen
    //       // 付与可能なポイントを全て獲得する
    //       let p = this.props.applyCampaign(c.key)
    //       for (let i = 1; i < clearLen; i++) {
    //         p = p.then(() => this.props.applyCampaign(c.key))
    //       }
    //       promises.push(p)
    //     })
    //     // applyCampaignが一つ失敗するとダイアログが出ない
    //     Promise.all(promises).then(() => {
    //       this.setState({
    //         open: true,
    //         clearCampaigns,
    //         totalPoint,
    //       })
    //     })
    //   })
  }

  canApply(props) {
    const { meets, profiles, user } = props

    const campaigns = {}
    if (user) {
      campaigns.avatar = user.imageUpdatedAt ? 1 : 0
      campaigns.inboundLink = user.inboundLink ? 1 : 0
      campaigns.identification = !!user.identification && user.identification.status === 'valid' ? 1 : 0
      campaigns.line = user.lineId ? 1 : 0
    }
    if (profiles) {
      campaigns.description = profiles.filter(p => ((p.description ? p.description.length : 0) + (p.accomplishment ? p.accomplishment.length : 0) + (p.advantage ? p.advantage.length : 0)) >= 300).length > 0 ? 1 : 0
      campaigns.photo = profiles.filter(p => p.media.length >= 16).length > 0 ? 4 :
                        profiles.filter(p => p.media.length >= 8).length > 0 ? 3 :
                        profiles.filter(p => p.media.length >= 4).length > 0 ? 2 :
                        profiles.filter(p => p.media.length >= 1).length > 0 ? 1 : 0
    }
    if (meets && meets.length > 0) {
      campaigns.meet = meets.length > 0 ? 1 : 0
      campaigns.tenMeets = meets.filter(m => m.hiredAt).length >= 1 ? 1 : 0
      campaigns.twentyMeets = meets.filter(m => m.hiredAt).length >= 2 ? 1 : 0
    }

    return campaigns
  }

  onClose = () => {
    const { onClose } = this.props
    if (onClose && this.state.clearCampaigns.some(c => c.key === onClose.target)) {
      onClose.callback()
    }
    this.setState({open: false})
  }

  render() {
    const { classes } = this.props
    const { open, clearCampaigns, totalPoint } = this.state

    if (!clearCampaigns || clearCampaigns.length == 0) {
      return null
    }
    const dialogTitle = clearCampaigns.length === 1 ? `${clearCampaigns[0].clearMessage} ${totalPoint}ptを獲得しました` : `ポイント獲得です！(${totalPoint}pt)`
    return (
      <Dialog key='taskClearDialog' open={!!open} onClose={this.onClose}>
        <DialogTitle>
          {dialogTitle}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <div className={classes.contentImageWrap}>
            <img className={classes.contentImage} src={`${imageOrigin}/static/pros/good.png`} />
          </div>
          {clearCampaigns.length > 1 &&
            <div className={classes.messageWrap}>
              {clearCampaigns.map(c => (
                <li key={c._id} className={classes.messageLi}>・{c.clearMessage}<span className={classes.messagePt}>{`${c.point * (c.clear - c.applied)}pt`}</span></li>
              ))}
            </div>
          }
        </DialogContent>
        <DialogActions>
          <Button className={classes.linkButton} fullWidth component={Link} to='/account/tasks' variant='contained' color='primary'>タスクリストを確認する</Button>
        </DialogActions>
      </Dialog>
    )
  }
}
