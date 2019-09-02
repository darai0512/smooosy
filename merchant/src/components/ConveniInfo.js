import React from 'react'
import moment from 'moment'
import { Table, TableBody } from '@material-ui/core'
import { red } from '@material-ui/core/colors'

import CustomRow from 'components/CustomRow'
import { shortDateString } from 'lib/date'
import { payment } from '@smooosy/config'

const ConveniInfo = props => {
  const { conveni } = props

  if (!conveni) return null

  const payeasyInfo = payment.netbankTypes.payeasy
  const conveniType = {
    ...payment.conveniTypes,
    [payeasyInfo.code]: payeasyInfo,
  }[conveni.conveni_code]

  const isPayeasy = conveni.conveni_code === payeasyInfo.code

  return (
    <div>
      <Table>
        <TableBody>
          <CustomRow title='店舗'>
            {conveniType.name}
          </CustomRow>
          <CustomRow title='金額'>
            {conveni.item_price.toLocaleString()}円
          </CustomRow>
          {!!conveni.kigyou_code &&
            <CustomRow title={isPayeasy ? '収納機関番号' : '企業コード'}>
              {conveni.kigyou_code}
            </CustomRow>
          }
          {isPayeasy &&
            <CustomRow title='お客様番号'>
              入力した電話番号
            </CustomRow>
          }
          <CustomRow title={conveniType.codeLabel}>
            {conveni.receipt_no}
          </CustomRow>
          <CustomRow title='有効期限'>
            {shortDateString(new Date(conveni.conveni_limit))}
            {moment().isAfter(conveni.conveni_limit, 'day') && <span style={{color: red[500]}}>期限切れ</span>}
          </CustomRow>
        </TableBody>
      </Table>
      <div style={{padding: 10}}>
        <h4>お支払い方法</h4>
        <div style={{marginTop: 5, fontSize: 13, whiteSpace: 'pre-wrap'}}>
          {isPayeasy &&
            <p style={{marginBottom: 5}}>ペイジーは<a href='http://www.pay-easy.jp/where/list.php?c=1#list' target='_blank' rel='noopener noreferrer'>全国ほぼ全ての金融機関</a>でご利用できます。</p>
          }
          {conveniType.howto}
          {isPayeasy &&
            <p style={{marginTop: 5}}>詳しいご利用方法は<a href='http://www.pay-easy.jp/howto/' target='_blank' rel='noopener noreferrer'>ペイジーの使い方</a>をご覧ください。</p>
          }
        </div>
      </div>
    </div>
  )
}

export default ConveniInfo
