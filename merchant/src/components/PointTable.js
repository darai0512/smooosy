import React from 'react'
import moment from 'moment'
import { Table, TableBody } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CustomRow from 'components/CustomRow'

@withTheme
export default class PointTable extends React.Component {
  static defaultProps = {
    transactions: [],
    style: {},
  }

  getRefundCustomerText = (transaction) => {
    if (!transaction.meet || !transaction.meet.customer || !transaction.meet.customer.lastname) {
      return ''
    }
    return `（${transaction.meet.customer.lastname}様）`
  }

  render() {
    const { transactions, style, className, short, theme } = this.props
    const { grey } = theme.palette
    const format = short ? 'MM/DD HH:mm' : 'YYYY/MM/DD HH:mm'
    return (
      <Table style={style} className={className}>
        <TableBody>
          {transactions.length > 0 ? transactions.map(t =>
            <CustomRow key={t.id} title={moment(t.createdAt).format(format)}>
              {t.type === 'bought' ?
                `${t.point}ptを購入`
              : t.type === 'autoCharge' ?
                `${t.point}ptをオートチャージ`
              : t.type === 'limited' ?
                (t.user === t.operator ? `${t.point}ptを獲得` : `[運営] ${t.point}pt付与しました`) + `（期限: ${moment(t.expiredAt).format('YYYY年MM月末')}）`
              : t.type === 'consume' ?
                (t.user === t.operator ? `${-t.point}ptを利用` : `[運営] ${-t.point}pt削減しました`)
              : t.type === 'expire' ?
                `${moment(t.expiredAt).format('YYYY年MM月末')}期限の${-t.point}ptが失効しました`
              : t.type === 'delete' ?
                `最終利用日から2年経過したので${-t.point}ptが失効しました`
              : t.type === 'refund' ?
                `${t.point}ptを返還しました${this.getRefundCustomerText(t)}`
              : t.type === 'refundStarterPoint' ?
                `${t.point}ptを返還しました`
              : null}
            </CustomRow>
          )
          :
            <tr><td style={{padding: '40px 0', textAlign: 'center', borderBottom: `1px solid ${grey[300]}`}}>履歴はありません</td></tr>
          }
        </TableBody>
      </Table>
    )
  }
}
