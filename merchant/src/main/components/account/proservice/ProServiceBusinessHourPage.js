import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'

import { updateBusinessHour } from 'modules/schedule'
import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice//ProServiceProgress'
import { businessHourFormSetting, BusinessHourFields } from 'components/pros/BusinessHourEdit'

@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '20px 0',
    color: theme.palette.grey[800],
  },
  card: {
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
    padding: 10,
    marginBottom: 30,
  },
}), { withTheme: true })
@reduxForm(businessHourFormSetting)
@connect(
  state => ({
    user: state.auth.user,
  }),
  { updateBusinessHour }
)
export default class ProServiceBusinessHourPage extends React.Component {
  constructor(props) {
    super(props)
    const {
      location: { pathname },
      match: { params: { id } },
    } = props

    if (this.props.user.schedule) this.props.initialize(this.props.user.schedule)

    const isSetup = /setup\-services/.test(pathname)
    this.state = {
      prevPage: isSetup ? `/setup-services/${id}/introduction` : `/account/services/${id}`,
      nextPage: isSetup ? `/setup-services/${id}/descriptions` : `/account/services/${id}`,
      submitLabel: isSetup ? '更新して次へ' : '営業時間を更新する',
    }
  }

  saveAndExit = values => {
    return this.submit(values).then(() => this.props.history.push('/account/services'))
  }

  onSubmit = values => {
    return this.submit(values).then(() => this.props.history.push(this.state.nextPage))
  }

  submit = values => {
    return this.props.updateBusinessHour(values)
  }

  render () {
    const { location: { pathname }, handleSubmit, error, warning, classes, theme } = this.props
    const { submitLabel, prevPage } = this.state
    const isSetup = /setup\-services/.test(pathname)

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer stepper={isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null} submitLabel={submitLabel} prevPage={prevPage}>
          <h3 className={classes.title}>
            営業時間を設定しましょう
          </h3>
          <div className={classes.card}>
            <BusinessHourFields error={error} warning={warning} palette={theme.palette} />
          </div>
        </ProServiceContainer>
      </form>
    )
  }
}
