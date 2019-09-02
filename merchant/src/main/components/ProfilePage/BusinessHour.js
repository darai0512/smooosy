import React from 'react'
import { withStyles } from '@material-ui/core/styles'

const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']

const BusinessHour = ({classes, schedule}) => (
  <div>
    <h2 className={classes.title}>営業時間</h2>
    <div className={classes.businessHours}>
      {schedule.dayOff.map((d, idx) =>
        <div key={`weekday_${idx}`} className={classes.businessHour}>
          <div className={classes.weekday}>{weekdays[idx]}</div>
          <div>{!d ? `${schedule.startTime}時 〜 ${schedule.endTime}時まで` : '定休日'}</div>
        </div>
      )}
    </div>
  </div>
)

export default withStyles({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: '10px 0',
  },
  businessHours: {
    maxWidth: 350,
    marginBottom: 60,
  },
  businessHour: {
    fontSize: 16,
    display: 'flex',
  },
  weekday: {
    width: 100,
  },
})(BusinessHour)
