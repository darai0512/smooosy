import React from 'react'
import moment from 'moment'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core'
import RightArrowIcon from '@material-ui/icons/ArrowForward'

const RequestEditLog = (props) => {
  if (!props.editLog) return null
  const styles = {
    title: {
      padding: 10,
      background: '#eee',
      borderTop: '1px solid #ddd',
      borderBottom: '1px solid #ddd',
    },
  }

  const types = {
    interview: '要CSチェック',
    additionalStatus: '管理ステータス',
    description: '回答内容',
    status: 'ステータス',
    cancelPass: 'パスをキャンセル',
    point: 'ポイント',
    distance: '距離',
    supportStatus: '聞き取りステータス',
    phone: '電話番号',
  }

  const description = (type, text) => {
    if (type === 'interview') {
      return text.split(',').map(t => props.interviewDescription[t]).join('\n')
    } else if (type === 'distance') {
      return Number.isNaN(+text) ? text : (text/1000 + 'km')
    }
    return text
  }

  const logs = props.editLog.slice().reverse()
  return (
    <div>
      <h4 style={styles.title}>変更履歴</h4>
      <div style={{maxHeight: 300, overflowY: 'scroll'}}>
        {logs.length ?
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{width: 160}}>日時</TableCell>
                <TableCell style={{width: 150}}>編集者</TableCell>
                <TableCell>編集箇所</TableCell>
                <TableCell><div style={{display: 'flex', alignItems: 'center'}}>変更前<RightArrowIcon />変更後</div></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map(log => {
                const before = description(log.editType, log.before)
                const after = description(log.editType, log.after)
                const type = log.editType === 'description' ? `${types[log.editType]}: ${log.description}` : types[log.editType]
                return (
                  <TableRow key={log.id}>
                    <TableCell>{moment(log.createdAt).format('MM/DD HH:mm')}</TableCell>
                    <TableCell>{`${log.user.lastname} ${log.user.firstname}`}</TableCell>
                    <TableCell>{type}</TableCell>
                    <TableCell style={{maxWidth: 550}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <div style={{whiteSpace: 'pre-wrap'}}>{before || 'none'}</div>
                        <RightArrowIcon />
                        <div style={{whiteSpace: 'pre-wrap'}}>{after || 'none'}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        :
        <div style={{margin: 10}}>なし</div>
        }
      </div>
    </div>
  )
}

export default RequestEditLog
