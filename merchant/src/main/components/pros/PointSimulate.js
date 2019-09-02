import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import CustomChip from 'components/CustomChip'
import { orange, indigo } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/core/styles'

import MatchMoreCampaignDialog from 'components/pros/MatchMoreCampaignDialog'

import { loadAll as loadAllProServices } from 'modules/proService'
import { isMatchMoreCampaignService } from 'lib/instant'

const CAR_CATEGORY = '車検・修理'

@connect(
  state => ({
    user: state.auth.user,
    proServices: state.proService.proServices,
  }),
  { loadAllProServices }
)
export default class PointSimulate extends React.Component {

  componentDidMount() {
    if (!Object.keys(this.props.proServices).length) {
      this.props.loadAllProServices()
    }
  }

  render () {
    const { user, request, proServices } = this.props
    const isMatchMoreCampaign = request.category === CAR_CATEGORY && request.service.matchMoreEditable

    return (
      <>
        <p style={{fontSize: 13}}>利用ポイント</p>
        {request.basePoint === 0 ?
          <div style={{fontSize: 16}}>
            <p>{request.basePoint} pt</p>
          </div>
          // クレカキャンペーン終了後の新規プロ（車より後）
        : request.isNewbie && !user.hasActiveCard ?
          <div style={{fontSize: 18}}>
            <p>{request.basePoint} pt</p>
            <p style={{fontSize: 18, fontWeight: 'bold', color: orange[500]}}>→0 pt</p>
          </div>
          // 割引
         : request.basePoint && request.basePoint !== request.point ?
          <div style={{fontSize: 16}}>
            <p style={{textDecoration: 'line-through'}}>{request.basePoint || 0} pt</p>
            <p><span style={{fontSize: 22}}>{request.point || 0}</span> pt</p>
          </div>
         :
          <p style={{fontSize: 16}}>
            <span style={{fontSize: 22}}>{request.point || 0}</span> pt
          </p>
        }
        {request.discountReason ? <CustomChip label={request.discountReason} />
        : request.isMatchMoreCampaignTarget && request.point === 1 ?
          <div style={{border: `2px solid ${indigo[500]}`, color: indigo[500], width: 100, padding: '5px 0', fontWeight: 'bold', fontSize: 12, borderRadius: 4, margin: 'auto', marginTop: 5}}>
            <div>1pt</div><div>キャンペーン</div>
          </div>
        : isMatchMoreCampaign ?
          <OnePtDetailButton proServices={proServices} onUpdateOnePtCampaign={this.props.onUpdateOnePtCampaign} />
        : request.isNewbie && !user.hasActiveCard ?
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <CustomChip style={{background: '#fdf2d0', height: 'auto'}} label={<div style={{lineHeight: 1.5}}><div>クレカ設定で</div><div>初応募が無料！</div></div>} />
          </div>
        : request.point === 0 ? <CustomChip label='無料' />
        : request.basePoint && request.basePoint !== request.point && <CustomChip label='割引' />}
      </>
    )
  }
}


const OnePtDetailButton = withStyles(() => ({
  button: {
    border: `2px solid ${indigo[500]}`,
    color: indigo[500],
    width: 100,
    padding: '5px 0',
    fontWeight: 'bold',
    fontSize: 12,
    borderRadius: 4,
    margin: 'auto',
    marginTop: 5,
    cursor: 'pointer',
  },
  detail: {
    fontSize: 10,
  },
  one: {
    color: orange[500],
    fontSize: 16,
  },
  pt: {
    color: orange[500],
  },
}))(({proServices, classes, onUpdateOnePtCampaign}) => {
  const [open, setOpen] = React.useState(false)
  const reload = useCallback(() => {
    setOpen(false)
    onUpdateOnePtCampaign()
  }, [onUpdateOnePtCampaign])

  const serviceKeys = Object.keys(proServices).filter(id => isMatchMoreCampaignService(proServices[id].service))

  return (
    <>
      <div className={classes.button} onClick={() => setOpen(true)}>
        <div>ご指名設定で</div>
        <div>今だけ<span className={classes.one}>1</span><span className={classes.pt}>pt</span>に！</div>
        <div className={classes.detail}>詳しくはクリック</div>
      </div>
      <MatchMoreCampaignDialog open={open} onClose={reload} proServices={proServices} serviceKeys={serviceKeys}  />
    </>
  )
})