import React from 'react'
import { CircularProgress } from '@material-ui/core'

import ConfirmDialog from 'components/ConfirmDialog'
import Notice from 'components/Notice'
import ConveniInfo from 'components/ConveniInfo'
import InquiryLink from 'components/InquiryLink'

const NetbankRedirectDialog = ({status, conveniInfo, onSubmit}) => {
  // ペイジーはconveniInfoが来るまで処理中表示
  const st = status === 'payeasy' && !conveniInfo ? 'progress' : status

  const title = {
    paid: '購入が完了しました',
    payeasy: 'ATM・ネットバンキングでお支払いください',
    cancel: '購入をキャンセルしました',
    error: '購入に失敗しました',
    progress: '処理中です・・・',
  }[st] || ''

  return (
    <ConfirmDialog
      alert
      open={!!st}
      title={title}
      disabled={st === 'progress'}
      onSubmit={onSubmit}
    >
      {st === 'progress' ?
        <div style={{margin: 20, textAlign: 'center'}}><CircularProgress /></div>
      : st === 'payeasy' ?
        <div>
          <Notice type='info'>
            注意: 支払いから1-4時間程度でポイントが付与されます
          </Notice>
          <ConveniInfo conveni={conveniInfo} />
          <p>※この情報はポイントページでも確認できます。</p>
        </div>
      : st === 'error' ?
        <div>
          決済システムのエラーです。ポイントが付与されない場合は
          <InquiryLink />ください。
        </div>
      : null}
    </ConfirmDialog>
  )
}

export default NetbankRedirectDialog
