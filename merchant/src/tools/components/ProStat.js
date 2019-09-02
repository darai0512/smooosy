import React from 'react'
import { Table, TableBody } from '@material-ui/core'

import CustomRow from 'components/CustomRow'

const round = (num, digit = 1) => Math.round(num * Math.pow(10, digit)) / Math.pow(10, digit)

const ProStat = ({stat}) => (
  <Table>
    <TableBody>
      <CustomRow title='成約率'>
        {round(stat.hiredRate * 100, 2)}%
        ({stat.hiredCount}/{stat.meetsCount})
      </CustomRow>
      <CustomRow title='成約金額'>{stat.hiredPrice.toLocaleString()}円</CustomRow>
      <CustomRow title='課金額'>{stat.chargePrice.toLocaleString()}円</CustomRow>
      <CustomRow title='ROI'>
        <div>{round(stat.returnOnInvestment, 2)}</div>
        <div>
          <span>手数料: </span>
          {stat.returnOnInvestment ? round(1 / stat.returnOnInvestment * 100, 2) : '-'}%
        </div>
      </CustomRow>
      <CustomRow title='見積もり数変化'>
        {round(stat.meetsCountLast3Months, 2)}
        {'->'}
        {round(stat.meetsCountLast1Month, 2)}
      </CustomRow>
      <CustomRow title='見積もり率変化'>
        {round(stat.meetRateLast3Months, 2)}
        {'->'}
        {round(stat.meetRateLast1Month, 2)}
      </CustomRow>
    </TableBody>
  </Table>
)
export default ProStat
