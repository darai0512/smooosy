import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { updateBusinessHour } from 'modules/schedule'
import { Avatar, Button, MenuItem, CircularProgress } from '@material-ui/core'
import renderSelect from 'components/form/renderSelect'
import NavigationCheck from '@material-ui/icons/Check'
import NavigationClose from '@material-ui/icons/Close'
import { withTheme } from '@material-ui/core/styles'
import { amber } from '@material-ui/core/colors'


export const businessHourFormSetting = {
  form: 'schedule',
  initialValues: {
    dayOff: new Array(7).fill(false),
    startTime: 8,
    endTime: 19,
  },
  validate: (values) => {
    if (values.startTime === values.endTime) {
      return {_error: '開始時間と終了時間は同じにできません'}
    }
  },
  warn: (values) => {
    if (values.startTime > values.endTime) {
      return {_warning: '夜通しの時間設定です'}
    }
  },
}

@reduxForm(businessHourFormSetting)
@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateBusinessHour }
)
@withTheme
export default class BusinessHourEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    if (props.user.schedule) {
      if (props.user.schedule.dayOff.length === 0) {
        props.user.schedule.dayOff = new Array(7).fill(false)
      }
      props.initialize(props.user.schedule)
    }
  }

  handleSubmit = (values) => {
    return this.props.updateBusinessHour(values)
      .then(() => this.props.onSubmit())
  }

  render() {
    const { handleSubmit, error, warning, invalid, submitting, hideSubmitButton, theme } = this.props

    const styles = {
      main: {
        width: '90%',
        maxWidth: 640,
        margin: '30px auto',
      },
    }

    return (
      <form style={styles.main} onSubmit={handleSubmit(this.handleSubmit)}>
        <BusinessHourFields error={error} warning={warning} palette={theme.palette} />
        {!hideSubmitButton &&
          <Button variant='contained'
              type='submit'
              disabled={invalid || submitting}
              color='primary'
              style={{width: '100%', marginTop: 10, height: 50}}
            >
            {submitting ? <CircularProgress size={20} color='secondary' /> : '更新する'}
          </Button>
        }
      </form>
    )
  }
}

export const BusinessHourFields = ({error, warning, palette: { grey, red, blue } }) => (
  <div>
    <div style={{fontSize: 16, fontWeight: 'bold', margin: '20px 0 10px'}}>
      何曜日に仕事をしますか？
    </div>
    <div style={{display: 'flex'}}>
      {[...Array(7)].map((_, dayOfWeek) =>
        <div key={dayOfWeek} style={{textAlign: 'center', margin: 5}}>
          <p>{['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]}</p>
          <Field name={`dayOff.${dayOfWeek}`} component={
            ({ input: { value, onChange } }) => (
              <Avatar
                alt={value ? '閉じる' : 'チェック'}
                style={{ width: 32, height: 32, backgroundColor: value ? grey[500] : blue[500] }}
                onClick={() => onChange(!value)}
              >
                {value ? <NavigationClose /> : <NavigationCheck />}
              </Avatar>
            )}
          />
        </div>
      )}
    </div>
    <div style={{fontSize: 16, fontWeight: 'bold', margin: '20px 0 10px'}}>
      仕事可能な時間
    </div>
    <div style={{display: 'flex', alignItems: 'flex-end', maxWidth: 400}}>
      <Field style={{flex: 1, minWidth: 130}} name='startTime' label='開始時間' component={renderSelect}>
        {[...Array(25)].map((_, hour) =>
          <MenuItem key={hour} value={hour} >{`${hour}:00`}</MenuItem>
        )}
      </Field>
      <p style={{margin: '10px', fontWeight: 'bold'}}>〜</p>
      <Field style={{flex: 1, minWidth: 130}} name='endTime' label='終了時間' component={renderSelect}>
        {[...Array(25)].map((_, hour) =>
          <MenuItem key={hour} value={hour} >{`${hour}:00`}</MenuItem>
        )}
      </Field>
    </div>
    <div style={{height: 20, fontSize: 13, color: error ? red[500] : warning ? amber[700] : grey[500]}}>{error || warning}</div>
  </div>
)
