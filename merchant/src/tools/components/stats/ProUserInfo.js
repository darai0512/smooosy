import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Table, TableBody, Button, TextField, MenuItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { update } from 'tools/modules/auth'
import { add as addPoint } from 'tools/modules/point'
import CustomRow from 'components/CustomRow'
import UserModal from 'tools/components/UserModal'
import TelLink from 'components/TelLink'
import CustomChip from 'components/CustomChip'
import ConveniInfo from 'components/ConveniInfo'
import PointTable from 'components/PointTable'
import ConfirmDialog from 'components/ConfirmDialog'
import { idInvalidReason } from '@smooosy/config'

@withStyles(theme => ({
  bounce: {
    color: theme.palette.red[500],
  },
  chip: {
    color: theme.palette.common.white,
    background: theme.palette.secondary.main,
  },
  conveni: {
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  pointTable: {
    border: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: 0,
    marginTop: 5,
  },
}))
@connect(
  state => ({
    admin: state.auth.admin,
  }),
  { update, addPoint }
)
export default class ProUserInfo extends React.Component {
  state = {
    userModal: false,
    pointModal: false,
    point: 1,
    expiredAt: 12,
    addPointType: 'limited',
  }

  addPoint = () => {
    const body = {
      point: this.state.point,
      type: this.state.addPointType,
    }
    if (body.type === 'limited') {
      body.expiredAt = moment().add(this.state.expiredAt, 'month').endOf('month').toDate()
    }
    this.props.addPoint(this.props.pro.id, body)
    .then(() => {
      this.setState({point: 1, expiredAt: 12, addPointType: 'limited', pointModal: false})
    }).catch(e => {
      window.alert(e.message)
    })
  }

  confirmInboundLink = () => {
    this.props.update({id: this.props.pro.id, inboundLink: true})
      .then(() => this.props.onUpdate())
  }

  render() {
    const { pro, point, admin, classes } = this.props
    const identificationInvalid = (pro.identification || {}).status === 'invalid'

    return (
      <Table>
        <TableBody>
          <CustomRow title='ユーザー情報'>
            <h5><a onClick={() => this.setState({userModal: true})}>{pro.lastname} {pro.firstname}</a></h5>
            {admin > 1 && <p>{pro.id}</p>}
            {admin > 1 && <p>{pro.token}</p>}
          </CustomRow>
          <UserModal open={!!this.state.userModal} onClose={() => this.setState({userModal: false})} user={pro} admin={admin} />
          {admin > 1 &&
            <CustomRow title='メール送信'>
              <a href={`mailto:${pro.email}`}>{pro.email}</a> {pro.bounce && <span className={classes.bounce}>バウンス</span>}
            </CustomRow>
          }
          {admin > 1 &&
            <CustomRow title='電話番号'><TelLink phone={pro.phone} /></CustomRow>
          }
          <CustomRow title='Intercom情報'>
            <p>{pro.intercomURL && <a href={pro.intercomURL} target='_blank' rel='noopener noreferrer'>Intercomに移動</a>}</p>
            <p><b>セッション</b>: {pro.sessionCount}</p>
            <p><b>UA</b>: {pro.userAgent}</p>
            <p><b>IP</b>: {pro.lastSeenIp}</p>
            {pro.locationData &&
              <p>
                <b>場所</b>
                : {[
                  pro.locationData.postal_code,
                  pro.locationData.country_name,
                  pro.locationData.region_name,
                  pro.locationData.city_name,
                ].join(' ')}
              </p>
            }
          </CustomRow>
          <CustomRow title='連携'>
            <p>LINEログイン: {pro.lineId ? 'YES': 'NO'}</p>
            <p>LINE連携: {pro.lineProfile ? pro.lineProfile.blocked ? 'BLOCKED' : 'YES' : 'NO'}</p>
            <p>Google: {pro.googleId ? 'YES': 'NO'}</p>
            <p>Facebook: {pro.facebookId ? 'YES': 'NO'}</p>
          </CustomRow>
          <CustomRow title='クレジット登録'>
            {pro.hasActiveCard ? 'YES' : 'NO'}
            {pro.isInArrears ? <span className={classes.bounce}>クレジット決済に失敗</span> : ''}
          </CustomRow>
          {pro.conveniInfo &&
            <CustomRow title='コンビニ支払い'>
              <CustomChip className={classes.chip} label='支払い待ち状態です' />
              <div className={classes.conveni}>
                <ConveniInfo conveni={pro.conveniInfo} />
              </div>
            </CustomRow>
          }
          <CustomRow title='ポイント'>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
              <div style={{marginRight: 10}}>
                <p>購入: {point ? point.sum.bought : ''} pt</p>
                <p>期限: {point ? point.sum.limited: ''} pt</p>
              </div>
              {admin > 9 &&
                <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({pointModal: true})}>ポイント操作</Button>
              }
            </div>
            {point && <PointTable transactions={point.transactions} className={classes.pointTable} short />}
          </CustomRow>
          <CustomRow title='プロバッチ' hideBorder={true}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div>
                <p>{pro.inboundLink ? '設置済み' : '未設置'}</p>
              </div>
              {!pro.inboundLink && <Button size='small' variant='contained' color='primary' style={{marginLeft: 10}} onClick={this.confirmInboundLink}>設置確認OK</Button>}
            </div>
          </CustomRow>
          {
            identificationInvalid &&
            <CustomRow title='本人確認NG理由' hideBorder={true}>
              {idInvalidReason[pro.identification.invalidReason] || ''}
            </CustomRow>
          }
        </TableBody>
        <ConfirmDialog
          title={`「${pro.lastname}${pro.firstname ? ` ${pro.firstname}` : ''}」のポイントを操作します`}
          open={!!this.state.pointModal}
          onSubmit={this.addPoint}
          onClose={() => this.setState({pointModal: false})}
        >
          <div style={{display: 'flex'}}>
            <TextField
              select
              label='タイプ'
              value={this.state.addPointType}
              onChange={e => this.setState({addPointType: e.target.value})}
            >
              <MenuItem value='limited'>期限ポイント付与</MenuItem>
              <MenuItem value='bought'>銀行振込に応じて購入ポイント付与</MenuItem>
              <MenuItem value='consume'>ポイント削減</MenuItem>
            </TextField>
            <div style={{width: 10}} />
            <TextField
              type='number'
              label='ポイント'
              inputProps={{min: 0}}
              value={this.state.point}
              onChange={e => this.setState({point: e.target.value})}
            />
            <div style={{width: 10}} />
            {this.state.addPointType === 'limited' &&
              <TextField
                select
                label='期限'
                value={this.state.expiredAt}
                onChange={e => this.setState({expiredAt: e.target.value})}
              >
                {[...Array(4)].map((_, i) =>
                  <MenuItem key={i} value={(i+1)*3}>
                    {`${(i+1)*3}ヶ月（${moment().add((i+1)*3, 'month').endOf('month').format('M月末')}）`}
                  </MenuItem>
                )}
              </TextField>
            }
          </div>
        </ConfirmDialog>
      </Table>
    )
  }
}
