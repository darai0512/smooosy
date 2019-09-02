import React from 'react'
import moment from 'moment'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { update as updateSchedule } from 'modules/schedule'
import { load as loadMeet } from 'modules/meet'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import ConfirmDialog from 'components/ConfirmDialog'
import TelLink from 'components/TelLink'

@connect(
  () => ({}),
  { updateSchedule, loadMeet }
)
@withTheme
@withRouter
export default class BookingChat extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  handleCancel = () => {
    const { schedule } = this.props
    this.props.updateSchedule({
      _id: schedule._id,
      status: 'cancel',
    }).then(() => {
      this.props.loadMeet(schedule.meet)
      this.setState({cancelModal: false})
    })
  }

  render() {
    const { action, schedule, me, meet, theme } = this.props

    const { common, grey, blue } = theme.palette

    const styles = {
      booking: {
        width: 220,
        margin: '0 10px',
        borderRadius: 12,
        fontSize: 14,
        border: `1px solid ${action === 'accept' ? blue.B200 : grey[300]}`,
      },
      bookingTitle: {
        padding: 5,
        fontWeight: 'bold',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        background: action === 'accept' ? blue.B200 : grey[100],
        color: action === 'accept' ? common.white : common.black,
        borderBottom: `1px solid ${action === 'accept' ? blue.B200 : grey[300]}`,
      },
      bookingBody: {
        padding: '0 5px 5px',
        fontSize: 12,
      },
      subtitle: {
        color: grey[500],
        marginTop: 5,
      },
    }

    if (action === 'new' && meet) {
      return (
        <div style={{margin: '10px 0 0 36px'}}>
          <div style={styles.booking}>
            <div style={styles.bookingTitle}>プロと電話・対面で相談</div>
            <Button style={{width: '100%', borderBottomLeftRadius: 12, borderBottomRightRadius: 12}} color='primary' onClick={() => this.props.history.push(`/requests/${meet.request.id}/responses/${meet.id}/booking`)} >プロの空き時間を見る</Button>
          </div>
        </div>
      )
    }

    const startTime = moment(schedule.startTime)
    const endTime = moment(schedule.endTime)
    const expired = endTime.isBefore(moment())

    return (
      <div style={styles.booking}>
        <div style={styles.bookingTitle}>
          {{phone: '電話相談', consulting: '対面相談', job: '仕事日程'}[schedule.type]}
          の
          {{request: 'リクエスト', decline: '辞退', accept: '確定', cancel: 'キャンセル'}[action]}
        </div>
        <div style={styles.bookingBody}>
          <div style={styles.subtitle}>日時</div>
          <div>
            {startTime.format('M/DD')} {['日', '月', '火', '水', '木', '金', '土'][startTime.weekday()]}
            <span />
            {startTime.format('H:mm')}
            <span> - </span>
            {endTime.format('H:mm')}
          </div>
          {['pending', 'accept'].indexOf(schedule.status) !== -1 && schedule.user !== me.id && !expired &&
            <a onClick={() => this.setState({cancelModal: true})}>キャンセル</a>
          }
          {['request', 'accept'].indexOf(action) !== -1 &&
            <div>
              <div style={styles.subtitle}>
                {schedule.type !== 'phone' ?
                  '場所'
                : schedule.info.owner === me.id ?
                  '相手がこの番号に電話します'
                :
                  'この番号に電話しましょう'
                }
              </div>
              <div>
                {schedule.type !== 'phone' && schedule.info.address ?
                  <a href={`https://maps.google.co.jp/?q=${encodeURIComponent(schedule.info.address)}`} target='_blank' rel='nofollow noopener noreferrer'>
                    {schedule.info.address}
                  </a>
                : schedule.type === 'phone' && schedule.info.phone ?
                  <TelLink phone={schedule.info.phone} gaEvent={{action: 'BookingChat_click', id: schedule.id}} />
                : schedule.user === me.id ?
                  '設定しましょう'
                :
                  'プロが設定します'
                }
              </div>
              <div style={styles.subtitle}>ステータス</div>
              <div>
                {schedule.status === 'decline' ?
                  '辞退'
                : schedule.status === 'cancel' ?
                  'キャンセル'
                : expired ?
                  (schedule.status === 'pending' ? '期限切れ' : '完了')
                : schedule.status === 'pending' ?
                  '返答待ち'
                : schedule.status === 'accept' ?
                  '確定'
                : null}
              </div>
            </div>
          }
        </div>
        {schedule.status === 'pending' && schedule.user === me.id && !expired ?
          <div style={{display: 'flex', alignItems: 'stretch', borderTop: `1px solid ${grey[300]}`}}>
            <Button style={{flex: 1, borderBottomLeftRadius: 12}} onClick={() => this.props.history.push(`/pros/schedules/${schedule.id}/edit`)} >辞退する</Button>
            <Button style={{flex: 1, borderBottomRightRadius: 12, borderLeft: `1px solid ${grey[300]}`}} color='primary' onClick={() => this.props.history.push(`/pros/schedules/${schedule.id}/edit`)} >受諾する</Button>
          </div>
        : action === 'accept' && schedule.user === me.id && !expired ?
          <Button style={{width: '100%', borderTop: `1px solid ${grey[300]}`, borderBottomLeftRadius: 12, borderBottomRightRadius: 12}} color='primary' onClick={() => this.props.history.push(`/pros/schedules/${schedule.id}/edit`)} >詳細を見る</Button>
        :
          null
        }
        <ConfirmDialog
          open={!!this.state.cancelModal}
          title={'本当にキャンセルしますか'}
          label='はい'
          cancelLabel='いいえ'
          onSubmit={this.handleCancel}
          onClose={() => this.setState({cancelModal: false})}
        >
          <div style={styles.subtitle}>日時</div>
          <div>
            {startTime.format('M/DD')} {['日', '月', '火', '水', '木', '金', '土'][startTime.weekday()]}
            <span />
            {startTime.format('H:mm')}
            <span> - </span>
            {endTime.format('H:mm')}
          </div>
        </ConfirmDialog>
      </div>
    )
  }
}

