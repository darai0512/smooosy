import React from 'react'
import moment from 'moment'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import CommunicationPhone from '@material-ui/icons/Phone'
import SocialPeople from '@material-ui/icons/People'
import ActionQuestionAnswer from '@material-ui/icons/ChevronRight'
import { withTheme } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'

@withWidth()
@connect(
  state => ({
    bookings: state.schedule.schedules.filter(s => s.type !== 'block'),
  }),
  {}
)
@withTheme
@withRouter
export default class Booking extends React.PureComponent {
  render() {
    const { bookings, width, theme } = this.props
    const { common, grey, blue } = theme.palette

    const styles = {
      root: {
      },
      list: {
        background: common.white,
        borderLeft: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        borderRight: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      blank: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
      },
      date: {
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
        background: grey[50],
        padding: '5px 10px',
      },
      bookingButton: {
        height: 'initial',
        lineHeight: 'initial',
        textAlign: 'left',
        width: '100%',
      },
      booking: {
        display: 'flex',
        fontSize: 14,
        width: '100%',
      },
      time: {
        textAlign: 'right',
        padding: '0 10px',
      },
      schedule: {
        marging: '0 10px',
        padding: '0 10px',
        minHeight: 60,
        borderLeft: `3px solid ${blue.A200}`,
        flex: 1,
        display: 'flex',
      },
      status: {
        textAlign: 'right',
      },
    }

    const infomation = {
      phone: {
        icon: <CommunicationPhone />,
        act: 'に電話しましょう',
        react: 'に電話する予定です',
      },
      consulting: {
        icon: <ActionQuestionAnswer />,
        act: 'に訪問しましょう',
        react: 'に来訪する予定です',
      },
      job: {
        icon: <SocialPeople />,
        act: 'に訪問しましょう',
        react: 'に来訪する予定です',
      },
    }

    let prevDate = null
    return (
      <div style={styles.root}>
        <div style={styles.list}>
          {bookings.length === 0 && <div style={styles.blank}>この週に仕事の予約はありません</div>}
          {bookings.map(s => {
            const action = s.info.owner === s.meet.customer.id ? 'act' : 'react'
            const infoType = s.type === 'phone' ? 'phone' : 'address'
            const time = moment(s.startTime)
            const showDate = time.date() !== prevDate
            prevDate = time.date()
            return (
              <div key={s.id} style={{color: time.isBefore(moment()) ? grey[500] : common.black}}>
                {showDate &&
                  <div style={styles.date}>
                    {time.format('M/DD')} {['日', '月', '火', '水', '木', '金', '土'][time.weekday()]}
                  </div>
                }
                <Button style={styles.bookingButton} onClick={() => this.props.history.push(`/pros/schedules/${s.id}/edit`)}>
                  <div style={styles.booking}>
                    <div style={styles.time}>
                      <p>{time.format('H:mm')}</p>
                      <p>{moment(s.endTime).format('H:mm')}</p>
                    </div>
                    <div style={styles.schedule}>
                      {infomation[s.type].icon}
                      <div style={{marginLeft: 10}}>
                        <div style={{fontWeight: 'bold'}}>{s.meet.customer.lastname}様</div>
                        {s.info[infoType] ?
                          <div>
                            {action === 'react' && '顧客が'}
                            {s.info[infoType]}
                            {infomation[s.type][action]}
                          </div>
                        :
                          <div>{infoType === 'phone' ? '電話番号' :'住所'}を指定しましょう</div>
                        }
                      </div>
                    </div>
                    <div style={styles.status}>
                      {moment(s.endTime).isBefore(moment()) ?
                        <div style={{color: grey[500]}}>{s.status === 'pending' ? '期限切れ' : '完了'}</div>
                      : s.status === 'pending' ?
                        <div style={{color: red[500]}}>要返答</div>
                      : s.status === 'accept' ?
                        '確定'
                      : null}
                    </div>
                  </div>
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
