import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles } from '@material-ui/core'

import { businessHourFormSetting, BusinessHourFields } from 'components/pros/BusinessHourEdit'
import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'
import { updateBusinessHour } from 'modules/schedule'

@connect(state => ({
  proServices: state.proService.proServices,
  user: state.auth.user,
}), { updateBusinessHour })
@reduxForm(businessHourFormSetting)
@withStyles(theme => ({
  root: {
    height: '100%',
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
    WebkitOverflowScrolling: 'touch',
  },
  title: {
    textAlign: 'center',
    paddingTop: 20,
    color: theme.palette.grey[800],
    fontSize: 28,
  },
  subText: {
    color: theme.palette.grey[700],
    textAlign: 'center',
    padding: '0 5px',
  },
  section: {
    padding: 10,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
  },
  sectionRoot: {
    margin: '30px 0 10px',
  },
  confirm: {
    width: '100%',
    position: 'sticky',
    display: 'flex',
    bottom: 0,
    padding: 10,
    background: theme.palette.common.white,
    borderRadius: 0,
  },
  button: {
    fontSize: 18,
    height: 50,
    flex: 1,
  },
}), { withTheme: true })
export default class ProServiceBulkBusinessHourPage extends React.Component {
  constructor(props) {
    super(props)
    this.submitLabel = props.isSetup ? '更新して次へ' : '営業時間を更新する'
    if (props.user.schedule) props.initialize(props.user.schedule)
  }

  onSubmit = values => this.submit(values).then(this.props.next)

  saveAndExit = values => this.submit(values).then(() => this.props.history.push('/account/services'))

  submit = (values) => this.props.updateBusinessHour(values)

  render() {
    const { error, warning, handleSubmit, classes, theme, submitting, location: { pathname } } = this.props

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={this.props.isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={this.submitLabel}
          submitDisabled={submitting}
          back={this.props.back}
        >
          <h3 className={classes.title}>
            営業時間の設定
          </h3>
          <div className={classes.subText}>まずは営業時間を設定しましょう</div>
          <div className={classes.sectionWrap}>
            <div className={classes.sectionRoot}>
              <div className={classes.section}>
                <BusinessHourFields error={error} warning={warning} palette={theme.palette} />
              </div>
            </div>
          </div>
        </ProServiceContainer>
      </form>
    )
  }
}
