import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles, Dialog, DialogTitle, Button, DialogActions } from '@material-ui/core'

import { update as updateProService } from 'modules/proService'
import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice//ProServiceProgress'
import GoogleMapEdit from 'components/GoogleMapEdit'
import { withApiClient } from 'contexts/apiClient'

@connect(
  state => ({
    proService: state.proService.proService,
  }),
  { updateProService }
)
@reduxForm({
  form: 'proServiceLocation',
})
@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '20px 0',
    color: theme.palette.grey[800],
  },
  paper: {
    padding: 20,
    marginBottom: 30,
    background: theme.palette.common.white,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
  },
}))
export default class ProServiceLocationPage extends React.Component {

  constructor(props) {
    super(props)
    const {
      location: { pathname },
      match: { params: { id } },
    } = props

    this.isSetup = /setup\-services/.test(pathname)
    this.state = {
      location: null,
      open: false,
      prevPage: this.isSetup ? `/setup-services/${id}/descriptions` : `/account/services/${id}`,
      nextPage: this.isSetup ? `/setup-services/${id}/job-requirements` : `/account/services/${id}`,
      submitLabel: this.isSetup ? '更新して次へ' : '仕事エリアを更新する',
    }
  }

  onMapChange = (location) => {
    this.setState({location})
    if (!location) return
    const { loc, address, prefecture, city } = location
    this.props.change('loc', loc)
    this.props.change('address', address)
    this.props.change('prefecture', prefecture)
    this.props.change('city', city)
  }

  onDistanceChange = (distance) => {
    this.props.change('distance', distance)
  }

  saveAndExit = values => {
    return this.submit(values).then(() => this.props.history.push('/account/services'))
  }

  onSubmit = values => {
    return this.submit(values)
      .then(() => this.setState({open: true}))
  }

  submit = ({loc, address, prefecture, city, distance}) => {
    return this.props.updateProService(
      this.props.match.params.id,
      {loc, address, prefecture, city, distance:  distance || this.props.proService.distance, setupLocation: true }
    )
  }

  onCloseDialog = () => {
    this.setState({open: false})
    this.props.history.push(this.state.nextPage)
  }

  render () {
    const { location: { pathname }, handleSubmit, submitting, proService, classes } = this.props
    const { location, submitLabel, prevPage, open } = this.state
    if (!proService) return null
    const service = proService.service

    return (
      <>
        <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
          <ProServiceContainer
            stepper={this.isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
            submitLabel={submitLabel}
            submitDisabled={submitting || !location}
            prevPage={prevPage}
          >
            <h3 className={classes.title}>
              {service.name}の仕事エリアを再確認してください
            </h3>
            <div className={classes.paper}>
              {service.matchMoreEditable ?
              <GoogleMapEdit zoom={9} loc={proService.loc} address={proService.address} distance={proService.distance || service.distance || 50000} onChange={this.onMapChange} onDistanceChange={this.onDistanceChange} />
              : <GoogleMapEdit loc={proService.loc} address={proService.address} onChange={this.onMapChange} />
              }
            </div>
          </ProServiceContainer>
        </form>
        <UpdateAllProServiceLocationsDialog type='location' open={open} onClose={this.onCloseDialog} />
      </>
    )
  }
}

@withApiClient
@withStyles(theme => ({
  abort: {
    color: theme.palette.red[700],
    flex: 1,
  },
  confirm: {
    color: theme.palette.blue[700],
    flex: 1,
  },
  buttons: {
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
}))
@connect(state => ({
  proService: state.proService.proService,
}))
export class UpdateAllProServiceLocationsDialog extends React.Component {
  onSubmit = (value) => {
    const { type, proService } = this.props
    if (value === 'confirm') {
      return this.props.apiClient.put(`/api/pros/services/all/${type}`, {sameAs: proService._id})
        .then(() => this.props.onClose())
    }
    this.props.onClose()
  }

  render() {
    const { open, onClose, classes, proService } = this.props

    return (
      <Dialog
        open={open}
        onClose={onClose}
      >
        <DialogTitle>仕事エリアの変更を「{proService.profile.name}」の全てのサービスに反映しますか？</DialogTitle>
        <DialogActions className={classes.buttons}>
          <Button className={classes.abort} onClick={() => this.onSubmit('abort')}>このサービスのみを変更する</Button>
          <Button className={classes.confirm} onClick={() => this.onSubmit('confirm')}>全てのサービスに反映する</Button>
        </DialogActions>
      </Dialog>
    )
  }
}