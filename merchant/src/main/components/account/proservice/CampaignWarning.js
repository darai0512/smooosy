import React, { useMemo } from 'react'
import { connect } from 'react-redux'

import WarningIcon from '@material-ui/icons/Warning'
import { orange } from '@material-ui/core/colors'

import { isMatchMoreCampaignService } from 'lib/instant'

const CampaignWarning = ({proServices}) => {
  const target = useMemo(() => Object.keys(proServices).some(id => isMatchMoreCampaignService(proServices[id].service)), [proServices])
  if (!target) return null

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16}}>
      <WarningIcon style={{color: orange[500]}} />
      設定を完了した自動車カテゴリの対象サービスのみが「依頼どれでも1ptキャンペーン」の対象になります
    </div>
  )
}

export default connect(state => ({
  proServices: state.proService.proServices,
}))(CampaignWarning)