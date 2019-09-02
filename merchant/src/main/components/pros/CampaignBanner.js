import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import {
  withStyles,
} from '@material-ui/core'
import { orange, indigo } from '@material-ui/core/colors'
import { loadAll } from 'modules/proService'

import { isMatchMoreCampaignService } from 'lib/instant'
import MatchMoreCampaignDialog from 'components/pros/MatchMoreCampaignDialog'

import { rolloutDates } from '@smooosy/config'

const CAR_CATEGORY = '車検・修理'

@connect(state => ({
  proServices: state.proService.proServices,
  user: state.auth.user,
  defaultCard: state.point.defaultCard,
}), { loadAll })
export default class CampaignBanner extends React.Component {

  componentDidMount() {
    if (!Object.keys(this.props.proServices).length) {
      this.props.loadAll()
    }
  }

  render() {
    const { proServices, request, onUpdateOnePtCampaign } = this.props
    const onepointCampaignServiceKeys = Object.keys(proServices).filter(id => isMatchMoreCampaignService(proServices[id].service))

    // 着付けには出さない、車のご指名サービスに出す
    if (request) {
      return request.category === CAR_CATEGORY && request.service.matchMoreEditable && onepointCampaignServiceKeys.length ?
        <MatchMoreCampaignBanner proServices={proServices} serviceKeys={onepointCampaignServiceKeys} onUpdateOnePtCampaign={onUpdateOnePtCampaign} />
        : null
    }

    return (
      <>
      {onepointCampaignServiceKeys.length ?
        <MatchMoreCampaignBanner proServices={proServices} serviceKeys={onepointCampaignServiceKeys} onUpdateOnePtCampaign={onUpdateOnePtCampaign} />
        : null
      }
      </>
    )
  }
}

@withStyles(theme => ({
  root: {
    padding: 20,
  },
  clickRoot: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
    padding: '10px 5px',
    background: indigo[500],
    color: theme.palette.common.white,
    justifyContent: 'space-around',
  },
  clickText: {
    fontSize: 20,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'flex-end',
    marginTop: -5,
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  clickDate: {
    marginRight: 10,
    fontSize: 18,
    wordBreak: 'keep-all',
    display: 'flex',
    alignItems: 'baseline',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  clickDetail: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  alignCenter: {
    textAlign: 'center',
  },
  delete: {
    marginRight: 5,
    position: 'relative',
    fontSize: 14,
    padding: '0 2px',
    color: theme.palette.grey[300],
    '&:after': {
      content: '""',
      width: '100%',
      position: 'absolute',
      left: 0,
      top: '50%',
      borderTop: `2px solid ${theme.palette.grey[300]}`,
    },
  },
}))
class MatchMoreCampaignBanner extends React.Component {

  state = {
    open: false,
  }

  onClose = () => this.setState({open: false})

  onOpen = () => this.setState({open: true})

  render() {
    const { classes, proServices, serviceKeys, onUpdateOnePtCampaign } = this.props
    const { open } = this.state

    return (
      <>
        <div onClick={this.onOpen} className={classes.clickRoot}>
          <div>
            <div className={classes.clickDate}>
              <span>6/20</span>
              <span style={{margin: '0 5px'}}>〜</span>
              <span style={{fontWeight: 'bold', fontSize: 24}}>{moment(rolloutDates.disableMatchMoreCampaign).format('M/D')}</span>
              <span className={classes.delete}>8/31</span>
              <span className={classes.delete}>7/31</span>
              <div style={{marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: orange[300]}}>ご好評につき更に延長！</div>
            </div>
            <div className={classes.clickText}>
              <div className={classes.alignCenter}>依頼どれでも<span style={{color: orange[300], fontSize: 22}}><span style={{fontSize: 40}}>1</span>pt</span></div>
              <div className={classes.alignCenter}>キャンペーン実施中！</div>
            </div>
          </div>
          <div className={classes.clickDetail}>詳しくはクリック</div>
        </div>
        <MatchMoreCampaignDialog open={open} onClose={this.onClose} proServices={proServices} serviceKeys={serviceKeys} onUpdateOnePtCampaign={onUpdateOnePtCampaign} />
      </>
    )
  }
}
