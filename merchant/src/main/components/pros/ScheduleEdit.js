import React from 'react'
import moment from 'moment'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { load as loadSchedule, update as updateSchedule } from 'modules/schedule'
import { readAll as readNotices } from 'modules/notice'
import { Chip, Button } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import CommunicationPhone from '@material-ui/icons/Phone'
import ActionQuestionAnswer from '@material-ui/icons/QuestionAnswer'
import SocialPeople from '@material-ui/icons/People'
import renderTextInput from 'components/form/renderTextInput'
import { withTheme } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'

@withWidth()
@reduxForm({
  form: 'schedule',
  initialValues: {
    info: {},
  },
  validate: (values) => {
    const errors = {}
    if (!values.info.phone) {
      errors.info = {phone: '必須項目です'}
    } else if (!/0\d{9,10}$/.test(values.info.phone.replace(/-/g, ''))) {
      errors.info = {phone: '正しい電話番号を入力してください'}
    }
    if (!values.info.address) {
      errors.info = {...errors.info, address: '必須項目です'}
    }
    return errors
  },
})
@connect(
  state => ({
    schedule: state.schedule.schedule,
  }),
  { loadSchedule, updateSchedule, readNotices }
)
@withTheme
export default class ScheduleEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentDidMount() {
    const id = this.props.match.params.id
    this.props.loadSchedule(id).then(({schedule}) => {
      this.props.initialize({
        _id: schedule._id,
        info: schedule.info,
      })
    })

    this.props.readNotices({
      type: 'bookingRequest',
      model: 'Schedule',
      item: id,
    })
  }

  handleSubmit = (values) => {
    const { schedule } = this.props
    const tab = schedule.meet.status === 'waiting' ? 'talking' : 'hired'
    values.status = 'accept'
    this.props.updateSchedule(values).then(() => {
      this.props.history.push(`/pros/${tab}/${schedule.meet.id}`)
    })
  }

  handleDecline = (status) => {
    const { schedule } = this.props
    const tab = schedule.meet.status === 'waiting' ? 'talking' : 'hired'
    this.props.updateSchedule({
      _id: schedule._id,
      status,
    }).then(() => {
      this.props.history.push(`/pros/${tab}/${schedule.meet.id}`)
    })
  }

  render() {
    const { schedule, width, handleSubmit, theme } = this.props
    const { common, grey, secondary } = theme.palette

    if (!schedule) return null

    const styles = {
      root: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: 500,
        margin: '20px auto',
        textAlign: 'center',
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      block: {
        margin: '20px 0',
        borderTop: `1px solid ${grey[300]}`,
        borderLeft: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        borderRight: width === 'xs' ? 0 : `1px solid ${grey[300]}`,
        textAlign: 'left',
      },
      notice: {
        textAlign: 'center',
        fontSize: 12,
        margin: '0 10px',
        color: theme.palette.grey[500],
        [theme.breakpoints.down('xs')]: {
          margin: '0px 10px',
        },
      },
      list: {
        background: common.white,
        padding: width === 'xs' ? 10 : 20,
        borderBottom: `1px solid ${grey[300]}`,
      },
      subtitle: {
        fontWeight: 'bold',
        margin: '5px 0',
      },
    }

    const time = moment(schedule.startTime)
    const tab = schedule.meet.status === 'waiting' ? 'talking' : 'hired'
    const myInfo = schedule.info.owner !== schedule.meet.customer.id
    const editable = myInfo && schedule.status !== 'decline'
    const infoType = schedule.type === 'phone' ? 'phone' : 'address'

    const infomation = {
      phone: {
        icon: <CommunicationPhone />,
        title: '電話相談',
        infoLabel: myInfo ? '受ける電話番号' : '相手の電話番号',
        info: schedule.info.phone,
        placeholder: '090-1111-2222',
      },
      consulting: {
        icon: <ActionQuestionAnswer />,
        title: '対面相談',
        infoLabel: myInfo ? '来てもらう場所' : '相手の指定場所',
        info: schedule.info.address,
        placeholder: '105-0011 東京都港区芝公園4-2−8',
      },
      job: {
        icon: <SocialPeople />,
        title: '仕事日程',
        infoLabel: myInfo ? '来てもらう場所' : '相手の指定場所',
        info: schedule.info.address,
        placeholder: '105-0011 東京都港区芝公園4-2−8',
      },
    }[schedule.type]

    return (
      <div style={styles.root}>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: 10}}>
          <Chip
            style={{backgroundColor: secondary.main, color: common.white}}
            label={
              schedule.status === 'decline' ?
              '辞退'
            : schedule.status === 'cancel' ?
              'キャンセル'
            : moment(schedule.endTime).isBefore(moment()) ?
              (schedule.status === 'pending' ? '期限切れ' : '完了')
            : schedule.status === 'pending' ?
              '要返答'
            : schedule.status === 'accept' ?
              '確定'
            : null
            }
            />
        </div>
        <div style={styles.title}>
          {infomation.icon}
          <p style={{marginLeft: 10}}>{infomation.title}の予約</p>
        </div>
        <div style={{margin: 10}}>{schedule.meet.customer.lastname}様</div>
        <div>
          <a onClick={() => this.props.history.push(`/pros/${tab}/${schedule.meet.id}`)}>チャットをする</a>
          <span>・</span>
          <a onClick={() => this.props.history.push('/pros/schedules/booking', {startTime: schedule.startTime})}>予約一覧</a>
        </div>
        <form onSubmit={handleSubmit(this.handleSubmit)}>
          <div style={styles.block}>
            <div style={styles.list}>
              <div style={styles.subtitle}>依頼の種類</div>
              <div>{schedule.meet.service.name}</div>
            </div>
            <div style={styles.list}>
              <div style={styles.subtitle}>予約の日時</div>
              <div>
                {time.format('M/DD')} {['日', '月', '火', '水', '木', '金', '土'][time.weekday()]}
                <span />
                {time.format('H:mm')}
                <span> - </span>
                {moment(schedule.endTime).format('H:mm')}
              </div>
            </div>
            <div style={styles.list}>
              <div style={styles.subtitle}>{infomation.infoLabel}</div>
              {editable ?
                <Field name={`info.${infoType}`} component={renderTextInput} placeholder={infomation.placeholder} />
              :
                <div>{infomation.info}</div>
              }
            </div>
            {schedule.type === 'job' && schedule.status === 'pending' && <div style={styles.notice}>※仕事日の翌日に案件のステータスが自動的に完了になり、クチコミ依頼が送られます。</div>}
          </div>
          {['decline', 'cancel'].indexOf(schedule.status) === -1 && !moment(schedule.endTime).isBefore(moment()) &&
            <div style={{display: 'flex', margin: width === 'xs' ? '0 10px' : 0}}>
              <Button variant='contained' style={{flex: 1, color: common.white, backgroundColor: red[500] }} onClick={() => this.handleDecline(schedule.status === 'pending' ? 'decline': 'cancel')} >{schedule.status === 'pending' ? '辞退する' : '予約のキャンセル'}</Button>
              <Button variant='contained' style={{flex: 1, marginLeft: 10}} type='submit' color='primary'  >{schedule.status === 'pending' ? '受諾する' : '更新する'}</Button>
            </div>
          }
        </form>
      </div>
    )
  }
}
