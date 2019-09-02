import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, formValueSelector } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'
import { Button, Tooltip } from '@material-ui/core'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'

import { update as updateService } from 'tools/modules/service'
import { open as openSnack } from 'tools/modules/snack'
import renderSwitch from 'components/form/renderSwitch'

const selector = formValueSelector('matchingForm')

@connect(
  state => ({
    showJobRequirements: selector(state, 'showJobRequirements'),
    useTargetLocations: selector(state, 'useTargetLocations'),
  }),
  { updateService, openSnack }
)
@reduxForm({
  form: 'matchingForm',
})
@withStyles(theme => ({
  root: {
    padding: 10,
  },
  section: {
    marginBottom: 10,
  },
  error: {
    fontWeight: 'bold',
    color: theme.palette.red[500],
  },
  budget: {
    display: 'flex',
  },
  tooltipIcon: {
    verticalAlign: 'middle',
  },
}))
export default class MatchingForm extends React.Component {
  submit = values => {
    const data = {
      id: values.id,
      showJobRequirements: values.showJobRequirements,
      useTargetLocations: values.useTargetLocations,
    }

    return this.props.updateService(data)
      .then(() => this.props.openSnack('保存しました'))
      .catch(err => {
        this.props.openSnack('Failed to update service: ' + err.message || err)
      })
  }

  render() {
    const { classes, handleSubmit } = this.props

    return (
      <form className={classes.root}>
        <div>
          <Field name='showJobRequirements' label='プロに仕事条件を設定させる' component={renderSwitch} />
          <Tooltip title='プロのサービス設定画面に仕事条件を表示させます。ご指名の場合は、この設定に関係なく表示されます。'>
            <HelpOutlineIcon className={classes.tooltipIcon} />
          </Tooltip>
        </div>
        <div>
          <Field name='useTargetLocations' label='エリアマッチを有効にする' component={renderSwitch} />
          <Tooltip title='エリアマッチを有効にします。プロはサービス設定画面で市区町村レベルのエリア選択をできるようになります。エリアに合致した依頼は依頼一覧の上に表示されます。'>
            <HelpOutlineIcon className={classes.tooltipIcon} />
          </Tooltip>
        </div>
        <div>
          <Button variant='contained' color='secondary' style={{marginTop: 10}} onClick={handleSubmit(this.submit)}>
            保存する
          </Button>
        </div>
      </form>
    )
  }
}
