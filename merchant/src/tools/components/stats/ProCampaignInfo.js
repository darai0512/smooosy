import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Table, TableBody, Button } from '@material-ui/core'

import { refundStarterPoint } from 'tools/modules/point'
import CustomRow from 'components/CustomRow'
import ConfirmDialog from 'components/ConfirmDialog'

import { starterPack } from '@smooosy/config'

@connect(
  state => ({
    admin: state.auth.admin,
  }),
  { refundStarterPoint }
)
export default class ProCampaignInfo extends React.Component {
  state = {
    pointModal: false,
  }

  addPoint = () => {
    this.props.refundStarterPoint(this.props.pro.id)
    .then(() => {
      this.setState({pointModal: false})
    }).catch(e => {
      window.alert(e.message)
    })
  }

  render() {
    const { pro, profile, point, admin } = this.props

    const isStarterCampaign = point && point.pointBought && typeof point.pointBought.starterPoint === 'number'
    if (!isStarterCampaign) return <div>なし</div>

    const starterCampaignPoint = starterPack.totalPoints[profile.signupCategory.key] || starterPack.totalPoints.default
    const starterCampaignPointBackDays = starterPack.pointBackDays[profile.signupCategory.key] || starterPack.pointBackDays.default
    const starterCampaignRefundDate = moment(point.pointBought.starterPointRunOutAt).add(starterCampaignPointBackDays, 'day')
    const enableStarterCampignRefund = !point.pointBought.starterPointRefunded && point.pointBought.starterPointRunOutAt && moment().isAfter(starterCampaignRefundDate)

    return (
      <Table>
        <TableBody>
          <CustomRow title='まずは10回'>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
              <div style={{marginRight: 10}}>
                <p>登録時のカテゴリ: {profile.signupCategory.name}</p>
                <p>残りポイント: {point.pointBought.starterPoint} / {starterCampaignPoint} pt</p>
                {point.pointBought.starterPointRunOutAt && <div><span>ポイント0日: </span><span>{moment(point.pointBought.starterPointRunOutAt).format('YYYY/MM/DD')}</span>{point.pointBought.starterPointRefunded && <span>（返還済み）</span>}</div>}
                {point.pointBought.starterPointRunOutAt && <div><span>返還可能日: </span><span>{moment(starterCampaignRefundDate).format('YYYY/MM/DD')}以降</span></div>}
              </div>
              {admin > 9 && enableStarterCampignRefund &&
                <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({pointModal: true})}>ポイント返還</Button>
              }
            </div>
          </CustomRow>
        </TableBody>
        <ConfirmDialog
          title={`「${pro.lastname}${pro.firstname ? ` ${pro.firstname}` : ''}」に${starterCampaignPoint}ポイントを返還します。よろしいですか？`}
          open={!!this.state.pointModal}
          onSubmit={this.addPoint}
          onClose={() => this.setState({pointModal: false})}
         />
      </Table>
    )
  }
}
